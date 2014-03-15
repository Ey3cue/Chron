
var Utils = {};

(function () {

function defineFunction(obj, funct, name) {
    name = name || funct.name;

    if (obj.prototype.hasOwnProperty(name)) {
        console.warn('WARNING: PREDEFINED PROPERTY POSSIBLY OVERWRITTEN: ' + obj.name + ': ' + name);
    }

    Object.defineProperty(obj.prototype, name, { value: funct });
}

defineFunction(String, function contains(characters) {
    return this.indexOf(characters) !== -1;
});

defineFunction(String, function prepad(length, character) {
    character = character || ' ';
    var str = this.toString();

    while (str.length < length)
        str = character + str;

    return str;
});

defineFunction(String, function pad(length, character) {
    character = character || ' ';
    var str = this.toString();

    while (str.length < length)
        str += character;

    return str;
});

defineFunction(String, function varToTitle() {
    if (!this.length) {
        return this;
    }

    var str = this.replace(/([A-Z])/g, ' $1');
    return str[0].toUpperCase() + str.substring(1);
});

defineFunction(String, function varToPhrase() {
    if (!this.length) {
        return this.toString();
    }

    var str = this.toString();

    if (str.contains('_')) {
        // Convert contant to variable style
        str = str.replace(/_([A-Z])([A-Z]+)/g, function (match, first, second) {
            return first.toUpperCase() + second.toLowerCase();
        }).replace(/([A-Z]+)([A-Z].*)/, function (match, first, second) {
            return first.toLowerCase() + second;
        });
    } else if (str === str.toUpperCase()) {
        return str[0].toUpperCase() + str.substring(1).toLowerCase();
    }

    // Convert variable style to phrase
    str = str.replace(/([A-Z])/g, ' $1');
    return str[0].toUpperCase() + str.substring(1).toLowerCase();
});

defineFunction(String, function toCodeString() {
    var str = this.toString();
    var codeStr = '';

    for (var i = 0; i < str.length; i++) {
        codeStr += str.charCodeAt(i) + ' ';
    }

    return codeStr;
});

defineFunction(Number, function toHex(padding) {
    return padding ? this.toString(16).toUpperCase().prepad(padding, '0') :
                     this.toString(16).toUpperCase();
});

/**
 * Gives the ROT13 obfuscation of this string.
 *
 * Adapted from http://jsfromhell.com/string/rot13
 *
 * @return {String} the ROT13 abfuscation
 */
defineFunction(String, function rot13() {
    return this.replace(/[a-zA-Z]/g, function (c) {
        return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
});

/**
 * Converts the given integer to the two's complement representation.
 *
 * For e.g. 0xF7 is -9 represented in two's complement using 1 byte.
 *
 * (JavaScript's numbers are 64 bits until a bitwise operator is used on them, then they are
 *  converted to 32 bits).
 *
 * let x = -9, and n = 8 bits
 *
 * -x    = 0000 0000 0000 0000 0000 0000 0000 1001
 *       -                                       1 (subtract 1)
 *       = 0000 0000 0000 0000 0000 0000 0000 1000
 *       | 1111 1111 1111 1111 1111 1111 0000 0000 (| with ~(2^n - 1))
 *       = 1111 1111 1111 1111 1111 1111 0000 1000
 * ~x    = 0000 0000 0000 0000 0000 0000 1111 0111 = 0xF7
 *
 * @param {Number} integer the integer to convert
 * @param {Number} numberBytes the number of bytes representing the number (defaults to 1 if not
 *     specified)
 */
defineFunction(Number, function toTwosComplement(numberBytes) {
    var integer = this + 0; // Adding a zero treats it as a number instead of a JS object

    if (integer % 1 !== 0) {
        return;
    }

    var numberBits = (numberBytes || 1) * 8;

    // Ensure it's in range given the number of bits
    if (integer < (-(1 << (numberBits - 1))) || integer > ((1 << (numberBits - 1)) - 1))
        throw 'Integer out of range given ' + numberBytes + ' byte(s) to represent.';

    // If non-negative, return the value
    if (integer >= 0)
        return integer;

    // Else negative, convert to two's complement representation
    return ~(((-integer) - 1) | ~((1 << numberBits) - 1));
});

/**
 * Converts the given two's complement representation to the represented integer.
 *
 * For e.g. 0xF7 is -9 represented in two's complement using 1 byte.
 *
 * (JavaScript's numbers are 64 bits until a bitwise operator is used on them, then they are
 *  converted to 32 bits).
 *
 * let x = 0xF7, and n = 8 bits
 *
 * x     = 0000 0000 0000 0000 0000 0000 1111 0111
 * ~x    = 1111 1111 1111 1111 1111 1111 0000 1000
 *       & 0000 0000 0000 0000 0000 0000 1111 1111  (mask with 2^n - 1)
 *       = 0000 0000 0000 0000 0000 0000 0000 1000
 *       +                                       1  (add 1)
 *       = 0000 0000 0000 0000 0000 0000 0000 1001
 *
 * This gives 9, then return the negation.
 *
 * @param {Number} twosComplement the two's complement representation
 * @param {Object} numberBytes the number of bytes representing the number (defaults to 1 if not
 *     specified)
 *
 * @return {Number} the represented integer
 */
defineFunction(Number, function fromTwosComplement(numberBytes) {
    var twosComplement = this + 0;
    var numberBits = (numberBytes || 1) * 8;

    if (twosComplement < 0 || twosComplement > (1 << numberBits) - 1)
        throw 'Two\'s complement out of range given ' + numberBytes + ' byte(s) to represent.';

    // If less than the maximum positive: 2^(n-1)-1, the number stays positive
    if (twosComplement <= (1 << (numberBits - 1)) - 1)
        return twosComplement;

    // Else convert to it's negative representation
    return -(((~twosComplement) & ((1 << numberBits) - 1)) + 1);
});

/**
 * Adds the addend to this number treating them as if they are represented in two's complement given
 * the specified number of bytes to represent.
 *
 * @param {Number} addend the number to add
 * @param {Number} numberBytes the number of bytes used to represent the number
 *
 * @return {Number} the result of the addition
 */
defineFunction(Number, function addTwosComplement(addend, numberBytes) {
    var number = this + 0;
    var numberBits = (numberBytes || 1) * 8;

    // Mask to remove the overflow bit if there is one
    return ~(-1 << numberBits) & (number + addend);
});

defineFunction(Array, Array.prototype.push, 'enqueue');
defineFunction(Array, Array.prototype.shift, 'dequeue');

defineFunction(Array, function remove(index) {
    return this.splice(index, 1)[0];
});

Utils.bidirectional = function (obj) {
    for (var key in obj) {
        obj[obj[key]] = key;
    }

    return obj;
};

Utils.number = function (obj, start) {
    var id = start === undefined ? 0 : start;

    if ($.isArray(obj)) {
        var array = obj;
        obj = {};

        for (var i = 0; i < array.length; i++) {
            obj[array[i]] = id++;
        }

        return obj;
    }

    for (var key in obj) {
        obj[key] = id++;
    }

    return obj;
};

/**
 * Returns an object of the URL parameters.
 *
 * Adapted from http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
 *
 * @return {Object} an object of the URL parameters
 */
Utils.getUrlParameters = function () {
    var params = {};
    var vars = window.location.search.substring(1).split('&');

    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');

        // If first entry with this name
        if (typeof params[pair[0]] === 'undefined') {
            params[pair[0]] = pair[1];
        // If second entry with this name
        } else if (typeof params[pair[0]] === 'string') {
            var arr = [params[pair[0]], pair[1]];
            params[pair[0]] = arr;
        // If third or later entry with this name
        } else {
            params[pair[0]].push(pair[1]);
        }
    }

    return params;
};

Utils.textToHtml = function (text) {
    return $('<div>').text(text).html();
};

Utils.pixelToLineHeight = {
    13: 15,
    14: 17,
    15: 16,
    16: 19
};

/**
 * Returns true if HTML5 local storage is supported.
 *
 * @return {Boolean} true if HTML5 local storage is supported
 */
Utils.html5StorageSupported = function () {
    try {
        return "localStorage" in window && window["localStorage"] !== null;
    } catch (e) {
        return false;
    }
};

})();
