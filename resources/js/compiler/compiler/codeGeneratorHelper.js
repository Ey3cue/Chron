
(function () {

var SymbolTable = Compiler.SymbolTable;
var Scope = Compiler.Scope;
var Symbol = Compiler.Symbol;

/**
 * A code object to maintain the current code in the generation.
 */
Compiler.Code = Code;
function Code() {
    this.code = []; // Grows down
    this.currentAddress = 0;
    this.heap = []; // Grows up
    this.heapAddress = 255;
}

/**
 * A versatile function which takes the given code, as an array of codes or a string or a
 * combination of the two and adds them to the current code.
 *
 * @param {Object} codes the codes to add
 */
Code.prototype.add = function (codes) {
    var i;
    if ($.isArray(codes)) {
        for (i = 0; i < codes.length; i++) {
            codes[i] = codes[i].replace(/[^TJA-F0-9]/g, '');
            for (var j = 0; j < codes[i].length; j += 2) {
                this.code.push(codes[i].substring(j, j + 2).prepad(2, '0'));
                this.currentAddress++;
            }
        }
    } else {
        codes = codes.replace(/[^TJA-F0-9]/g, '');
        for (i = 0; i < codes.length; i += 2) {
            this.code.push(codes.substring(i, i + 2).prepad(2, '0'));
            this.currentAddress++;
        }
    }
};

/**
 * Adds the given string to the heap and returns the address.
 *
 * @param {String} string the string to add
 *
 * @return {Number} the address of the string
 */
Code.prototype.addString = function (string) {
    this.heap.unshift('00');
    for (var i = string.length - 1; i >= 0; i--) {
        this.heap.unshift(string.charCodeAt(i).toHex(2));
    }

    this.heapAddress -= string.length + 1;

    return this.heapAddress; // Return string address
};

/**
 * Backpatches the code, replacing all J and T temporary addresses with those specified in the
 * given static and jump tables.
 *
 * @param {StaticTable} staticTable the completed static table
 * @param {JumpTable} jumpTable the completed jump table
 */
Code.prototype.backpatch = function (staticTable, jumpTable) {
    var word, entry, tempAddress, address;

    for (var i = 0; i < this.code.length; i++) {
        word = this.code[i];

        if (/T/.test(word)) {
            tempAddress = word + this.code[i + 1];
            entry = staticTable.get(tempAddress);
            this.code[i] = (this.currentAddress + entry.offset).toHex(2);
            this.code[i + 1] = '00'; // No addresses more than 1 byte
        } else if (/J/.test(word)) {
            entry = jumpTable.get(word);
            this.code[i] = entry.distance.toHex(2);
        }
    }
};

/**
 * Returns a string representation of this object (i.e. the code to be ran in an OS.)
 *
 * @return {String} a string representing this code object
 */
Code.prototype.toString = function () {
    var code = [].concat(this.code); // Make a copy

    while (code.length + this.heap.length < 255) {
        code.push('00');
    }

    code = code.concat(this.heap);

    if (code.length > 255) {
        Compiler.addError("Too much code for the given block size.");
    }

    var codeStr = '';
    for (var i = 0; i < code.length; i++) {
        codeStr += code[i] + ' ';
    }

    return codeStr + '00';
};


/**
 * A static table to hold temporary symbol addresses prior to backpatching.
 */
Compiler.StaticTable = StaticTable;
function StaticTable() {
    this.tempAddress = 0;
    this.offset = 0;
    this.entries = {};
}

/**
 * Adds a new symbol to the table.
 *
 * @param {Symbol} symbol the symbol to add
 */
StaticTable.prototype.add = function (symbol) {
    if (this.entries[symbol.id]) {
        throw 'SEMANTIC ANALYSIS FAILED!!!';
    }

    var address = 'T' + (this.tempAddress++).toHex(3);

    var entry = new StaticTableEntry(symbol, address, this.offset++);
    this.entries[symbol.id] = this.entries[address] = entry;
    return entry;
};

/**
 * Returns the static table entry represented by the given key (a symbol or ID).
 *
 * @param {Object} key the key representing the entry
 */
StaticTable.prototype.get = function (key) {
    if (Utils.is(key, Symbol)) {
        return this.entries[key.id];
    } else {
        return this.entries[key];
    }
};

/**
 * An entry in the static table.
 *
 * @param {Symbol} symbol the symbol
 * @param {Number} address the address
 * @param {Number} offset the offset
 */
Compiler.StaticTableEntry = StaticTableEntry;
function StaticTableEntry(symbol, address, offset) {
    this.symbol = symbol === undefined ? null : symbol;
    this.address = address === undefined ? null : address;
    this.offset = offset === undefined ? null : offset;
    this.pointer = symbol.type === 'string';
}


/**
 * A jump table to hold temporary jump addresses prior to backpatching.
 */
Compiler.JumpTable = JumpTable;
function JumpTable() {
    this.tempAddress = 0;
    this.lastEntries = []; // Emulating a stack, to handle nested whiles and ifs
    this.entries = {};
    this.numEntries = 0;
}

/**
 * Adds a new entry to the jump table given the current address in the code (to determine distance).
 *
 * @param {Number} currentAddress the current address in the code
 */
JumpTable.prototype.add = function (currentAddress) {
    if (this.tempAddress > 9) {
        Compiler.addError('More than 10 jump entries currently unsupported.');
        // Becuase of temporary address represented with 'J<digit>'
    }

    var address = 'J' + (this.tempAddress++);

    var entry = new JumpTableEntry(currentAddress, address);
    this.lastEntries.push(entry);
    this.entries[address] = entry;
    return entry;
};

/**
 * Sets the last jump address to the correct distance given the now current address.
 *
 * @param {Number} currentAddress the current address in the code
 */
JumpTable.prototype.setLast = function (currentAddress) {
    var lastEntry = this.lastEntries.pop(); // Get last entry
    // Set distance; still unsure as to why this is offset by 2
    lastEntry.distance = currentAddress - lastEntry.firstAddress - 2;
};

/**
 * Gets the jump table entry given the key (in this case usually J0-J9)
 *
 * @param {Object} key the key representing the entry
 */
JumpTable.prototype.get = function (key) {
    return this.entries[key];
};

/**
 * A jump table entry.
 *
 * @param {Number} firstAddress the first address
 * @param {Number} address the temporary address
 */
Compiler.JumpTableEntry = JumpTableEntry;
function JumpTableEntry(firstAddress, address) {
    this.firstAddress = firstAddress === undefined ? null : firstAddress;
    this.address = address === undefined ? null : address;
    this.distance = null;
}

})();
