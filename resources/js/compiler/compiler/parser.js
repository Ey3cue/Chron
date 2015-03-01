
Compiler.Parser = {};

(function () {

var Token = Compiler.Token;
var Nonterminal = Compiler.Nonterminal;

var _tokens;
var _currentToken;
var _nextToken;
var _index;

var _cst;

/**
 * Parses the given token stream.
 *
 * @param {String} tokens (optional) the token stream to parse. If not specified, gets the current
 *     token stream set in the compiler.
 */
Compiler.Parser.parse = function (tokens) {
    _tokens = tokens || Compiler.tokenStream;

    _index = 0;

    _currentToken = _tokens[_index++];
    _nextToken = _tokens[_index];

    _cst = new Compiler.CST();

    Compiler.trace('Starting parse...');
    parse(program);

    Compiler.cst = _cst;
};

/**
 * Parses following the given production function and any arguments to pass to it. Calling this and
 * passing the production allows any operations that should be done prior to and after parsing to
 * be done once, rather than in each production (such as CST construction).
 *
 * @param {Object} production the production function to parse
 * @param {Object} args (optional) any arguments to pass to the production
 */
function parse(production, args) {
    _cst.descend(Nonterminal.create(production.name));

    production(args);

    _cst.ascend();
}

// ---------- Productions ----------

/**
 * <Program> ::== <StatementBlock>
 */
function program() {
    parse(statementBlock);
    matchToken(Token.Kind.EOF_SIGN);
}

/**
 * <StatementBlock> ::== { <StatementList> }
 */
function statementBlock() {
    matchToken(Token.Kind.OPEN_BRACE);
    parse(statementList);
    matchToken(Token.Kind.CLOSE_BRACE);
}

/**
 * <StatementList> ::== <Statement> <StatementList>
 *                 ::== e
 */
function statementList() {
    // Closing brace signals end of statement list.
    if (!_currentToken.is(Token.Kind.CLOSE_BRACE)) {
        trace('Did not find ' + Token.nameOf(Token.Kind.CLOSE_BRACE) + ", parsing '<Statement> <StatementList>'");
        parse(statement);
        parse(statementList);
    } else {
        trace('Found ' + _currentToken.name() + ", end of '<StatementList>'");
        _cst.add(new Token(Token.Kind.EPSILON, '\u03B5')); // Epsilon
    }
}

/**
 * Statement ::== PrintStatement
 *           ::== AssignStatement
 *           ::== VarDecl
 *           ::== WhileStatement
 *           ::== IfStatement
 *           ::== Block
 */
function statement() {
    if (_currentToken.is(Token.Kind.PRINT)) {
        trace('Found ' + _currentToken.name() + ", parsing '<PrintStatement>'");
        parse(printStatement);

    } else if (_currentToken.is(Token.Kind.ID)) {
        trace('Found ' + _currentToken.name() + ", parsing '<AssignStatement>'");
        parse(assignStatement);

    } else if (_currentToken.is(Token.Kind.TYPE)) {
        trace('Found ' + _currentToken.name() + ", parsing '<VarDecl>'");
        parse(varDecl);

    } else if (_currentToken.is(Token.Kind.WHILE)) {
        trace('Found ' + _currentToken.name() + ", parsing '<WhileStatement>");
        parse(whileStatement);

    } else if (_currentToken.is(Token.Kind.IF)) {
        trace('Found ' + _currentToken.name() + ", parsing '<IfStatement>");
        parse(ifStatement);

    } else if (_currentToken.is(Token.Kind.OPEN_BRACE)) {
        trace('Found ' + _currentToken.name() + ", parsing '<Block>'");
        parse(statementBlock);

    } else {
        trace('Invalid statement starting with ' + _currentToken.name());
        Compiler.addError('Invalid statement starting with ' + _currentToken.name(), _currentToken.line);
    }
}

/**
 * <PrintStatement> ::== print ( <Expr> )
 */
function printStatement() {
    matchToken(Token.Kind.PRINT);
    matchToken(Token.Kind.OPEN_PAREN);
    parse(expr);
    matchToken(Token.Kind.CLOSE_PAREN);
}

/**
 * <AssignStatement> ::== <Id> = <Expr>
 */
function assignStatement() {
    parse(id);
    matchToken(Token.Kind.EQUALS);
    parse(expr);
}

/**
 * <VarDecl> ::== <Type> <Id>
 */
function varDecl() {
    parse(type);
    parse(id);
}

/**
 * <WhileStatement> ::== while <BooleanExpr> <Block>
 */
function whileStatement() {
    matchToken(Token.Kind.WHILE);
    parse(booleanExpr);
    parse(statementBlock);
}

/**
 * <IfStatement> ::== if
 */
function ifStatement() {
    matchToken(Token.Kind.IF);
    parse(booleanExpr);
    parse(statementBlock);
}

/**
 *  <Expr> ::== <IntExpr>
 *         ::== <StringExpr>
 *         ::== <BooleanExpr>
 *         ::== <Id>
 */
function expr() {
    if (_currentToken.is(Token.Kind.DIGIT)) {
        trace('Found ' + _currentToken.name() + ", parsing '<IntExpr>'");
        parse(intExpr);
    } else if (_currentToken.is(Token.Kind.QUOTE)) {
        trace('Found ' + _currentToken.name() + ", parsing '<StringExpr>'");
        parse(stringExpr);
    } else if (_currentToken.is(Token.Kind.ID)) {
        trace('Found ' + _currentToken.name() + ", parsing '<Id>'");
        parse(id);
    } else if (_currentToken.is(Token.Kind.OPEN_PAREN) || _currentToken.is(Token.Kind.BOOLVAL)) {
        trace('Found ' + _currentToken.name() + ", parsing '<BoolExpr>'");
        parse(booleanExpr);
    } else {
        trace("ERROR Invalid '<Expr>' starting with " + _currentToken.name());
        Compiler.addError("Invalid '<Expr>' starting with " + _currentToken.name(), _currentToken.line);
    }
}

/**
 *
 * <IntExpr> ::== <Digit> <Intop> <Expr>
 *           ::== <Digit>
 */
function intExpr() {
    // Parse the <Digit>, as it's in both productions
    parse(digit);

    if (_currentToken.is(Token.Kind.INTOP)) {
        trace('Found ' + _currentToken.name() + ", parsing '<Op> <Expr>'");
        // <Digit> <Intop> <Expr>
        parse(intop);
        parse(expr);
    }
}

/**
 *
 * <StringExpr> ::== " <CharList> "
 */
function stringExpr() {
    matchToken(Token.Kind.QUOTE);
    parse(charList);
    matchToken(Token.Kind.QUOTE);
}

/**
 * <BooleanExpr> ::== ( <Expr> <Boolop> <Expr> )
 *               ::== <Boolval>
 */
function booleanExpr() {
    if (_currentToken.is(Token.Kind.OPEN_PAREN)) {
        trace('Found ' + _currentToken.name() + ", parsing '( <Expr> <Boolop> <Expr> )'");
        // ( <Expr> <boolop> <Expr> )
        matchToken(Token.Kind.OPEN_PAREN);
        parse(expr);
        parse(boolop);
        parse(expr);
        matchToken(Token.Kind.CLOSE_PAREN);
    } else if (_currentToken.is(Token.Kind.BOOLVAL)) {
        trace('Found ' + _currentToken.name() + ", parsing '<Boolval>'");
        // <Boolean>
        parse(boolval);
    } else {
        trace("ERROR Invalid '<BoolExpr>' starting with " + _currentToken.name());
        Compiler.addError("Invalid '<BoolExpr>' starting with " + _currentToken.name(), _currentToken.line);
    }
}

/**
 * <Id> ::== <Char>
 */
function id() {
    matchToken(Token.Kind.ID);
}


/**
 * <CharList> ::== <Char> <CharList>
 *            ::== <Space> <CharList>
 *            ::== e
 */
function charList() {
    if (_currentToken.is(Token.Kind.CHAR)) {
        trace('Found ' + _currentToken.name() + ", parsing '<Char> <CharList>'");
        parse(char);
        parse(charList);
    } else if (_currentToken.is(Token.Kind.SPACE)) {
        trace('Found ' + _currentToken.name() + ", parsing '<Space> <CharList>'");
        parse(space);
        parse(charList);
    } else {
        trace('Found ' + _currentToken.name() + ", end of <CharList>");
        _cst.add(new Token(Token.Kind.EPSILON, '\u03B5')); // Epsilon
    }
}

/**
 * <Type> ::== int | string | boolean
 */
function type() {
    matchToken(Token.Kind.TYPE);
}

/**
 * <Char> ::== a | b | c | ... | z
 */
function char() {
    matchToken(Token.Kind.CHAR);
}

/**
 * <Space> ::== the space character
 */
function space() {
    matchToken(Token.Kind.SPACE);
}

/**
 * <Digit> ::== 1 | 2 | 3 | ... | 9 | 0
 */
function digit() {
    matchToken(Token.Kind.DIGIT);
}

/**
 * <Boolop> ::== != | ==
 */
function boolop() {
    matchToken(Token.Kind.BOOLOP);
}

/**
 * <Boolval> ::== false | true
 */
function boolval() {
    matchToken(Token.Kind.BOOLVAL);
}

/**
 * <Intop> ::== +
 */
function intop() {
    matchToken(Token.Kind.INTOP);
}

// ---------- Helper Functions ----------

/**
 * Matches and consumes the current token based on the specified kind. If the kind doesn't
 * match, an error is produced.
 *
 * @param {Number} kind the kind of token or an array of accepted kinds.
 */
function matchToken(kind) {
    trace('Looking for ' + Token.nameOf(kind) + ' ...');

    if (_currentToken.is(kind)) {
        consumeToken();
    } else {
        trace('ERROR Found ' + _currentToken.name() + ', expected ' + Token.nameOf(kind));
        // No match, produce error stating expected kind.
        Compiler.addError("Found " + _currentToken.name() + ", expected " + Token.nameOf(kind),
                _currentToken.line);
    }
}

/**
 * Consumes the current token and iterates to the next, setting the _currentToken and
 * _nextToken variables appropriately.
 */
function consumeToken() {
    if (!_currentToken.is(Token.Kind.EOF_SIGN)) {
        _cst.add(_currentToken);
    }
    _currentToken = _tokens[_index++];
    _nextToken = _tokens[_index]; // If at the end, this will be undefined
}

/**
 * Prints a message to the compiler output. For verbose mode.
 *
 * @param {String} message the message to print
 */
function trace(message) {
    Compiler.trace(message, _currentToken.line);
}


})();
