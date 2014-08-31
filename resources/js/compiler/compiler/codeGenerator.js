
Compiler.CodeGenerator = {};

(function () {

var CodeGenerator = Compiler.CodeGenerator;

var Nonterminal = Compiler.Nonterminal;
var Token = Compiler.Token;

var Code = Compiler.Code;
var StaticTable = Compiler.StaticTable;
var StaticTableEntry = Compiler.StaticTableEntry;
var JumpTable = Compiler.JumpTable;
var JumpTableEntry = Compiler.JumpTableEntry;

var _code;
var _staticTable;
var _jumpTable;

/**
 * Generates 6502a assembly code given the specified AST.
 *
 * @param {AST} ast (optional) the ast to generate code from. If not specified, it is taken from the
 *     compiler.
 */
CodeGenerator.generate = function (ast) {
    ast = ast || Compiler.ast;

    _code = new Code();
    _staticTable = new StaticTable();
    _jumpTable = new JumpTable();

    generate(ast.tree);
    Ops.brk();

    _code.backpatch(_staticTable, _jumpTable);

    Compiler.code = _code.toString();
};

// ---------- Code Generation ----------
/*
 * Notes:
 *
 * I had to implement a temporary memory location with which to perform adds (amoung other
 * operations), as the only way to add is the add with carry operation, which only accepts a memory
 * location. Ideally, this should be a symbol stored in the static data, but implementing a symbol
 * for this purpose would make this more complex than it should be.
 *
 * Any load or store op function call without a passed paramter defaults to the temporary address.
 */

/**
 * Recursive method which generates code for the given node. The final traversal of the AST.
 */
function generate(node) {
    if (Utils.is(node.value, Compiler.Symbol)) {
        return generateId(node);
    }

    // Note that returns here produce the same outcome as a break
    switch (node.value.kind) {
        case Nonterminal.Kind.BLOCK:       return generateBlock(node);
        case Nonterminal.Kind.WHILE:       return generateWhile(node);
        case Nonterminal.Kind.IF:          return generateIf(node);
        case Nonterminal.Kind.DECLARATION: return generateDeclaration(node);
        case Nonterminal.Kind.ASSIGNMENT:  return generateAssignment(node);
        case Nonterminal.Kind.STRING:      return generateString(node);
        case Nonterminal.Kind.PRINT:       return generatePrint(node);
        case Nonterminal.Kind.ADD:         return generateIntop(node);
        case Nonterminal.Kind.EQUAL:       return generateBoolop(node);
        case Nonterminal.Kind.NOT_EQUAL:   return generateBoolop(node);

        case Token.Kind.DIGIT:             return generateDigit(node);
        case Token.Kind.BOOLVAL:           return generateBoolval(node);
        // Recall ID tokens are symbols now

        default:                           console.log(node.value); throw 'Error generating.';
    }
}

/**
 * Generates code for a block node.
 */
function generateBlock(node) {
    // Generate code for each statement
    for (var i = 0; i < node.children.length; i++) {
        generate(node.children[i]);
    }
}

/**
 * Generates code for a while node.
 */
function generateWhile(node) {
    var address = _code.currentAddress;
    // Generate comparison
    generate(node.children[0]);
    var entry = _jumpTable.add(_code.currentAddress);
    Ops.bne(entry.address);
    // Generate block
    generate(node.children[1]);
    // Unconditional Jump
    Ops.lda('00');
    Ops.sta();
    Ops.ldx('01');
    Ops.cpx();
    Ops.bne((OS.MEMORY_BLOCK_SIZE - (_code.currentAddress - address + 2)).toHex(2));
    // Set jump address
    _jumpTable.setLast(_code.currentAddress);
}

/**
 * Generates code for an if node.
 */
function generateIf(node) {
    // Generate comparison
    generate(node.children[0]);
    // Branch not equal
    var entry = _jumpTable.add(_code.currentAddress);
    Ops.bne(entry.address);
    // Generate block
    generate(node.children[1]);
    // Set jump address
    _jumpTable.setLast(_code.currentAddress);
}

/**
 * Generates code for a declaration node.
 */
function generateDeclaration(node) {
    // Add symbol to static table - recall that at this point, ID tokens have been replaced with
    //   their respective symbols
    var entry = _staticTable.add(node.children[1].value);

    Ops.lda('00');
    Ops.sta(entry.address);
}

/**
 * Generates code for an assignment node.
 */
function generateAssignment(node) {
    // Generate right side
    generate(node.children[1]);
    // Store in the symbol's address
    Ops.sta(_staticTable.get(node.children[0].value).address);
}

/**
 * Generates code for a string node.
 */
function generateString(node) {
    // Add string to heap
    var address = _code.addString(buildString(node));
    // Load string's address
    Ops.lda(address.toHex(2));
}

/**
 * Generates code for a print node.
 */
function generatePrint(node) {
    var child = node.children[0].value;

    if (Utils.is(child, Compiler.Symbol) && child.is('string')) {
        // String symbol
        Ops.ldx('02');
        Ops.ldy(_staticTable.get(child).address);
        Ops.sys();
    } else if (child.is(Nonterminal.Kind.STRING)) {
        // String literal
        var address = _code.addString(buildString(node.children[0]));
        Ops.lda(address.toHex(2));
        Ops.sta();
        Ops.ldx('02');
        Ops.ldy();
        Ops.sys();
    } else {
        generate(node.children[0]);

        // Note that an equals operator will store its result in the Z register, which is
        //   inaccessible for printing. From the implementation, it will print the result of the
        //   right expression of the equals operator.
        Ops.ldx('01'); // Load 1 into X register to print an integer
        Ops.sta();     // Store value to print
        Ops.ldy();     // Load value into Y register
        Ops.sys();     // System call
    }
}

/**
 * Generates code for a add node.
 */
function generateIntop(node) {
    generate(node.children[1]);
    Ops.adc(node.children[0].value.value); // In our grammar, there can only ever be a digit here
}

/**
 * Generates code for a equals ('==') node.
 */
function generateBoolop(node) {
    var leftChild = node.children[0];
    var rightChild = node.children[1];

    if (node.value.is(Nonterminal.Kind.NOT_EQUAL)) {
        Compiler.addError("'!=' operator currently unsupported.", node.value.line);
        // TODO
    }

    if (leftChild.value.is(Nonterminal.Kind.EQUAL) || leftChild.value.is(Nonterminal.Kind.NOT_EQUAL) ||
        rightChild.value.is(Nonterminal.Kind.EQUAL) || rightChild.value.is(Nonterminal.Kind.NOT_EQUAL)) {
        // This very tricky with our instruction set because it requires comparing the result
        //   of a comparison to another value. Since the result of a comparison is stored in the Z
        //   register, it's only indirectly accessible with branches.
        //   e.g. if (true==(1==1)) { ... }
        Compiler.addError("Nesting '==' or '!=' operators currently unsupported.", node.value.line);
        // TODO
    }

    console.log(leftChild);
    console.log(rightChild);

    if (leftChild.value.is(Nonterminal.Kind.STRING) ||
        (Utils.is(leftChild.value, Compiler.Symbol) && leftChild.value.is('string')) ) {
        Compiler.addError("Comparing 'string' types currently unsupported.", node.value.line);
    }

    // Generate left side
    generate(leftChild);
    // Store result in X register
    Ops.sta();
    Ops.ldx();
    // Generate right side
    generate(rightChild);
    // Compare
    Ops.sta();
    Ops.cpx();
}

/**
 * Generates code for a digit node.
 */
function generateDigit(node) {
    Ops.lda(parseInt(node.value.value, 10).toHex(2));
}

/**
 * Generates code for an ID node.
 */
function generateId(node) {
    // Load the symbol's address
    Ops.lda(_staticTable.get(node.value).address);
}

/**
 * Generates code for a boolean node.
 */
function generateBoolval(node) {
    // Puts result in both ACC and Z
    if (node.value.value === 'true') {
        Ops.lda('01');
        Ops.sta();
        Ops.ldx('01');
        Ops.cpx();
    } else /* false */ {
        Ops.lda('00');
        Ops.sta();
        Ops.ldx('01');
        Ops.cpx();
    }
}

/**
 * Builds a string from the given string node.
 *
 * @param {TreeNode} stringNode the node representing the string
 *
 * @return {String} the string represented by the node and its children.
 */
function buildString(stringNode) {
    var string = '';
    for (var i = 0; i < stringNode.children.length; i++) {
        string += stringNode.children[i].value;
    }
    return string;
}

// ---------- Operations ----------

// An object designed to represent the operations in the 6502a istruction set.
var Ops = {};

// The temporary address to use in misc ops.
Ops.DEFAULT_TEMP_ADDR = 'FF00';

/** Load accumulator. */
Ops.lda = function (hex) {
    hex = hex || Ops.DEFAULT_TEMP_ADDR;

    if (hex.length > 2) {
        _code.add('AD' + hex); // Address
    } else {
        _code.add('A9' + hex); // Constant
    }
};

/** Store accumulator. */
Ops.sta = function (hex) {
    hex = hex || Ops.DEFAULT_TEMP_ADDR;
    _code.add('8D' + hex);
};

/** Add with carry. */
Ops.adc = function (hex) {
    hex = hex || Ops.DEFAULT_TEMP_ADDR;

    if (hex.length > 2) {
        _code.add('6D' + hex); // Address
    } else {
        // Constant (this isn't a standard operation, so it must be implemented)
        Ops.sta();     // Store current value
        Ops.lda(hex);  // Load number to add
        Ops.adc();     // Add stored value
    }
};

/** Load X register. */
Ops.ldx = function (hex) {
    hex = hex || Ops.DEFAULT_TEMP_ADDR;

    if (hex.length > 2) {
        _code.add('AE' + hex); // Address
    } else {
        _code.add('A2' + hex); // Constant
    }
};

/** Load Y register. */
Ops.ldy = function (hex) {
    hex = hex || Ops.DEFAULT_TEMP_ADDR;

    if (hex.length > 2) {
        _code.add('AC' + hex); // Address
    } else {
        _code.add('A0' + hex); // Constant
    }
};

/** Break. */
Ops.brk = function () {
    _code.add('00');
};

/** Compare. */
Ops.cpx = function (hex) {
    hex = hex || Ops.DEFAULT_TEMP_ADDR;
    _code.add('EC' + hex);
};

/** Branch not equal. */
Ops.bne = function (hex) {
    hex = hex || Ops.DEFAULT_TEMP_ADDR;
    _code.add('D0' + hex);
};

/** System call. */
Ops.sys = function () {
    _code.add('FF');
};

})();
