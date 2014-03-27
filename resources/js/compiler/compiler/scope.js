
(function () {

/**
 * The head data structure to manage the symbols. It is a tree of Scope objects, which simply
 * contains an associative array of Symbol objects.
 */
SymbolTable.prototype = new Tree(); // Inherit Tree
Compiler.SymbolTable = SymbolTable;
function SymbolTable() {
    this.level = '';
    this.count = -1;
}

/**
 * Creates a new Scope, and sets the current scope to that table. To be called when entering
 * a new block.
 */
SymbolTable.prototype.createScope = function () {
    this.level += '>' + (++this.count);

    this.descend(new Scope());
};

/**
 * Adds and returns a new symbol to the current scope given the parameters.
 *
 * @param {String} name the symbol's name
 * @param {String} type the symbol's type
 * @param {Number} line the first line the symbol appears on in the source code
 * @param {String} scope a string representative of the symbol's scope
 *
 * @return {Symbol} the created symbol
 */
SymbolTable.prototype.addSymbol = function (name, type, line) {
    return this.currentNode.value.add(new Symbol(name, type, line, this.count, this.level));
};

/**
 * Searches for and returns the symbol given it's name in the current scope and parents of the
 * current scope. Returns null if the symbol doesn't exist.
 *
 * @param {String} name the symbol's name
 *
 * @return {Symbol} the symbol or null if the symbol doesn't exist
 */
SymbolTable.prototype.getSymbol = function (name) {
    var node = this.currentNode;
    var symbol;

    while (node) {
        symbol = node.value.get(name);

        if (symbol) {
            return symbol;
        }

        node = node.parent;
    }

    return null;
};

/**
 * Leaves the current scope (i.e. sets the current scope to its parent). To be called when exiting
 * a block.
 */
SymbolTable.prototype.leaveScope = function () {
    this.level = this.level.substring(0, this.level.lastIndexOf('>'));
    this.ascend();
};

/**
 * Checks this SymbolTable for unused and unitialized variables and adds warnings to the compiler as
 * necessary.
 */
SymbolTable.prototype.check = function () {
    check(this.tree);
};

/**
 * Recursive function which traverses through each scope, checking for unused and uninitialized
 * variables.
 *
 * @param {TreeNode} node the node the check
 */
function check(node) {
    var symbols = node.value.symbols;

    for (var name in symbols) {
        var symbol = symbols[name];

        if (symbol.used && !symbol.assigned) {
            Compiler.addWarning("Variable not initialized: '" + name + "'", symbol.line);
        }
        if (!symbol.used) {
            Compiler.addWarning("Unused variable: '" + name + "'", symbol.line);
        }
    }

    for (var i = 0; i < node.children.length; i++) {
        check(node.children[i]);
    }
}

/**
 * Returns an array of all symbols. For use in displaying the table.
 */
SymbolTable.prototype.getSymbols = function () {
    return getSymbols(this.tree, []);
};

/**
 * Recursive function to traverse through each scope, adding every symbol to an array.
 */
function getSymbols(node, symbolsArray) {
    if (!node || !node.value) {
        return;
    }

    var symbols = node.value.symbols;

    for (var name in symbols) {
        symbolsArray.push(symbols[name]);
    }

    for (var i = 0; i < node.children.length; i++) {
        getSymbols(node.children[i], symbolsArray);
    }

    return symbolsArray;
}

// ---------- Scope ----------

/**
 * Creates a new scope (i.e. an associative array). Using an object allows for custom functions to
 * act on the array, which is arguably more clear than doing everything in the tree.
 */
Compiler.Scope = Scope;
function Scope() {
    this.symbols = {};
}

/**
 * Adds the specified symbol to the scope. Throws an exception if the symbol is already defined.
 *
 * @param {Symbol} symbol the symbol to add
 *
 * @return {Symbol} the symbol
 */
Scope.prototype.add = function (symbol) {
    if (this.symbols[symbol.name]){
        throw "Variable has already been declared: '" + symbol.name + "'";
    }

    this.symbols[symbol.name] = symbol;
    return symbol;
};

/**
 * Returns the symbol given its name, or null if the symbol doesn't exist.
 *
 * @param {String} symbolName the symbol's name
 *
 * @return {Symbol} the symbol or null if the symbol doesn't exist
 */
Scope.prototype.get = function(symbolName) {
    var symbol = this.symbols[symbolName];

    return symbol || null;
};


// ---------- Symbol ----------

/**
 * Creates a new symbol given the parameters.
 *
 * @param {String} name the symbol's name
 * @param {String} type the symbol's type
 * @param {Number} line the first line the symbol appears on in the source code
 * @param {String} scope a string representative of the symbol's scope
 *
 * @return {Symbol} the new symbol
 */
Compiler.Symbol = Symbol;
function Symbol(name, type, line, scope, scopeLevel) {
    this.name = name === undefined ? null : name;
    this.type = type === undefined ? null : type;

    this.line = line === undefined ? -1 : line;
    this.scope = scope === undefined ? '' : scope;
    this.scopeLevel = scopeLevel === undefined ? '' : scopeLevel;

    this.id = this.name + '@' + this.scope; // A unique idenifier for this symbol

    this.used = false;
    this.assigned = false;
}

Symbol.prototype.is = function (type) {
    return this.type === type;
};

/**
 * Returns a string representation of this symbol. In this case, the name for use in the AST display.
 *
 * @return {String} a string representation of this symbol
 */
Symbol.prototype.toString = function () {
    return this.name;
};

})();
