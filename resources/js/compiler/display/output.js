
Compiler.Output = {};

(function () {

var _$display;
var _$displayContainer;

var _log;

Compiler.Output.init = function () {
    _$display = $('#compilerOutput');
    _$displayContainer = $('#compilerOutputContainer');

    _log = '';
};

Compiler.Output.add = function (message) {
    _log += (message || '') + '\n';
};

Compiler.Output.show = function () {
    _$display.html(_$display.html() + convertMessage(_log));
    scrollToBottom();
};

Compiler.Output.showCode = function (code) {
    var $code = $('<div class="compilerCode">' + code + '</div>');
    _$display.append($code).html(_$display.html() + '\n');
    scrollToBottom();
};

function convertMessage(message) {
    message = Utils.textToHtml(message);
    message = message.replace(/'(.*?)'/g, '<span class="blue">$1</span>');

    return message.replace(/Error/g, '<span class="red">ERROR</span>')
                  .replace(/Warning/g, '<span class="orange">WARNING</span>');
}

Compiler.Output.clear = function () {
    _log = '';
    _$display.html(_log);
};

function scrollToBottom() {
    _$displayContainer.scrollTop(_$display.height() - _$displayContainer.height());
    _$displayContainer.perfectScrollbar('update');
}

})();
