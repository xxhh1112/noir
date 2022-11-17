use acvm::FieldElement;
use noirc_abi::Abi;
use noirc_errors::Location;

use crate::{util::vecmap, BinaryOpKind, Signedness};

#[derive(Debug)]
pub enum Expression {
    Ident(Ident),
    Literal(Literal),
    Block(Vec<ExprId>),
    Unary(Unary),
    Binary(Binary),
    Index(Index),
    Cast(Cast),
    For(For),
    If(If),
    Tuple(Vec<ExprId>),
    ExtractTupleField(ExprId, usize),
    Call(Call),
    CallBuiltin(CallBuiltin),
    CallLowLevel(CallLowLevel),

    Let(Let),
    Constrain(ExprId, Location),
    Assign(Assign),
    Semi(ExprId),
}

impl ExprId {
    pub fn display(self, program: &Program) -> ExprIdDisplay {
        ExprIdDisplay(self, program)
    }
}

impl Expression {
    pub fn display<'a>(&'a self, program: &'a Program) -> ExpressionDisplay {
        ExpressionDisplay(self, program)
    }

    pub fn has_side_effects(&self, program: &Program) -> bool {
        match self {
            Expression::Block(exprs) => {
                exprs.iter().any(|expr| program[*expr].has_side_effects(program))
            }
            Expression::Semi(expr) => program[*expr].has_side_effects(program),
            Expression::Literal(Literal::Array(array)) => {
                array.contents.iter().any(|elem| program[*elem].has_side_effects(program))
            }

            Expression::Literal(_) => false,
            Expression::Ident(_) => false,
            Expression::Unary(_) => false,
            Expression::Binary(_) => false,
            Expression::Index(_) => false,
            Expression::Cast(_) => false,
            Expression::Tuple(_) => false,
            Expression::ExtractTupleField(_, _) => false,
            Expression::CallBuiltin(_) => false,
            Expression::CallLowLevel(_) => false,

            Expression::For(_) => unreachable!(),
            Expression::Call(_) => unreachable!(),

            Expression::If(_) => true,
            Expression::Let(_) => true,
            Expression::Constrain(_, _) => true,
            Expression::Assign(_) => true,
        }
    }

    pub fn contains_variables(&self, program: &Program) -> bool {
        match self {
            Expression::Ident(_) => true,
            Expression::Literal(Literal::Array(array)) => {
                array.contents.iter().any(|elem| program[*elem].contains_variables(program))
            }
            Expression::Literal(_) => false,
            Expression::Block(exprs) => {
                exprs.iter().any(|expr| program[*expr].contains_variables(program))
            }
            Expression::Unary(unary) => program[unary.rhs].contains_variables(program),
            Expression::Binary(binary) => {
                program[binary.lhs].contains_variables(program)
                    || program[binary.rhs].contains_variables(program)
            }
            Expression::Index(index) => {
                program[index.collection].contains_variables(program)
                    || program[index.index].contains_variables(program)
            }
            Expression::Cast(cast) => program[cast.lhs].contains_variables(program),
            Expression::For(for_loop) => {
                program[for_loop.start_range].contains_variables(program)
                    || program[for_loop.end_range].contains_variables(program)
                    || program[for_loop.block].contains_variables(program)
            }
            Expression::If(if_expr) => {
                program[if_expr.condition].contains_variables(program)
                    || program[if_expr.consequence].contains_variables(program)
                    || if_expr
                        .alternative
                        .as_ref()
                        .map_or(false, |alt| program[*alt].contains_variables(program))
            }
            Expression::Tuple(fields) => {
                fields.iter().any(|field| program[*field].contains_variables(program))
            }
            Expression::ExtractTupleField(expr, _) => program[*expr].contains_variables(program),
            Expression::Call(call) => {
                call.arguments.iter().any(|arg| program[*arg].contains_variables(program))
            }
            Expression::CallBuiltin(call) => {
                call.arguments.iter().any(|arg| program[*arg].contains_variables(program))
            }
            Expression::CallLowLevel(call) => {
                call.arguments.iter().any(|arg| program[*arg].contains_variables(program))
            }
            Expression::Let(let_expr) => program[let_expr.expression].contains_variables(program),
            Expression::Constrain(expr, _) => program[*expr].contains_variables(program),
            Expression::Assign(assign) => program[assign.expression].contains_variables(program),
            Expression::Semi(expr) => program[*expr].contains_variables(program),
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct DefinitionId(pub u32);

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct FuncId(pub u32);

#[derive(Debug, Clone)]
pub struct Ident {
    pub location: Option<Location>,
    pub id: DefinitionId,
    pub mutable: bool,
    pub name: String,
    pub typ: Type,
}

#[derive(Debug, Clone)]
pub struct For {
    pub index_variable: DefinitionId,
    pub index_name: String,
    pub index_type: Type,

    pub start_range: ExprId,
    pub end_range: ExprId,
    pub block: ExprId,
    pub element_type: Type,
}

#[derive(Debug, Clone)]
pub enum Literal {
    Array(ArrayLiteral),
    Integer(FieldElement, Type),
    Bool(bool),
    Str(String),
    Unit,
}

#[derive(Debug, Clone)]
pub struct Unary {
    pub operator: crate::UnaryOp,
    pub rhs: ExprId,
}

pub type BinaryOp = BinaryOpKind;

#[derive(Debug, Clone)]
pub struct Binary {
    pub lhs: ExprId,
    pub operator: BinaryOp,
    pub rhs: ExprId,
}

#[derive(Debug, Clone)]
pub struct If {
    pub condition: ExprId,
    pub consequence: ExprId,
    pub alternative: Option<ExprId>,
    pub typ: Type,
}

#[derive(Debug, Clone)]
pub struct Cast {
    pub lhs: ExprId,
    pub r#type: Type,
}

#[derive(Debug, Clone)]
pub struct ArrayLiteral {
    pub contents: Vec<ExprId>,
    pub element_type: Type,
}

#[derive(Debug, Clone)]
pub struct Call {
    pub func_id: FuncId,
    pub arguments: Vec<ExprId>,
}

#[derive(Debug, Clone)]
pub struct CallLowLevel {
    pub opcode: String,
    pub arguments: Vec<ExprId>,
}

/// TODO: Ssa doesn't support these yet.
#[derive(Debug, Clone)]
pub struct CallBuiltin {
    pub opcode: String,
    pub arguments: Vec<ExprId>,
}

#[derive(Debug, Clone)]
pub struct Index {
    pub collection: ExprId,
    pub index: ExprId,
}

#[derive(Debug, Clone)]
pub struct Let {
    pub id: DefinitionId,
    pub mutable: bool,
    pub name: String,
    pub expression: ExprId,
}

#[derive(Debug, Clone)]
pub struct Assign {
    pub lvalue: LValue,
    pub expression: ExprId,
}

#[derive(Debug, Clone)]
pub struct BinaryStatement {
    pub lhs: ExprId,
    pub r#type: Type,
    pub expression: ExprId,
}

/// Represents an Ast form that can be assigned to
#[derive(Debug, Clone)]
pub enum LValue {
    Ident(Ident),
    Index { array: Box<LValue>, index: ExprId },
    MemberAccess { object: Box<LValue>, field_index: usize },
}

#[derive(Debug, Clone)]
pub struct Function {
    pub id: FuncId,
    pub name: String,

    pub parameters: Vec<(DefinitionId, /*mutable:*/ bool, /*name:*/ String, Type)>,
    pub body: ExprId,

    pub return_type: Type,
}

/// A monomorphised Type has all type variables removed
#[derive(Debug, PartialEq, Eq, Clone)]
pub enum Type {
    Field,
    Array(/*len:*/ u64, Box<Type>),     // Array(4, Field) = [Field; 4]
    Integer(Signedness, /*bits:*/ u32), // u32 = Integer(unsigned, 32)
    Bool,
    Unit,
    Tuple(Vec<Type>),
}

impl Type {
    pub fn flatten(&self) -> Vec<Type> {
        match self {
            Type::Tuple(fields) => fields.iter().flat_map(|field| field.flatten()).collect(),
            _ => vec![self.clone()],
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct ExprId(u32);

pub struct Program {
    pub functions: Vec<Function>,
    pub abi: Abi,

    expressions: Vec<Expression>,
}

impl Program {
    pub fn new(abi: Abi) -> Program {
        Program { functions: vec![], abi, expressions: vec![] }
    }

    pub fn push_function(&mut self, function: Function) {
        self.functions.push(function);
    }

    pub fn main(&mut self) -> &mut Function {
        &mut self.functions[0]
    }

    pub fn main_id(&mut self) -> FuncId {
        FuncId(0)
    }

    pub fn push_expression(&mut self, expr: Expression) -> ExprId {
        let id = self.expressions.len();
        self.expressions.push(expr);
        ExprId(id as u32)
    }
}

impl std::ops::Index<FuncId> for Program {
    type Output = Function;

    fn index(&self, index: FuncId) -> &Self::Output {
        &self.functions[index.0 as usize]
    }
}

impl std::ops::IndexMut<FuncId> for Program {
    fn index_mut(&mut self, index: FuncId) -> &mut Self::Output {
        &mut self.functions[index.0 as usize]
    }
}

impl std::ops::Index<ExprId> for Program {
    type Output = Expression;

    fn index(&self, index: ExprId) -> &Self::Output {
        &self.expressions[index.0 as usize]
    }
}

impl std::ops::IndexMut<ExprId> for Program {
    fn index_mut(&mut self, index: ExprId) -> &mut Self::Output {
        &mut self.expressions[index.0 as usize]
    }
}

impl std::fmt::Display for Program {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for function in &self.functions {
            super::printer::AstPrinter::new(self).print_function(function, f)?;
        }
        Ok(())
    }
}

pub struct ExpressionDisplay<'a>(&'a Expression, &'a Program);
pub struct ExprIdDisplay<'a>(ExprId, &'a Program);

impl<'a> std::fmt::Display for ExpressionDisplay<'a> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        super::printer::AstPrinter::new(self.1).print_expr(self.0, f)
    }
}

impl<'a> std::fmt::Display for ExprIdDisplay<'a> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        super::printer::AstPrinter::new(self.1).print_expr_id(self.0, f)
    }
}

impl std::fmt::Display for Type {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Type::Field => write!(f, "Field"),
            Type::Array(len, elems) => write!(f, "[{}; {}]", elems, len),
            Type::Integer(sign, bits) => match sign {
                Signedness::Unsigned => write!(f, "u{}", bits),
                Signedness::Signed => write!(f, "i{}", bits),
            },
            Type::Bool => write!(f, "bool"),
            Type::Unit => write!(f, "()"),
            Type::Tuple(elems) => {
                let elems = vecmap(elems, ToString::to_string);
                write!(f, "({})", elems.join(", "))
            }
        }
    }
}
