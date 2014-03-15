
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
    var registers = OS.Cpu.getRegisters();

    for (var register in registers) {
        var value = '0x' + registers[register].data.toHex(2);
        var status = registers[register].status;

        _registers[register].html(status.CpuDisplay_formatValue(value));

        registers[register].resetStatus();
    }
};

OS.RegisterStatus.NORMAL.CpuDisplay_formatValue = function (value) {
    return value;
};

OS.RegisterStatus.READ.CpuDisplay_formatValue = function (value) {
    return '<span class="blue">' + value + '</span>';
};

OS.RegisterStatus.WRITTEN.CpuDisplay_formatValue = function (value) {
    return '<span class="green">' + value + '</span>';
};

})();
