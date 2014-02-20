
OS.HardDriveDisplay = {};

(function () {

var _$displayContainer;
var _$displayScroller;
var _$display;

var _$viewer;
var _$viewerStatus;
var _$viewerLink;
var _$viewerData;

var _$expandButton;

OS.HardDriveDisplay.init = function () {
    _$displayContainer = $('#osHardDriveDisplayContainer');
    _$displayScroller = $('#osHardDroveDisplayScroller');
    _$display = $('#osHardDriveDisplay');
    _$viewer = $('#osHardDriveDataViewer');

    _$viewer.html('<table>' +
                      '<tr><th>Status</th><th>Link</th><th>Data</th></tr>' +
                      '<tr><td></td><td></td><td></td></tr>' +
                  '</table>');

    var $tds = $('td', _$viewer);
    _$viewerStatus = $($tds[0]);
    _$viewerLink = $($tds[1]);
    _$viewerData = $($tds[2]);

    _$expandButton = $('#osButtonHardDriveExpand');

    $('#osButtonHardDriveRefresh').click(OS.HardDriveDisplay.update);
    _$expandButton.click(OS.HardDriveDisplay.toggleExpand);

    OS.HardDriveDisplay.update();
};

OS.HardDriveDisplay.start = function () {
    _$display.css('opacity', 1);
};

OS.HardDriveDisplay.stop = function () {
    _$display.css('opacity', 0);
};

OS.HardDriveDisplay.update = function () {
    var t, s, b;
    var dataObjects = [];


    for (t = 0; t < OS.hardDrive.tracks; t++) {
        for (s = 0; s < OS.hardDrive.sectors; s++) {
            for (b = 0; b < OS.hardDrive.blocksPer; b++) {
                dataObjects.push({
                    t: t,
                    s: s,
                    b: b,
                    data: OS.hardDrive.read(t, s, b)
                });
            }
        }
    }

    var emptyCount = 0;
    var startEmptyIndex;
    var html = '';

    function addData() {
        if (emptyCount > 6) {
            html += formatData(dataObjects[startEmptyIndex]) +
                    //formatData(dataObjects[startEmptyIndex + 1]) +
                    '<div class="osHardDriveDisplaySeparator"></div>' +
                    //formatData(dataObjects[i - 2]) +
                    formatData(dataObjects[i - 1]);
        } else if (emptyCount > 0) {
            for (var j = startEmptyIndex; j < i; j++) {
                html += formatData(dataObjects[j]);
            }
        }

        html += formatData(dataObjects[i]);
    }

    for (var i = 0; i < dataObjects.length; i++) {
        var data = dataObjects[i].data;

        if (/^0+$/.test(data)) {
            emptyCount++;

            if (emptyCount === 1) {
                startEmptyIndex = i;
            }

            if (i === dataObjects.length - 1) {
                addData();
            }
        } else {
            addData();
            emptyCount = 0;
        }
    }

    _$display.html(html);
    _$displayScroller.perfectScrollbar('update');

    setHovers();
};

function setHovers() {
    $('.block', _$display).mouseenter(function (event) {
        var $this = $(this);
        var matches = $this.text().match(/.* ([0-9A-F]{2}) ([0-9A-F]{6}) (.*)/);
        var status = matches[1], tsb = matches[2], data = matches[3];

        if (!/^0+$/.test(tsb)) {
            $('#' + tsb, _$display).addClass('linked');
        }
        _$viewer.addClass('visible');

        _$viewerStatus.html(status === '00' ? 'Available' : 'Occupied');
        _$viewerLink.html((tsb[0] === '0' ? '' : tsb[0]) + tsb[1] + ':' +
                          (tsb[2] === '0' ? '' : tsb[2]) + tsb[3] + ':' +
                          (tsb[4] === '0' ? '' : tsb[4]) + tsb[5]);
        var revertedData = OS.File.revertData(data);
        _$viewerData.html(revertedData.length ? revertedData : '--');

    }).mouseleave(function (event) {
        $('.block', _$display).removeClass('linked');
        _$viewer.removeClass('visible');
    });
}

function removeZero(str) {
    return str[0] === '0' ? str[1] : str;
}

function formatData(dataObject) {
    var tHex = dataObject.t.toHex(), sHex = dataObject.s.toHex(), bHex = dataObject.b.toHex();
    var matches = dataObject.data.match(/([0-9A-F]{2})([0-9A-F]{6})(.*)/);

    return '<div id="' + tHex.prepad(2, '0') + sHex.prepad(2, '0') + bHex.prepad(2, '0') + '" ' +
                'class="block' + (matches[1] === '00' ? ' grey' : '') + '">' +
               '<span class="grey">' + tHex + ':' + sHex + ':' + bHex + '</span> ' +
               matches[1] + ' ' + // Status
               matches[2] + ' ' + // Linked TSB
               matches[3] +       // Data
           '</div>';

}

OS.HardDriveDisplay.toggleExpand = function () {
    _$expandButton.toggleClass('osButtonExpand osButtonRestore');
    _$displayContainer.toggleClass('expanded');
    // Must wait till after animation to update
    setTimeout(function () { _$displayScroller.perfectScrollbar('update'); }, 400);

};

})();
