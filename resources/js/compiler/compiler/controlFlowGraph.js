
(function () {

var Token = Compiler.Token;
var Nonterminal = Compiler.Nonterminal;

var _cfg;

ControlFlowGraph.prototype = new Graph();
Compiler.ControlFlowGraph = ControlFlowGraph;
function ControlFlowGraph(ast) {
    ast = ast || Compiler.ast;

    this.descendBlock();
    _cfg = this;

    build(ast.tree);

    _cfg = null;
}

ControlFlowGraph.prototype.addToCurrentBlock = function(node) {
    this.currentNode.value.push(node);
};

ControlFlowGraph.prototype.descendBlock = function () {
    this.descend([]);
};

ControlFlowGraph.prototype.setCurrentBlock = function(node) {
    this.currentNode = node;
};

function build(node) {
    if (Utils.is(node.value, Compiler.Symbol)) {
        return buildId(node);
    }

    // Note that returns here produce the same outcome as a break
    switch (node.value.kind) {
        case Nonterminal.Kind.BLOCK:       return buildBlock(node);
        case Nonterminal.Kind.WHILE:       return buildWhile(node);
        case Nonterminal.Kind.IF:          return buildIf(node);
        case Nonterminal.Kind.DECLARATION: return buildDeclaration(node);
        case Nonterminal.Kind.ASSIGNMENT:  return buildAssignment(node);
        case Nonterminal.Kind.PRINT:       return buildPrint(node);

        default:                            throw 'Error building CFG.';
    }
}

function buildBlock(node) {
    // Build each statement
    for (var i = 0; i < node.children.length; i++) {
        build(node.children[i]);
    }
}

function buildWhile(node) {
    // Condition block
    if (_cfg.currentNode.value.length) {
        // If current block has something in it, descend to new block
        _cfg.descendBlock();
    }
    _cfg.addToCurrentBlock(node.children[0]);

    var conditionBlock = _cfg.currentNode;

    // True block
    _cfg.descendBlock();
    build(node.children[1]);

    // And edge to condition at point we left off at
    _cfg.addNode(conditionBlock);
    // Continue to condition block
    _cfg.setCurrentBlock(conditionBlock);

    // False block
    _cfg.descendBlock(); // New basic block on leaving the while block
}

function buildIf(node) {
    // Add condition to current block
    _cfg.addToCurrentBlock(node.children[0]);

    // False block
    _cfg.descendBlock();
    var falseBlock = _cfg.currentNode;
    _cfg.ascend();

    // True block
    _cfg.descendBlock();
    build(node.children[1]);

    // Add edge at last block to false block
    _cfg.addNode(falseBlock);
    // Continue to false block when finished
    _cfg.setCurrentBlock(falseBlock);
}

function buildDeclaration(node) {
    _cfg.addToCurrentBlock(node);
}

function buildAssignment(node) {
    _cfg.addToCurrentBlock(node);
}

function buildPrint(node) {
    _cfg.addToCurrentBlock(node);
}

})();
