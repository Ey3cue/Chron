
OS.KeyboardDriver = {};

(function () {

var _loaded = false;

OS.KeyboardDriver.start = function () {
    _loaded = true;
    trace('Driver loaded.');
};

OS.KeyboardDriver.stop = function () {
    _loaded = false;
    trace('Driver unloaded.');
};

/**
 * The interrupt service routine to be called by the Kernel for interrupt handling.
 */
OS.KeyboardDriver.isr = function () {
    var buffer = OS.Console.getInputBuffer();

    for (var i = 0; i < buffer.length; i++) {
        var input = buffer[i];
        var keyCode = input.which;

        trace(
            'Key entered: '+
            (input.ctrl ? 'Ctrl+' : '') +
            (input.alt ? 'Alt+' : '') +
            (input.shift ? 'Shift+': '') +
            '[' + keyCode + ']'
        );

        var chr = '';

        // Check to see if we even want to deal with the key that was pressed.
        if ( ((keyCode >= 65) && (keyCode <=  90)) ||  // A..Z
             ((keyCode >= 97) && (keyCode <= 123)) ) { // a..z
            // Determine the character we want to display.  
            // Assume it's lowercase...
            chr = String.fromCharCode(keyCode + 32);
            // ... then check the shift key and re-adjust if necessary.
            if (input.shift) {
                chr = String.fromCharCode(keyCode);
            }

            OS.Console.writeInput(chr);
        } else if ( ((keyCode >=  48) && (keyCode <=  57)) ||  // digits...
                    ((keyCode >= 186) && (keyCode <= 192)) ||  // special characters...
                    ((keyCode >= 219) && (keyCode <= 222)) ) { // more special characters...
            // Special keys like `, -, =, et cetera, produce JavaScript codes - convert to ASCII
            if (keyCode > 127) {
                keyCode = _specialSymbolCodes[keyCode];
            }

            chr = String.fromCharCode(keyCode);
            if (input.shift) {
                chr = _shiftedSymbols[chr];
            }

            OS.Console.writeInput(chr);
        } else if (keyCode === 32) { // Space
            OS.Console.writeInput(' ');
        } else if (keyCode === 13) { // Enter
            OS.Console.enter();
            // TODO tell shell to handle input
        } else if (keyCode === 8) { // Backspace
            OS.Console.backspace();
        }
    }
};

function trace(message) {
    OS.log(message, 'KeyboardDriver');
}

/** Maps a key code (except letters) to the shifted form of it's character. */
var _shiftedSymbols = {
    '`': '~',
    '0': ')',
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    ';': ':',
    "'": '"',
    '"': "'",
    ',': '<',
    '.': '>',
    '/': '?',
    '\\': '|'
};

/** Maps JavaScript to ASCII character codes (at least the ones we care about). */
var _specialSymbolCodes = {
    192: 96, // `
    189: 45, // -
    187: 61, // =
    219: 91, // [
    221: 93, // ]
    186: 59, // ;
    222: 39, // '
    188: 44, // ,
    190: 46, // .
    191: 47, // /
    220: 92  // \
};

})();