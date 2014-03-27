
(function () {

var Token = Compiler.Token;
var Nonterminal = Compiler.Nonterminal;

/**
 * Creates a new Concrete Syntax Tree.
 */
CST.prototype = new Tree();
Compiler.CST = CST;
function CST() {}

/**
 * Creates a new Abstract Syntax Tree.
 *
 * @param {CST} cst the CST to create the AST from
 */
AST.prototype = new Tree();
Compiler.AST = AST;
function AST(cst) {
    if (cst) {
        this.setWithCst(cst);
    }
}

/**
 * Sets this AST, converting it from the given CST.
 *
 * @param {CST} cst the cst
 */
AST.prototype.setWithCst = function (cst) {
    this.tree = traverse(cst.tree);
};

// ---------- CST to AST ----------
/*
 * Note that each of these function's 'node' parameter is the node of the CST the function is
 * recursively traversing through. Each function returns a subtree (a TreeNode), which is passed
 * up to the calling function, which is attached appropriately to that function's subtree all the
 * way up to the AST's tree.
 */

function traverse(node) {
    switch (node.value.kind) {
    // PROGRAM
    case Nonterminal.Kind.STATEMENT_BLOCK:  return traverseStatementBlock(node);
    case Nonterminal.Kind.STATEMENT_LIST:   throw 'Error - Cannot decide on <StmtList>'; // Handled within traverseStatementBlock
    // STATEMENT
    case Nonterminal.Kind.PRINT_STATEMENT:  return traversePrintStatement(node);
    case Nonterminal.Kind.ASSIGN_STATEMENT: return traverseAssignStatement(node);
    case Nonterminal.Kind.VAR_DECL:         return traverseVarDecl(node);
    case Nonterminal.Kind.WHILE_STATEMENT:  return traverseWhileStatement(node);
    case Nonterminal.Kind.IF_STATEMENT:     return traverseIfStatement(node);
    // EXPR
    case Nonterminal.Kind.INT_EXPR:         return traverseIntExpr(node);
    case Nonterminal.Kind.STRING_EXPR:      return traverseStringExpr(node);
    case Nonterminal.Kind.BOOLEAN_EXPR:     return traverseBoolExpr(node);
    // ID
    case Nonterminal.Kind.CHAR_LIST:        throw 'Error - Cannot decide on <CharList>'; // Handled within traverseStringExpr
    // TYPE
    // CHAR
    // SPACE
    // DIGIT
    case Nonterminal.Kind.Boolop:           throw 'Error - Cannot decide on <Boolop>'; // Handled with traverseBoolExpr
    // BOOLVAL
    case Nonterminal.Kind.Intop:            throw 'Error - Cannot decide on <Intop>'; // Handled with traverseIntExpr
    default:                                return traverseChild(node);
    }
}

/**
 * Traverses the children of the given node. If the node is a leaf node, returns the built leaf
 * node for the AST.
 */
function traverseChild(node) {
    if (node.hasChildren()) {
        if (node.children.length > 1) {
            throw 'More than 1 child: ' + node.value;
        }
        return traverse(node.children[0]);
    } else {
        return buildNode(node);
    }
}

function traverseStatementBlock(node) {
    return buildMetaNode('block', node, buildChildren(node.children[1]));
}

function traversePrintStatement(node) {
    return buildMetaNode('print', node, [traverse(node.children[2])]);
}

function traverseAssignStatement(node) {
    return buildMetaNode('assignment', node, [traverse(node.children[0]), traverse(node.children[2])]);
}

function traverseVarDecl(node) {
    return buildMetaNode('declaration', node, [traverse(node.children[0]), traverse(node.children[1])]);
}

function traverseWhileStatement(node) {
    return buildMetaNode('while', node, [traverse(node.children[1]), traverse(node.children[2])]);
}

function traverseIfStatement(node) {
    return buildMetaNode('if', node, [traverse(node.children[1]), traverse(node.children[2])]);
}

function traverseIntExpr(node) {
    if (node.hasOneChild()) {
        // <Digit>
        return buildNode(traverse(node.children[0]));
    } else {
        // <Digit> <Intop> <Expr>

        //                Node[<Op>]  Node[Op]    Op    '+'
        var opName = node.children[1].children[0].value.toString();
        return buildMetaNode(opName, node, [traverse(node.children[0]), traverse(node.children[2])]);
    }
}

function traverseStringExpr(node) {
    // " <CharList> "
    return buildMetaNode('string', node, buildChildren(node.children[1]));
}

function traverseBoolExpr(node) {
    if (node.hasOneChild()) {
        // <Boolval>
        return buildNode(traverse(node.children[0]));
    } else {
        // ( <Expr> <Boolop> <Expr> )

        //                Node[<Op>]  Node[Op]    Op    '==' | '!='
        var opName = node.children[2].children[0].value.toString();
        return buildMetaNode(opName, node, [traverse(node.children[1]), traverse(node.children[3])]);
    }
}

/**
 * Builds the children of the given node, where the node's children are of the production shown
 * here. This will iterate through each recursive node, forming an array of children appropriate
 * for the AST.
 *
 * <ProductionList> ::== <Production> <ProductionList>
 *                  ::== Epsilon
 *
 * @return {Array} the node's children
 */
function buildChildren(node) {
    // For recursion productions like <CharList> and <StmtList>

    var child = node.children[0].value;

    var children = []; // For AST

    while (!child.is(Token.Kind.EPSILON)) {
        children.push(traverse(node.children[0]));

        node = node.children[1]; // Reassign to child <ProductionList>
        child = node.children[0].value; // Get the value of <ProductionList> first child and repeat
    }
    // Else epsilon production

    return children;
}

/**
 * Creates a new node using the value from the given node and the specified children.
 *
 * This function maintains a lot of consistency. It is used both to create the leaf nodes of the
 * AST as well as in situtations like <IntExpr> ::== <Digit>. In this instance, a simple call like
 * buildNode(traverse(<DigitNode>)) will return a leaf node containing the terminal digit.
 *
 * @param {TreeNode} node the node containing the value to create the new node from
 * @param {Array} children (optional) the node's children
 *
 * @return {TreeNode} the new node
 */
function buildNode(node, children) {
    var newNode = new TreeNode(node.value); // Make a copy, to be safe

    if (children) {
        newNode.children = children;
    }

    return newNode;
}

/**
 * Creates a new node containing a meta symbol like 'block' or 'decl' for use in the AST.
 *
 * This function also keeps the traversal simple. Whenever a node need be created, calling
 * buildMetaNode(<name>, node, [traverse(<child1>), traverse(<child2>), ...]) will return the correct
 * AST node.
 *
 * @param {String} name the name of the node as specified by the AST nonterminal types.
 * @param {TreeNode} node the node used purely to set the line number for this meta node.
 * @param {Array} children the node's children
 *
 * @return {TreeNode} the new node
 */
function buildMetaNode(name, node, children) {
    var newNode = new TreeNode(Nonterminal.create(name, node.getFirstLeaf().line));

    if (children) {
        newNode.children = children;
    } else {
        throw 'An AST meta node must have children.';
    }

    return newNode;
}

})();
