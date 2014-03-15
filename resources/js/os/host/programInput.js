
OS.ProgramInput = {};

(function () {

var _$container;
var _$display;

var EXAMPLES = [
    // 12DONE
    'A9 03 8D 41 00 A9 01 8D 40 00 AC 40 00 A2 01 FF EE 40 00 AE 40 00 EC 41 00 D0 EF A9 44 8D 42 00 A9 4F 8D 43 00 A9 4E 8D 44 00 A9 45 8D 45 00 A9 00 8D 46 00 A2 02 A0 42 FF 00'
];

OS.ProgramInput.init = function () {
    _$container = $('#osProgramInputContainer');
    _$display = $('#osProgramInput');
    _$display.html(EXAMPLES[0]);

    _$display.keypress(keyPress)
             .blur(filterInput);
};

OS.ProgramInput.start = function () {
    _$container.css('opacity', 1);
};

OS.ProgramInput.stop = function () {
    _$container.css('opacity', 0);
};

OS.ProgramInput.getInput = function () {
    return filter(_$display.html());
};

function keyPress(event) {
    _$container.perfectScrollbar('update');
}

function filterInput(event) {
    var rawCode = filter(_$display.html());
    var code = '';

    // Add a space between every two characters
    for (var i = 0; i < rawCode.length; i += 2) {
        code += rawCode.substr(i, 2) + ' ';
    }

    _$display.html(code);
}

function filter(input) {
    // Remove any tags and non-hex characters
    return input.replace(/(<.*?>)|([^a-f0-9])/gi, '').toUpperCase();
}

})();
