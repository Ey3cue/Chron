
Compiler.SemanticAnalyzer = {};

(function () {

var SemanticAnalyzer = Compiler.SemanticAnalyzer;

var Nonterminal = Compiler.Nonterminal;
var Token = Compiler.Token;

var SymbolTable = Compiler.SymbolTable;
var Scope = Compiler.Scope;
var Symbol = Compiler.Symbol;

var _ast;
var _scope;

SemanticAnalyzer.analyze = function (ast) {
    _ast = ast || Compiler.ast;

    _scope = new SymbolTable();

    Compiler.symbolTable = _scope;

    Compiler.trace('Starting semantic analysis...');
    analyze(_ast.tree);

    _scope.check();
};

// ---------- Analysis ----------
/*
 * Note that each of these function's 'node' parameter is the node of the AST the function is
 * recursively traversing through. Each function returns a type (when necessary) to compare, for
 * example, operator types.
 *
 * E.g.
 *
 * i = 2 + 3 - "a"
 *
 * Parses successfully, and gives the AST:
 *
 *           =
 *          / \
 *         i   +
 *            / \
 *           2   -
 *              / \
 *             3  "a"
 *
 * The function will need to recurively traverse through the operators, ensuring the the leaf's
 * types are 'int'. This also makes it relatively easy to add a new type (if desired) which the
 * operators can act on.
 */

 /**
 * Recursive method which semantically analyzes the given node.
 */
function analyze(node) {
    switch (node.value.kind) {
        case Nonterminal.Kind.BLOCK:       return analyzeBlock(node);
        case Nonterminal.Kind.WHILE:       return analyzeWhile(node);
        case Nonterminal.Kind.IF:          return analyzeIf(node);
        case Nonterminal.Kind.DECLARATION: return analyzeDeclaration(node);
        case Nonterminal.Kind.ASSIGNMENT:  return analyzeAssignment(node);
        case Nonterminal.Kind.STRING:      return 'string';
        case Nonterminal.Kind.PRINT:       return analyze(node.children[0]);
        case Nonterminal.Kind.ADD:         return analyzeIntop(node);
        case Nonterminal.Kind.EQUAL:       return analyzeBoolop(node);
        case Nonterminal.Kind.NOT_EQUAL:   return analyzeBoolop(node);

        case Token.Kind.DIGIT:             return 'int';
        case Token.Kind.ID:                return analyzeId(node);
        case Token.Kind.BOOLVAL:           return 'boolean';

        default:                            throw 'Error analyzing.';
    }
}

/**
 * Analyzes a block. Creates a new scope, analyzes the block's children, then leaves the scope.
 */
function analyzeBlock(node) {
    trace('Entering new block, creating scope.', node.value.line, true);

    _scope.createScope();

    for (var i = 0; i < node.children.length; i++) {
        analyze(node.children[i]);
    }

    _scope.leaveScope();

    trace('Leaving block, leaving scope.', node.getLastLeaf().line || (node.value.line + 1), true);
}

/**
 * Anlyzes a while node.
 */
function analyzeWhile(node) {
    trace('Checking while...', node.children[0].value.line);

    analyze(node.children[0]); // equals '=='
    analyze(node.children[1]); // a block '{}'
}

/**
 * Analyzes and if node.
 */
function analyzeIf(node) {
    trace('Checking if...', node.children[0].value.line);

    analyze(node.children[0]); // equals '=='
    analyze(node.children[1]); // a block '{}'
}

/**
 * Analyzes a variable declaration.
 */
function analyzeDeclaration(node) {
    var idToken = node.children[1].value;
    var typeToken = node.children[0].value;

    trace("Declaration: Adding symbol '" + idToken.value + "' of type '" + typeToken.value + "'",
            idToken.line);

    try {
        // Replace token with symbol
        node.children[1].value = _scope.addSymbol(idToken.value, typeToken.value, idToken.line);
    } catch (e) {
        // Variable declared twice.
        Compiler.addError(e, idToken.line);
    }
}

/**
 * Analyzes an assignment.
 */
function analyzeAssignment(node) {
    trace('Checking assignment...', node.children[0].value.line);

    var leftType = analyze(node.children[0]);
    var rightType = analyze(node.children[1]);

    trace("Assignment: '" + rightType + "' to '" + leftType, node.children[0].value.line);

    if (leftType !== rightType) {
        // Ah, the infamous type mismatch...
        Compiler.addError("Type mismatch: Cannot assign type '" + rightType + "' to type '" + leftType + "'",
                node.children[0].value.line);
    }

    // Set the symbol as assigned.
    node.children[0].value.assigned = true;

    return leftType;
}

/**
 * Analyzes an Intop.
 */
function analyzeIntop(node) {
    // Left child
    var token = node.children[0].value;
    var type = analyze(node.children[0]);

    trace("Op: Checking left child...", token.line);

    if (type !== 'int') {
        Compiler.addError("Cannot add or subtract type '" + type + "'", token.line);
    }

    // Right child
    type = analyze(node.children[1]);

    trace("Op: Checking right child...", token.line);

    if (type !== 'int') {
        Compiler.addError("Cannot add or subtract type '" + type + "'", token.line);
    }

    return type;
}

/**
 * Analyzes a boolop.
 */
function analyzeBoolop(node) {

    // Left child
    var token = node.children[0].value;
    var typeLeft = analyze(node.children[0]);

    trace("Equals: Checking left type.", token.line);

    if (typeLeft !== 'boolean' && typeLeft !== 'int') {
        Compiler.addError("Cannot compare type '" + typeLeft + "'", token.line);
    }

    // Right child
    var typeRight = analyze(node.children[1]);

    trace("Equals: Checking right type.", token.line);

    if (typeRight !== 'boolean' && typeRight !== 'int') {
        Compiler.addError("Cannot compare type '" + typeRight + "'", token.line);
    }

    trace("Equals: Ensuring children are the same type.", token.line);

    if (typeLeft !== typeRight) {
        Compiler.addError("Cannot compare different types: '" + typeLeft + "' and '" + typeRight + "'",
                token.line);
    }

    return 'boolean'; // Result of comparison is always a boolean
}

/**
 * Analyzes an ID.
 */
function analyzeId(node) {
    var idToken = node.value;

    trace("Id: Checking existence of '" + idToken.value + "'", idToken.line);

    // Replace token with symbol
    var symbol = node.value = _scope.getSymbol(idToken.value);

    if (!symbol) {
        Compiler.addError("Undeclared variable: '" + idToken.value + "'", idToken.line);
    }

    symbol.used = true;

    return symbol.type;
}

/**
 * Prints a message to the compiler's output. For verbose mode.
 *
 * @param {Stromg} message the message to print
 * @param {Number} line the line number the message refers to
 * @param {Boolean} boldScope (optional) true if the scope of the trace should be in bold (for use
 *     in entering and leaving scope to make it more clear)
 */
function trace(message, line, boldScope) {
    if (boldScope) {
        Compiler.trace("'" + _scope.level + "' " + message, line);
    } else {
        Compiler.trace(_scope.level + ' ' + message, line);
    }
}

})();
