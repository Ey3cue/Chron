
OS.MemoryDisplay = {};

(function () {

var _$displayContainer;
var _$display;

OS.MemoryDisplay.init = function () {
    _$displayContainer = $('#osMemoryDisplayContainer');
    _$display = $('#osMemoryDisplay');
};

OS.MemoryDisplay.start = function () {
    _$display.css('opacity', 1);
};

OS.MemoryDisplay.stop = function () {
    _$display.css('opacity', 0);
};

OS.MemoryDisplay.update = function () {
    var memory = OS.Memory.memory;
    var statuses = OS.Memory.statuses;

    var html = '';

    for (var i = 0; i < memory.length; i++) {
        if (i % OS.MEMORY_DISPLAY_ADDRESSES_PER_LINE === 0) {
            html += (i ? '\n' : '') +     // Add new line if i is not 0
                    '0x' + i.toHex(3);    // Current address
        }

        // statuses holds the proper enum type; call the formatWord function defined below to format
        //   the word depending on its status
        html += ' ' + statuses[i].MemoryDisplay_formatWord(memory[i]);
    }

    _$display.html(html);

    _$displayContainer.perfectScrollbar('update');
};

/*
 * These functions are added directly to the enum types of the MemoryStatus enum. This is a faster
 * way of writing a switch or if...else to format each word depending on its status.
 */

OS.MemoryStatus.NORMAL.MemoryDisplay_formatWord = function (value) {
    return value.toString(16).prepad(2, '0');
};

OS.MemoryStatus.READ.MemoryDisplay_formatWord = function (value) {
    return '<span class="green">' + value.toString(16).prepad(2, '0') + '</span>';
};

OS.MemoryStatus.WRITTEN.MemoryDisplay_formatWord = function (value) {
    return '<span class="blue">' + value.toString(16).prepad(2, '0') + '</span>';
};

})();