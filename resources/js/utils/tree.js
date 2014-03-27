
var Tree;

(function () {

/**
 * Creates a new Tree.
 */
Tree = function () {
    this.tree = null;
    this.currentNode = null;
};

/**
 * Adds a child to the current node of the tree containing the specified value.
 *
 * @param {Object} value the value of the node
 */
Tree.prototype.add = function (value) {
    this.currentNode.add(value);
};

Tree.prototype.addNode = function(node) {
    this.currentNode.addSubtree(node);
};

/**
 * Adds a child to the current node of the tree and updates the current node to the added node.
 *
 * @param {Object} value the value of the node
 */
Tree.prototype.descend = function (value) {
    if (!this.tree) {
        this.tree = this.currentNode = new TreeNode(value);
    } else {
        this.currentNode = this.currentNode.add(value);
    }
};

/**
 * Updates the current node to its parent.
 */
Tree.prototype.ascend = function () {
    this.currentNode = this.currentNode.parent;
};

/**
 * Returns a string representation of this CST.
 *
 * @return {String} a string representation of this CST
 */
Tree.prototype.toString = function () {
    return this.tree.toString();
};


function TreeNode(value, parent) {
    this.value = value === undefined ? null : value;
    this.parent = parent === undefined ? null : parent;

    this.children = [];

    this.visits = 0;
}

TreeNode.prototype.add = function (value, index) {
    var child = new TreeNode(value, this);

    if (index === undefined) {
        this.children.push(child);
    } else {
        for (var i = this.children.length; i > index; i--) {
            this.children[i] = this.children[i - 1];
        }

        this.children[index] = child;
    }

    return child;
};

TreeNode.prototype.addSubtree = function (subtree) {
    if (subtree) {
        this.children.push(subtree);
    }
};

TreeNode.prototype.getFirstLeaf = function () {
    var node = this;
    while (node.hasChildren()) {
        node = node.children[0];
    }

    return node.value;
};

TreeNode.prototype.getLastLeaf = function () {
    var node = this;
    while (node.hasChildren()) {
        node = node.children[node.children.length - 1];
    }

    return node.value;
};

TreeNode.prototype.getLastChild = function () {
    return this.children[this.children.length - 1];
};

TreeNode.prototype.hasChildren = function () {
    return this.children.length > 0;
};

TreeNode.prototype.hasOneChild = function () {
    return this.children.length === 1;
};

TreeNode.prototype.toString = function () {
    var str = toString(this);

    // For the syntax tree builder. If it receives an input of [<str>] with no child like [<str>[]],
    //   it will throw an exception, so add an empty child. I think the only instance this happens
    //   is with {} $ as a program.
    if (str.replace(/[^\[\]]+/g, '').length < 3) {
        str = str.substr(0, str.length - 1) + '[]]';
    }

    return str;
};

function toString(node) {
    var str = '[' + node.value.toString();

    for (var i = 0; i < node.children.length; i++) {
        str += toString(node.children[i]);
    }

    return str + ']';
}

/**
 * A function to test if the backward reference to the parent node caused a memory leak.
 * Short answer: It doesn't.
 */
TreeNode.testMemory = function() {
    for (var i = 0; i < 100000000; i++) {
        var node = new TreeNode('_');
        var root = node;

        node = node.add('a');
        node = node.add('b');
        node = node.add('c');
        node = node.add('d');

        //delete root;
        //delete node;

        if (i % 500000 === 0)
            console.log(i);
    }
};

window.Tree = Tree;
window.TreeNode = TreeNode;

})();
