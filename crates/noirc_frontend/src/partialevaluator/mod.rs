use std::collections::HashMap;

use acvm::FieldElement;
use noirc_errors::Location;

use crate::{
    monomorphisation::ast::{
        ArrayLiteral, Assign, Binary, CallBuiltin, CallLowLevel, Cast, DefinitionId, ExprId,
        Expression, FuncId, Ident, If, Index, LValue, Let, Literal, Program, Type, Unary,
    },
    util::vecmap,
    BinaryOpKind, Signedness, UnaryOp,
};

pub fn evaluate(mut program: Program) -> Program {
    let main_id = program.main_id();
    let main = program.main();

    let args = vecmap(&main.parameters, |(id, mutable, name, typ)| {
        Expression::Ident(Ident {
            location: None,
            id: *id,
            mutable: *mutable,
            name: name.clone(),
            typ: typ.clone(),
        })
    });

    let args = vecmap(args, |arg| program.push_expression(arg));

    // Evaluate main and grab the resulting statements
    let mut evaluator = Evaluator::new(&mut program);
    let last_expr = evaluator.function(&mut program, main_id, args);
    let mut statements = evaluator.evaluated.pop().unwrap();
    assert!(evaluator.evaluated.is_empty());

    statements.push(last_expr);
    let main_body = program.push_expression(Expression::Block(statements));

    // Return one big main function containing every statement
    program.main().body = main_body;
    program.functions.truncate(1);
    program
}

type Scope = HashMap<DefinitionId, ExprId>;

struct Evaluator {
    call_stack: Vec<Scope>,

    /// Already-evaluated expressions representing the full program once finished
    evaluated: Vec<Vec<ExprId>>,

    unit_id: ExprId,
}

impl Evaluator {
    fn new(program: &mut Program) -> Self {
        let unit_id = program.push_expression(Expression::Literal(Literal::Unit));
        Self { call_stack: vec![], evaluated: vec![vec![]], unit_id }
    }

    fn current_scope(&mut self) -> &mut Scope {
        self.call_stack.last_mut().unwrap()
    }

    fn push_evaluated(&mut self, program: &mut Program, expr: ExprId) {
        if program[expr].has_side_effects(program) {
            self.evaluated.last_mut().unwrap().push(expr);
        }
    }

    fn push_evaluated_expr(&mut self, program: &mut Program, expr: Expression) {
        if expr.has_side_effects(program) {
            let expr = program.push_expression(expr);
            self.evaluated.last_mut().unwrap().push(expr);
        }
    }

    fn function(&mut self, program: &mut Program, f: FuncId, args: Vec<ExprId>) -> ExprId {
        let function = &program[f];
        assert_eq!(function.parameters.len(), args.len());

        let params_and_args = function.parameters.clone().into_iter().zip(args);
        let scope = params_and_args
            .map(|((id, mutable, name, typ), arg)| {
                if mutable {
                    let let_expr = Let { id, mutable: true, name: name.clone(), expression: arg };
                    self.push_evaluated_expr(program, Expression::Let(let_expr));

                    let ident = Ident { location: None, id, mutable, name, typ };
                    let var = program.push_expression(Expression::Ident(ident));
                    (id, var)
                } else {
                    (id, arg)
                }
            })
            .collect();

        self.call_stack.push(scope);
        let function = &program[f];
        let ret = self.expression(program, function.body);
        self.call_stack.pop();
        ret
    }

    fn expression(&mut self, program: &mut Program, expr: ExprId) -> ExprId {
        let expr = match &program[expr] {
            Expression::Literal(literal) => return self.literal(program, &literal.clone(), expr),
            Expression::Ident(ident) => return self.ident(program, &ident.clone()),
            Expression::Block(block) => return self.block(program, &block.clone()),
            Expression::Unary(unary) => self.unary(program, &unary.clone()),
            Expression::Binary(binary) => return self.binary(program, &binary.clone()),
            Expression::Index(index) => return self.index(program, &index.clone()),
            Expression::Cast(cast) => return self.cast(program, &cast.clone()),
            Expression::For(for_loop) => self.for_loop(program, &for_loop.clone()),
            Expression::If(if_expr) => return self.if_expr(program, &if_expr.clone()),
            Expression::Tuple(tuple) => self.tuple(program, &tuple.clone()),
            Expression::ExtractTupleField(tuple, field) => {
                return self.extract(program, *tuple, *field)
            }
            Expression::Call(call) => return self.call(program, &call.clone()),
            Expression::CallBuiltin(builtin) => self.call_builtin(program, &builtin.clone()),
            Expression::CallLowLevel(low_level) => self.call_low_level(program, &low_level.clone()),
            Expression::Let(let_stmt) => return self.let_statement(program, &let_stmt.clone()),
            Expression::Constrain(expr, loc) => return self.constrain(program, *expr, *loc),
            Expression::Assign(assign) => return self.assign(program, &assign.clone()),
            Expression::Semi(expr) => Expression::Semi(self.expression(program, *expr)),
        };
        program.push_expression(expr)
    }

    fn literal(&mut self, program: &mut Program, literal: &Literal, id: ExprId) -> ExprId {
        match literal {
            Literal::Array(array) => {
                let contents = vecmap(&array.contents, |elem| self.expression(program, *elem));
                let array = ArrayLiteral { contents, element_type: array.element_type.clone() };
                program.push_expression(Expression::Literal(Literal::Array(array)))
            }
            Literal::Integer(..) | Literal::Bool(..) | Literal::Str(..) | Literal::Unit => id,
        }
    }

    fn ident(&mut self, program: &mut Program, ident: &Ident) -> ExprId {
        let mut make_ident = || {
            program.push_expression(Expression::Ident(Ident {
                location: ident.location,
                id: ident.id,
                mutable: ident.mutable,
                name: ident.name.clone(),
                typ: ident.typ.clone(),
            }))
        };

        // Cloning here relies on `value` containing no side-effectful code.
        // Side-effectful code should be pushed to self.evaluated separately
        match self.call_stack.last().unwrap().get(&ident.id) {
            Some(value) => *value,
            None => make_ident(),
        }
    }

    fn block(&mut self, program: &mut Program, block: &[ExprId]) -> ExprId {
        let exprs = block.iter().take(block.len().saturating_sub(1));

        for expr in exprs {
            let new_expr = self.expression(program, *expr);
            self.push_evaluated(program, new_expr);
        }

        if let Some(last_expr) = block.last() {
            self.expression(program, *last_expr)
        } else {
            self.unit_id
        }
    }

    fn unary(&mut self, program: &mut Program, unary: &Unary) -> Expression {
        let rhs = self.expression(program, unary.rhs);

        match (unary.operator, &program[rhs]) {
            (UnaryOp::Minus, Expression::Literal(Literal::Integer(value, typ))) => match typ {
                Type::Field => int(-*value, typ.clone()),
                Type::Integer(Signedness::Signed, bits) => {
                    if *bits <= 128 && value.fits_in_u128() {
                        // -value = !value + 1 in two's complement
                        let value = FieldElement::from(!value.to_u128() + 1);
                        int(value, typ.clone())
                    } else {
                        Expression::Unary(Unary { operator: UnaryOp::Minus, rhs })
                    }
                }
                other => unreachable!("ICE: Expected integer type, got {}", other),
            },
            (UnaryOp::Minus, _) => Expression::Unary(Unary { operator: UnaryOp::Minus, rhs }),
            (UnaryOp::Not, Expression::Literal(Literal::Integer(value, typ))) => match typ {
                Type::Field => unreachable!("Binary not operation invalid for field elements"),
                Type::Integer(Signedness::Signed, bits) => {
                    if *bits <= 128 && value.fits_in_u128() {
                        let value = FieldElement::from(!value.to_u128());
                        int(value, typ.clone())
                    } else {
                        Expression::Unary(Unary { operator: UnaryOp::Minus, rhs })
                    }
                }
                other => unreachable!("ICE: Expected integer type, got {}", other),
            },
            (UnaryOp::Not, Expression::Literal(Literal::Bool(value))) => bool(!value),
            (UnaryOp::Not, _) => Expression::Unary(Unary { operator: UnaryOp::Not, rhs }),
        }
    }

    fn binary(&mut self, program: &mut Program, binary: &Binary) -> ExprId {
        let lhs = self.expression(program, binary.lhs);
        let rhs = self.expression(program, binary.rhs);

        let lhs_expr = &program[lhs];
        let rhs_expr = &program[rhs];
        if let Some(optimized) = binary_constant_int(&lhs_expr, &rhs_expr, binary.operator) {
            return program.push_expression(optimized);
        }

        if let Some(optimized) = binary_constant_bool(&lhs_expr, &rhs_expr, binary.operator) {
            return program.push_expression(optimized);
        }

        match binary_one_zero(&lhs_expr, &rhs_expr, binary.operator) {
            ReturnLhsOrRhs::Lhs => return lhs,
            ReturnLhsOrRhs::Rhs => return rhs,
            ReturnLhsOrRhs::Neither => (),
        }

        program.push_expression(Expression::Binary(Binary { lhs, rhs, operator: binary.operator }))
    }

    fn index(&mut self, program: &mut Program, index: &Index) -> ExprId {
        let collection = self.expression(program, index.collection);
        let index = self.expression(program, index.index);

        let collection_expr = &program[collection];
        let index_expr = &program[index];

        if let (Some(array), Some((index, _))) = (as_array(collection_expr), as_int(index_expr)) {
            if let Some(index) = index.try_into_u128().and_then(|x| x.try_into().ok()) {
                let _: usize = index; // Rust needs a hint that index should be a usize
                return array.contents[index];
            }
        }

        program.push_expression(Expression::Index(Index { collection, index }))
    }

    fn cast(&mut self, program: &mut Program, cast: &Cast) -> ExprId {
        let lhs = self.expression(program, cast.lhs);
        let lhs_expr = &program[lhs];

        if let Some((value, typ)) = as_int(&lhs_expr) {
            match (typ, &cast.r#type) {
                (l, r) if l == r => return lhs,

                (Type::Field, Type::Integer(_, _))
                // Should we do something different if lsign != rsign?
                | (Type::Integer(_, _), Type::Integer(_, _)) => {
                    let value = truncate(value, &cast.r#type);
                    let int = Expression::Literal(Literal::Integer(value, cast.r#type.clone()));
                    return program.push_expression(int);
                },

                (Type::Field | Type::Integer(..), Type::Bool) => {
                    let bool = Expression::Literal(Literal::Bool(!value.is_zero()));
                    return program.push_expression(bool);
                },

                (Type::Integer(_, _), Type::Field) => {
                    let field = Expression::Literal(Literal::Integer(value, Type::Field));
                    return program.push_expression(field);
                },
                _ => unreachable!(),
            }
        }

        if let Some(value) = as_bool(&lhs_expr) {
            match &cast.r#type {
                Type::Bool => return lhs,
                Type::Field | Type::Integer(_, _) => {
                    let value = if value { FieldElement::one() } else { FieldElement::zero() };
                    let int = Expression::Literal(Literal::Integer(value, cast.r#type.clone()));
                    return program.push_expression(int);
                }
                _ => unreachable!(),
            }
        }

        program.push_expression(Expression::Cast(Cast { lhs, r#type: cast.r#type.clone() }))
    }

    fn for_loop(
        &mut self,
        program: &mut Program,
        for_loop: &crate::monomorphisation::ast::For,
    ) -> Expression {
        let start = self.expression(program, for_loop.start_range);
        let start = match &program[start] {
            Expression::Literal(Literal::Integer(value, _)) if value.fits_in_u128() => {
                value.to_u128()
            }
            other => unreachable!(
                "Unable to evaluate comptime 'start range' value of for loop. Got {}",
                other.display(program)
            ),
        };

        let end = self.expression(program, for_loop.end_range);
        let end = match &program[end] {
            Expression::Literal(Literal::Integer(value, _)) if value.fits_in_u128() => {
                value.to_u128()
            }
            other => unreachable!(
                "Unable to evaluate comptime 'end range' value of for loop. Got {}",
                other.display(program)
            ),
        };

        let contents = vecmap(start..end, |i| {
            // Don't need to push a new scope, name resolution ensures we cannot refer to the
            // loop variable outside of the loop
            let index = program.push_expression(int_u128(i, for_loop.index_type.clone()));
            self.current_scope().insert(for_loop.index_variable, index);
            self.expression(program, for_loop.block)
        });

        Expression::Literal(Literal::Array(ArrayLiteral {
            contents,
            element_type: for_loop.element_type.clone(),
        }))
    }

    fn if_expr(&mut self, program: &mut Program, if_expr: &If) -> ExprId {
        let condition = self.expression(program, if_expr.condition);
        match &program[condition] {
            Expression::Literal(Literal::Bool(true)) => {
                return self.expression(program, if_expr.consequence)
            }
            Expression::Literal(Literal::Bool(false)) => {
                if let Some(alt) = &if_expr.alternative {
                    return self.expression(program, *alt);
                } else {
                    return self.unit_id;
                }
            }
            _ => (),
        };

        // Otherwise continue with a non-comptime condition
        // Must separate out evaluated side effects (*_evaluated) from the
        // non-side effectful expression that is returned, which may be
        // stored in a variable and cloned
        self.evaluated.push(vec![]);
        let consequence = self.expression(program, if_expr.consequence);
        let mut consequence_evaluated = self.evaluated.pop().unwrap();

        let (alternative, alternative_evaluated) = if let Some(alt) = &if_expr.alternative {
            self.evaluated.push(vec![]);
            let alt = self.expression(program, *alt);
            let alt_eval = self.evaluated.pop().unwrap();
            let alt_eval = if alt_eval.is_empty() { None } else { Some(alt_eval) };
            (Some(alt), alt_eval)
        } else {
            (None, None)
        };

        // Check if the if-expr's type is Unit and if so, re-combine the evaluated
        // statements and resulting expression, then directly return a unit literal.
        // This isn't necessary but cleans up the output somewhat.
        if if_expr.typ == Type::Unit {
            consequence_evaluated.push(consequence);
            let alternatives = match (alternative_evaluated, alternative) {
                (Some(mut alternatives), Some(alternative)) => {
                    alternatives.push(alternative);
                    Some(alternatives)
                }
                (None, Some(alternative)) => Some(vec![alternative]),
                (None, None) => None,
                (Some(_), None) => unreachable!(),
            };

            let if_expr = Expression::If(If {
                condition,
                consequence: program.push_expression(Expression::Block(consequence_evaluated)),
                alternative: alternatives
                    .map(|alts| program.push_expression(Expression::Block(alts))),
                typ: if_expr.typ.clone(),
            });
            self.push_evaluated_expr(program, if_expr);
            self.unit_id
        } else {
            if !consequence_evaluated.is_empty()
                || alternative_evaluated.as_ref().map_or(false, |alt| alt.is_empty())
            {
                let if_expr = Expression::If(If {
                    condition: condition.clone(),
                    consequence: program.push_expression(Expression::Block(consequence_evaluated)),
                    alternative: alternative_evaluated
                        .map(|alt| program.push_expression(Expression::Block(alt))),
                    typ: if_expr.typ.clone(),
                });
                self.push_evaluated_expr(program, if_expr);
            }

            let if_expr = If { condition, consequence, alternative, typ: if_expr.typ.clone() };
            program.push_expression(Expression::If(if_expr))
        }
    }

    fn tuple(&mut self, program: &mut Program, tuple: &[ExprId]) -> Expression {
        let fields = vecmap(tuple, |field| self.expression(program, *field));
        Expression::Tuple(fields)
    }

    fn extract(&mut self, program: &mut Program, tuple: ExprId, field: usize) -> ExprId {
        let tuple = self.expression(program, tuple);
        match &program[tuple] {
            Expression::Tuple(fields) => fields[field],
            _ => {
                // Is this case reachable?
                program.push_expression(Expression::ExtractTupleField(tuple, field))
            }
        }
    }

    fn call(&mut self, program: &mut Program, call: &crate::monomorphisation::ast::Call) -> ExprId {
        let args = vecmap(&call.arguments, |arg| self.expression(program, *arg));
        self.function(program, call.func_id, args)
    }

    fn call_builtin(&mut self, program: &mut Program, call: &CallBuiltin) -> Expression {
        let arguments = vecmap(&call.arguments, |arg| self.expression(program, *arg));
        Expression::CallBuiltin(CallBuiltin { opcode: call.opcode.clone(), arguments })
    }

    fn call_low_level(&mut self, program: &mut Program, call: &CallLowLevel) -> Expression {
        let arguments = vecmap(&call.arguments, |arg| self.expression(program, *arg));
        Expression::CallLowLevel(CallLowLevel { opcode: call.opcode.clone(), arguments })
    }

    fn let_statement(&mut self, program: &mut Program, let_stmt: &Let) -> ExprId {
        let expression = self.expression(program, let_stmt.expression);
        if let_stmt.mutable || program[expression].contains_variables(program) {
            self.push_evaluated_expr(
                program,
                Expression::Let(Let {
                    id: let_stmt.id,
                    mutable: true,
                    name: let_stmt.name.clone(),
                    expression,
                }),
            );
        } else {
            self.current_scope().insert(let_stmt.id, expression);
        }
        self.unit_id
    }

    fn constrain(&mut self, program: &mut Program, expr: ExprId, loc: Location) -> ExprId {
        let expr = self.expression(program, expr);
        self.push_evaluated_expr(program, Expression::Constrain(expr, loc));
        self.unit_id
    }

    fn assign(&mut self, program: &mut Program, assign: &Assign) -> ExprId {
        let expression = self.expression(program, assign.expression);
        let lvalue = self.lvalue(program, &assign.lvalue);

        let assign = Expression::Assign(Assign { lvalue, expression });
        self.push_evaluated_expr(program, assign);

        self.unit_id
    }

    fn lvalue(&mut self, program: &mut Program, lvalue: &LValue) -> LValue {
        match lvalue {
            LValue::Ident(ident) => {
                // self.assign_variable = Some(ident.clone());
                LValue::Ident(ident.clone())
            }
            LValue::Index { array, index } => {
                let array = Box::new(self.lvalue(program, array));
                let index = self.expression(program, *index);
                LValue::Index { array, index }
            }
            LValue::MemberAccess { object, field_index } => {
                let object = Box::new(self.lvalue(program, object));
                let field_index = *field_index;
                LValue::MemberAccess { object, field_index }
            }
        }
    }
}

/// Basic optimizations: both are constant ints
fn binary_constant_int(
    lhs: &Expression,
    rhs: &Expression,
    operator: BinaryOpKind,
) -> Option<Expression> {
    if let (Some((lvalue, ltyp)), Some((rvalue, rtyp))) = (as_int(lhs), as_int(rhs)) {
        assert_eq!(ltyp, rtyp);
        match operator {
            BinaryOpKind::Add => return Some(int(lvalue + rvalue, ltyp.clone())),
            BinaryOpKind::Subtract => return Some(int(lvalue - rvalue, ltyp.clone())),
            BinaryOpKind::Multiply => return Some(int(lvalue * rvalue, ltyp.clone())),
            BinaryOpKind::Divide => return Some(int(lvalue / rvalue, ltyp.clone())),
            BinaryOpKind::Equal => return Some(bool(lvalue == rvalue)),
            BinaryOpKind::NotEqual => return Some(bool(lvalue != rvalue)),
            BinaryOpKind::Less => return Some(bool(lvalue < rvalue)),
            BinaryOpKind::LessEqual => return Some(bool(lvalue <= rvalue)),
            BinaryOpKind::Greater => return Some(bool(lvalue > rvalue)),
            BinaryOpKind::GreaterEqual => return Some(bool(lvalue >= rvalue)),
            _ => (),
        };

        if let (Some(lvalue), Some(rvalue)) = (lvalue.try_into_u128(), rvalue.try_into_u128()) {
            match operator {
                BinaryOpKind::And => return Some(int_u128(lvalue & rvalue, ltyp.clone())),
                BinaryOpKind::Or => return Some(int_u128(lvalue | rvalue, ltyp.clone())),
                BinaryOpKind::Xor => return Some(int_u128(lvalue ^ rvalue, ltyp.clone())),
                BinaryOpKind::ShiftRight => return Some(int_u128(lvalue >> rvalue, ltyp.clone())),
                BinaryOpKind::ShiftLeft => return Some(int_u128(lvalue << rvalue, ltyp.clone())),
                BinaryOpKind::Modulo => return Some(int_u128(lvalue % rvalue, ltyp.clone())),
                _ => (),
            }
        }
    }
    None
}

/// Basic optimizations: both are constant bools
fn binary_constant_bool(
    lhs: &Expression,
    rhs: &Expression,
    operator: BinaryOpKind,
) -> Option<Expression> {
    if let (Some(lvalue), Some(rvalue)) = (as_bool(lhs), as_bool(rhs)) {
        Some(match operator {
            BinaryOpKind::Equal => bool(lvalue == rvalue),
            BinaryOpKind::NotEqual => bool(lvalue != rvalue),
            BinaryOpKind::And => bool(lvalue && rvalue),
            BinaryOpKind::Or => bool(lvalue || rvalue),
            BinaryOpKind::Xor => bool(lvalue ^ rvalue),
            _ => return None,
        })
    } else {
        None
    }
}

enum ReturnLhsOrRhs {
    Lhs,
    Rhs,
    Neither,
}

/// Other optimizations for 1 and 0 constants
/// This returns a 'ReturnLhsOrRhs' - if we wanted to return lhs or rhs
/// directly we'd need to take ownership of them or clone them.
fn binary_one_zero(lhs: &Expression, rhs: &Expression, operator: BinaryOpKind) -> ReturnLhsOrRhs {
    if is_zero(lhs) && operator == BinaryOpKind::Add {
        return ReturnLhsOrRhs::Rhs;
    }

    if is_zero(rhs) {
        match operator {
            BinaryOpKind::Add => return ReturnLhsOrRhs::Lhs,
            BinaryOpKind::Subtract => return ReturnLhsOrRhs::Lhs,
            _ => (),
        }
    }

    if is_one(lhs) && operator == BinaryOpKind::Multiply {
        return ReturnLhsOrRhs::Rhs;
    }

    if is_one(rhs) {
        match operator {
            BinaryOpKind::Multiply => return ReturnLhsOrRhs::Lhs,
            BinaryOpKind::Divide => return ReturnLhsOrRhs::Lhs,
            BinaryOpKind::Modulo => return ReturnLhsOrRhs::Lhs,
            _ => (),
        }
    }
    ReturnLhsOrRhs::Neither
}

fn bool(value: bool) -> Expression {
    Expression::Literal(Literal::Bool(value))
}

fn int(value: FieldElement, typ: Type) -> Expression {
    let value = truncate(value, &typ);
    Expression::Literal(Literal::Integer(value, typ))
}

fn int_u128(value: u128, typ: Type) -> Expression {
    let value = truncate_u128(value, &typ);
    Expression::Literal(Literal::Integer(value, typ))
}

fn truncate(value: FieldElement, typ: &Type) -> FieldElement {
    match typ {
        Type::Integer(..) => truncate_u128(value.to_u128(), typ),
        _other => value,
    }
}

fn truncate_u128(value: u128, typ: &Type) -> FieldElement {
    match typ {
        Type::Integer(_, bits) => {
            let type_modulo = 1_u128 << bits;
            let value = value % type_modulo;
            FieldElement::from(value)
        }
        _other => FieldElement::from(value),
    }
}

fn as_bool(expr: &Expression) -> Option<bool> {
    match expr {
        Expression::Literal(Literal::Bool(value)) => Some(*value),
        _ => None,
    }
}

fn as_int(expr: &Expression) -> Option<(FieldElement, &Type)> {
    match expr {
        Expression::Literal(Literal::Integer(value, typ)) => Some((*value, typ)),
        _ => None,
    }
}

fn as_array(expr: &Expression) -> Option<&ArrayLiteral> {
    match expr {
        Expression::Literal(Literal::Array(array)) => Some(array),
        _ => None,
    }
}

fn is_zero(expr: &Expression) -> bool {
    as_int(expr).map_or(false, |(int, _)| int.is_zero())
}

fn is_one(expr: &Expression) -> bool {
    as_int(expr).map_or(false, |(int, _)| int.is_one())
}
