
(function () {

/**
 * Creates a new Graph. More specifically geared toward a directed acyclic graph.
 */
function Graph() {
    this.graph = null;
    this.currentNode = null;
}

/**
 * Adds a child to the current node of the tree containing the specified value.
 *  
 * @param {Object} value the value of the node
 */
Graph.prototype.add = function (value) {
    this.currentNode.add(value);
};

Graph.prototype.addNode = function(node) {
    this.currentNode.addSubgraph(node);
};

/**
 * Adds a child to the current node of the tree and updates the current node to the added node.
 *  
 * @param {Object} value the value of the node
 */
Graph.prototype.descend = function (value) {
    if (!this.graph) {
        this.graph = this.currentNode = new GraphNode(value);
    } else {
        this.currentNode = this.currentNode.add(value);
    }
};

/**
 * Updates the current node to its parent. 
 */
Graph.prototype.ascend = function () {
    this.currentNode = this.currentNode.parent;
};


function GraphNode(value, parent) {
    this.value = value === undefined ? null : value;
    this.parent = parent === undefined ? null : parent;

    this.children = [];

    this.visits = [0];
}

GraphNode.prototype.add = function (value, index) {
    var child = new GraphNode(value, this);
    
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

GraphNode.prototype.addSubgraph = function (subgraph) {
    if (subgraph) {
        this.children.push(subgraph);
    }
};

GraphNode.prototype.setNewVisitor = function () {
    setVisitsTraverse(this, function (node) {
        node.visits.push(0);
    });
};

GraphNode.prototype.resetVisitor = function () {
    setVisitsTraverse(this, function (node) {
        node.visits.pop();
    });
};

GraphNode.prototype.visit = function () {
    this.visits[this.visits.length - 1]++;
};

GraphNode.prototype.getVisits =
GraphNode.prototype.wasVisited = function () {
    return this.visits[this.visits.length - 1];
};

GraphNode.prototype.childrenWereVisited = function () {
    var visits = 0;
    for (var i = this.children.length - 1; i >= 0; i--) {
        visits += this.children[i].visits;
    }

    return visits;
};

GraphNode.prototype.getUnvisitedChildren = function () {
    var unvisitedChildren = 0;
    for (i = 0; i < this.children.length; i++) {
        unvisitedChildren += this.children[i].getVisits() ? 0 : 1;
    }
    return unvisitedChildren;
};

function setVisitsTraverse(node, funct) {
    if (!node.traversalVisit) {
        node.traversalVisit = true;

        funct(node);

        for (var i = 0; i < node.children.length; i++) {
            setVisitsTraverse(node.children[i], funct);
        }
    }
    node.traversalVisit = undefined;
}

GraphNode.prototype.traverse = function (funct) {
    this.setNewVisitor();
    traverse(this, funct);
    // Don't need to call reset here since we're doing it in the traversal.
};

function traverse(node, funct) {
    if (!node.wasVisited()) {
        node.visit();

        funct(node);

        for (var i = 0; i < node.children.length; i++) {
            traverse(node.children[i], funct);
        }
    }

    node.visits.pop();
}

GraphNode.prototype.toString = function () {
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
    var str;
    try {
        str = '[' + sourceCode[node.value[0].value.line].replace(/ +/g, '.');
    } catch (e) {
        str = '[null';
    }
    
    for (var i = 0; i < node.children.length; i++) {
        str += toString(node.children[i]);
    }
    
    return str + ']';
}

/* ---------- CFG-specific ---------- */
GraphNode.prototype.getBlock = function () {
    return this.value;
};

GraphNode.prototype.getLastBlockMember = function () {
    return this.value[this.value.length - 1];
};

// Make available globally
window.Graph = Graph;
window.GraphNode = GraphNode;

})();