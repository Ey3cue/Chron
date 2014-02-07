
OS.CpuDisplay = {};

(function () {

var _$display;

var _registers;

OS.CpuDisplay.init = function () {
    _$display =  $('#osCpuDisplay');

    _registers = {};

    var registers = ['pc', 'acc', 'x', 'y', 'z'];
    for (var i = 0; i < registers.length; i++) {
        var title = registers[i].toUpperCase();
        var $register = $(
            '<div id="osReg' + title + '">' +
                '<div class="regTitle">' + title + '</div>' +
                '<div class="regValue">0x00</div>' +
            '</div>' +
            '<div class="spacer"></div>'
        );

        _$display.append($register);
        _registers[registers[i]] = $('.regValue', $register);
    }
};

OS.CpuDisplay.start = function () {
    _$display.css('opacity', 1);
};

OS.CpuDisplay.stop = function () {
    _$display.css('opacity', 0);
};

OS.CpuDisplay.update = function () {
    // TODO
};


})();