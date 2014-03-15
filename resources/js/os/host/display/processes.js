
OS.ProcessesDisplay = {};

(function () {

var _$container;
var _$display;

var HEADER = '<table><tr>' +
                 '<th>Status</th>' +
                 '<th>PID</th>' +
                 '<th>PC</th>' +
                 '<th>ACC</th>' +
                 '<th>X</th>' +
                 '<th>Y</th>' +
                 '<th>Z</th>' +
                 '<th>Page</th>' +
             '</tr>';

OS.ProcessesDisplay.init = function () {
    _$container = $('#osProcessesContainer');
    _$display = $('#osProcesses');
};

OS.ProcessesDisplay.start = function () {
    _$container.css('opacity', 1);
};

OS.ProcessesDisplay.stop = function () {
    _$container.css('opacity', 0);
};

OS.ProcessesDisplay.update = function () {
    var processes = OS.Kernel.getActiveProcesses();

    if (processes.length) {
        var table = HEADER;

        for (var i = 0; i < processes.length; i++) {
            var process = processes[i];
            var page = Math.floor(process.base / OS.MEMORY_BLOCK_SIZE);

            table += '<tr>' +
                         '<td>' + process.status.toString() + '</td>' +
                         '<td>' + process.pid + '</td>' +
                         '<td>0x' + process.pc.toHex(2) + '</td>' +
                         '<td>0x' + process.acc.toHex(2) + '</td>' +
                         '<td>0x' + process.xReg.toHex(2) + '</td>' +
                         '<td>0x' + process.yReg.toHex(2) + '</td>' +
                         '<td>0x' + process.zFlag.toHex(2) + '</td>' +
                         '<td>' + page + '</td>' +
                         '</tr>';
        }

        _$display.html(table + '</table>');
    } else {
        _$display.html('<span class="grey">No active processes.</span>');
    }

    _$container.perfectScrollbar('update');
};

})();
