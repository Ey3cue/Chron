
Compiler.TokenStreamDisplay = {};

(function () {

var STREAM_MIN_LENGTH = 120;
var MARQUEE_SPEED_FACTOR = 120;

var _$display;

var _marqueeOptions = {
    speed: 20000,
    gap: 0,
    delayBeforeStart: 0,
    direction: 'left'
};

Compiler.TokenStreamDisplay.init = function () {
    _$display = $('#compilerTokenStream');
};

Compiler.TokenStreamDisplay.set = function (tokens) {
    tokens = tokens || Compiler.tokenStream;

    if (!tokens.length) {
        error();
        return;
    }

    var html = '';
    var length = 0;

    for (var i = 0; i < tokens.length; i++) {
        var kindStr = tokens[i].kind.toString();
        html += '&nbsp;&nbsp;<span class="tokenNumber">' + i  + ':' + kindStr +
                ' </span>' + tokens[i].value;
        length += 5 + tokens[i].value.toString().length + kindStr.length;
    }

    while (length < STREAM_MIN_LENGTH) {
        html += html;
        length *= 2;
    }

    _$display.html(html);
    _marqueeOptions.speed = length * MARQUEE_SPEED_FACTOR;
    _$display.marquee(_marqueeOptions);
};

Compiler.TokenStreamDisplay.clear = function () {
    _$display.html('');
};

function error() {
    var html = '<span class="red">&nbsp;&nbsp;ERROR&nbsp;&nbsp;</span>';
    var length = 13;

    while (length < STREAM_MIN_LENGTH) {
        html += html;
        length *= 2;
    }

    _$display.html(html);
    _marqueeOptions.speed = length * MARQUEE_SPEED_FACTOR;
    _$display.marquee(_marqueeOptions);
}

})();
