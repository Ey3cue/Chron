
(function () {

/**
 * Creates a new Token.
 *
 * @param {Token.Kind} kind the kind of token, usually specified by Token.Kind.<KIND>
 * @param {Object} value the value of the token
 * @param {Number} line the line number the token's located on in the source code
 */
var Token = Compiler.Token = function (kind, value, line) {
    this.kind = kind === undefined ? null : kind;
    this.value = value === undefined ? null : value;
    this.line = line === undefined ? -1 : line + 1; // IDE window starts counting at 1.
    this.symbol = null; // Used by semantic analysis to reference the symbol if this token is an ID.
};

/**
 * Returns true if the token is of the specified kind.
 *
 * @param {Number} kind the kind to test, usually specified by Token.Kind.<KIND>
 *
 * @return {Boolean} true if the token is of the specified kind, false otherwise
 */
Token.prototype.is = function (kind) {
    if (typeof kind === 'string') {
        return this.kind.is(Token.Kind[kind]);
    }
    return this.kind.is(kind);
};

/**
 * Returns the name of the token (for error and status reporting).
 *
 * @return {String} the name of the token
 */
Token.prototype.name = function () {
    return Token.nameOf(this.kind) + " '" + this.value + "'";
};

/**
 * Logs the attributes defining this token to the console.
 */
Token.prototype.print = function () {
    console.log(this.line.toString().prepad(5) + ': ' + this.kind.toString().prepad(15) +
                ' ' + this.value.toString());
};

/**
 * Returns a string representation of this token. Returns just the value as this function is used
 * in syntax tree construction.
 *
 * @return {String} a string representation of this token
 */
Token.prototype.toString = function () {
    return this.value;
};

/**
 * Returns the name of the token given its kind (for error and status reporting).
 *
 * @param {Number} kind the kind of token, usually specified by Token.Kind.<KIND>
 */
Token.nameOf = function (kind) {
    switch (kind) {
        case Token.Kind.EOF_SIGN:      return 'end of file';
        case Token.Kind.OPEN_BRACE:    return 'opening brace';
        case Token.Kind.CLOSE_BRACE:   return 'closing brace';
        case Token.Kind.OPEN_PAREN:    return 'opening parenthesis';
        case Token.Kind.CLOSE_PAREN:   return 'closing parenthesis';
        case Token.Kind.EQUALS:        return 'equals';
        case Token.Kind.INTOP:         return 'intop';
        case Token.Kind.BOOLOP:        return 'boolop';
        case Token.Kind.QUOTE:         return 'quotation';

        case Token.Kind.TYPE:          return 'type';
        case Token.Kind.PRINT:         return 'print';
        case Token.Kind.WHILE:         return 'while';
        case Token.Kind.IF:            return 'if';

        case Token.Kind.DIGIT:         return 'digit';
        case Token.Kind.CHAR:          return 'character';
        case Token.Kind.BOOLVAL:       return 'boolval';
        case Token.Kind.SPACE:         return 'space';
        case Token.Kind.ID:            return 'indentifier';

        case Token.Kind.EPSILON:       return 'epsilon';
        default:                       return 'token';
    }
};

Token.Kind = new Enum(
    // "Symbols"
    'EOF_SIGN',
    'OPEN_BRACE',
    'CLOSE_BRACE',
    'OPEN_PAREN',
    'CLOSE_PAREN',
    'EQUALS',
    'INTOP',
    'BOOLOP',
    'QUOTE',

    // Reserved words
    'TYPE',
    'PRINT',
    'WHILE',
    'IF',

    // Values
    'DIGIT',
    'CHAR',
    'BOOLVAL',
    'SPACE',
    'ID',

    'EPSILON' // User cannot enter this, the parser does it.
);

/**
 * Creates a new nonterminal.
 *
 * @param {Number} kind the kind of nonterminal, usually specified by Nonterminal.Kind.<KIND>
 */
var Nonterminal = Compiler.Nonterminal = function (kind, line) {
    this.kind = kind;
    this.line = line === undefined ? -1 : line;
};

/**
 * Returns true if the nonterminal is of the specified kind.
 *
 * @param {Number} kind the kind to test, usually specified by Nonterminal.Kind.<KIND>
 *
 * @return {Boolean} true if the nonterminal is of the specified kind, false otherwise
 */
Nonterminal.prototype.is = function (kind) {
    if (typeof kind === 'string') {
        return this.kind.is(Nonterminal.Kind[kind]);
    }
    return this.kind.is(kind);
};

Nonterminal.prototype.name = function() {
    return Nonterminal.nameOf(this.kind);
};

/**
 * Returns a string representation of this nonterminal.
 *
 * @return {String} a string representation of this nonterminal
 */
Nonterminal.prototype.toString = function () {
    return Nonterminal.nameOf(this.kind);
};

/**
 * Creates a new nonterminal given it's name. Throws an exception if the name specifies a
 * nonexistent nonterminal.
 *
 * @param {String} name the nonterminal's name
 *
 * @return {Nonterminal} the nonterminal
 */
Nonterminal.create = function (name, line) {
    try {
        var nonterminal = _nonterminals[name]();
        nonterminal.line = line;
        return nonterminal;
    } catch (e) {
        throw "No such nonterminal: '" + name + "'";
    }
};

var _nonterminals = {
    // CST
    'program'          : function () { return new Nonterminal(Nonterminal.Kind.PROGRAM); },
    'statementBlock'   : function () { return new Nonterminal(Nonterminal.Kind.STATEMENT_BLOCK); },
    'statementList'    : function () { return new Nonterminal(Nonterminal.Kind.STATEMENT_LIST); },
    'statement'        : function () { return new Nonterminal(Nonterminal.Kind.STATEMENT); },
    'printStatement'   : function () { return new Nonterminal(Nonterminal.Kind.PRINT_STATEMENT); },
    'assignStatement'  : function () { return new Nonterminal(Nonterminal.Kind.ASSIGN_STATEMENT); },
    'varDecl'          : function () { return new Nonterminal(Nonterminal.Kind.VAR_DECL); },
    'whileStatement'   : function () { return new Nonterminal(Nonterminal.Kind.WHILE_STATEMENT); },
    'ifStatement'      : function () { return new Nonterminal(Nonterminal.Kind.IF_STATEMENT); },
    'expr'             : function () { return new Nonterminal(Nonterminal.Kind.EXPR); },
    'intExpr'          : function () { return new Nonterminal(Nonterminal.Kind.INT_EXPR); },
    'stringExpr'       : function () { return new Nonterminal(Nonterminal.Kind.STRING_EXPR); },
    'booleanExpr'      : function () { return new Nonterminal(Nonterminal.Kind.BOOLEAN_EXPR); },
    'id'               : function () { return new Nonterminal(Nonterminal.Kind.ID); },
    'charList'         : function () { return new Nonterminal(Nonterminal.Kind.CHAR_LIST); },

    'type'             : function () { return new Nonterminal(Nonterminal.Kind.TYPE); },
    'char'             : function () { return new Nonterminal(Nonterminal.Kind.CHAR); },
    'space'            : function () { return new Nonterminal(Nonterminal.Kind.SPACE); },
    'digit'            : function () { return new Nonterminal(Nonterminal.Kind.DIGIT); },
    'boolop'           : function () { return new Nonterminal(Nonterminal.Kind.BOOLOP); },
    'boolval'          : function () { return new Nonterminal(Nonterminal.Kind.BOOLVAL); },
    'intop'            : function () { return new Nonterminal(Nonterminal.Kind.INTOP); },

    // AST - Creating a separate object for this may be more clear, but they serve the same purpose...
    'block'       : function () { return new Nonterminal(Nonterminal.Kind.BLOCK); },
    '{'           : function () { return new Nonterminal(Nonterminal.Kind.BLOCK); },
    'while'       : function () { return new Nonterminal(Nonterminal.Kind.WHILE); },
    'if'          : function () { return new Nonterminal(Nonterminal.Kind.IF); },
    'declaration' : function () { return new Nonterminal(Nonterminal.Kind.DECLARATION); },
    'assignment'  : function () { return new Nonterminal(Nonterminal.Kind.ASSIGNMENT); },
    '='           : function () { return new Nonterminal(Nonterminal.Kind.ASSIGNMENT); },
    'string'      : function () { return new Nonterminal(Nonterminal.Kind.STRING); },
    '"'           : function () { return new Nonterminal(Nonterminal.Kind.STRING); },
    'print'       : function () { return new Nonterminal(Nonterminal.Kind.PRINT); },
    'add'         : function () { return new Nonterminal(Nonterminal.Kind.ADD); },
    '+'           : function () { return new Nonterminal(Nonterminal.Kind.ADD); },
    'equal'       : function () { return new Nonterminal(Nonterminal.Kind.EQUAL); },
    '=='          : function () { return new Nonterminal(Nonterminal.Kind.EQUAL); },
    'not equal'   : function () { return new Nonterminal(Nonterminal.Kind.NOT_EQUAL); },
    '!='          : function () { return new Nonterminal(Nonterminal.Kind.NOT_EQUAL); },
};

/**
 * An object defining the kinds of nonterminals.
 */
Nonterminal.Kind = new Enum(
    // CST
    'PROGRAM',
    'STATEMENT_BLOCK',
    'STATEMENT_LIST',
    'STATEMENT',
    'PRINT_STATEMENT',
    'ASSIGN_STATEMENT',
    'VAR_DECL',
    'WHILE_STATEMENT',
    'IF_STATEMENT',
    'EXPR',
    'INT_EXPR',
    'STRING_EXPR',
    'BOOLEAN_EXPR',
    'ID',
    'CHAR_LIST',

    'TYPE',
    'CHAR',
    'SPACE',
    'DIGIT',
    'BOOLOP',
    'BOOLVAL',
    'INTOP',

    // AST
    'BLOCK',
    'WHILE',
    'IF',
    'DECLARATION',
    'ASSIGNMENT',
    'STRING',
    'PRINT',
    'ADD',
    'EQUAL',
    'NOT_EQUAL'
);

/**
 * Returns the name of the nonterimal given its kind (for error and status reporting), as well as
 * drawing the syntax trees.
 *
 * @param {Number} kind the kind of nonterminal, usually specified by Nonterminal.Kind.<KIND>
 */
Nonterminal.nameOf = function (kind) {
    switch (kind) {
        case Nonterminal.Kind.PROGRAM:          return '<Program>';
        case Nonterminal.Kind.STATEMENT_BLOCK:  return '<Block>';
        case Nonterminal.Kind.STATEMENT_LIST:   return '<StmtList>';
        case Nonterminal.Kind.STATEMENT:        return '<Stmt>';
        case Nonterminal.Kind.PRINT_STATEMENT:  return '<PrintStmt>';
        case Nonterminal.Kind.ASSIGN_STATEMENT: return '<AssignStmt>';
        case Nonterminal.Kind.VAR_DECL:         return '<VarDecl>';
        case Nonterminal.Kind.WHILE_STATEMENT:  return '<WhileStmt>';
        case Nonterminal.Kind.IF_STATEMENT:     return '<IfStmt>';
        case Nonterminal.Kind.EXPR:             return '<Expr>';
        case Nonterminal.Kind.INT_EXPR:         return '<IntExpr>';
        case Nonterminal.Kind.STRING_EXPR:      return '<StringExpr>';
        case Nonterminal.Kind.BOOLEAN_EXPR:     return '<BoolExpr>';
        case Nonterminal.Kind.ID:               return '<Id>';
        case Nonterminal.Kind.CHAR_LIST:        return '<Char>';

        case Nonterminal.Kind.TYPE:             return '<Type>';
        case Nonterminal.Kind.CHAR:             return '<Char>';
        case Nonterminal.Kind.SPACE:            return '<Space>';
        case Nonterminal.Kind.DIGIT:            return '<Digit>';
        case Nonterminal.Kind.BOOLOP:           return '<Boolop>';
        case Nonterminal.Kind.BOOLVAL:          return '<Boolval>';
        case Nonterminal.Kind.INTOP:            return '<Intop>';

        // AST (meta-symbol nodes)
        case Nonterminal.Kind.BLOCK:          return '{}';
        case Nonterminal.Kind.WHILE:          return 'while';
        case Nonterminal.Kind.IF:             return 'if';
        case Nonterminal.Kind.DECLARATION:    return 'decl';
        case Nonterminal.Kind.ASSIGNMENT:     return '=';
        case Nonterminal.Kind.STRING:         return 'string';
        case Nonterminal.Kind.PRINT:          return 'print';
        case Nonterminal.Kind.ADD:            return '+';
        case Nonterminal.Kind.EQUAL:          return '==';
        case Nonterminal.Kind.NOT_EQUAL:      return '!=';

        default:                              return '<>';
    }
};

})();
