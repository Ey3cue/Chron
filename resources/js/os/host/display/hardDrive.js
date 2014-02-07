
OS.HardDriveDisplay = {};

(function () {

var _$displayContainer;
var _$display;

OS.HardDriveDisplay.init = function () {
    _$displayContainer = $('#osHardDriveDisplayContainer');
    _$display = $('#osHardDriveDisplay');

    OS.HardDriveDisplay.update();
};

OS.HardDriveDisplay.start = function () {
    _$display.css('opacity', 1);
};

OS.HardDriveDisplay.stop = function () {
    _$display.css('opacity', 0);
};

OS.HardDriveDisplay.update = function () {
    var data, t, s, b;
    var html = '';

    for (t = 0; t < OS.hardDrive.tracks; t++) {
        for (s = 0; s < OS.hardDrive.sectors; s++) {
            for (b = 0; b < OS.hardDrive.blocksPer; b++) {
                data = OS.hardDrive.read(t, s, b);

                html +=
                    '<div class="block">' +
                        '<span class="tsb">' + t + ':' + s + ':' + b + '</span> ' +
                        data.substr(0, 2) + ' ' + // Status
                        data.substr(2, 6) + ' ' + // TSB
                        data.substr(8)    +       // Data
                    '</div>';
            }
        }
    }

    _$display.html(html);
    _$displayContainer.perfectScrollbar('update');
};

})();
