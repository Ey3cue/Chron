
OS.MemoryDisplay = {};

(function () {

var _fontHeight;

var _$displayContainer;
var _$display;
var _$separators;

var _autoscroll;

var isBlockAvailable;

OS.MemoryDisplay.init = function () {
    _$displayContainer = $('#osMemoryDisplayContainer');
    _$display = $('#osMemoryDisplay');

    _fontHeight = Utils.pixelToLineHeight[parseInt(_$display.css('font-size'), 10)];

    _autoscroll = true;

    isBlockAvailable = OS.MemoryManager.isBlockAvailable;

    OS.MemoryDisplay.update();

    _$separators = $('.osMemoryDisplaySeparator', _$display);
    _$separators.css('margin', (_fontHeight * 0.5) + 'px 0');
};

OS.MemoryDisplay.start = function () {
    _$display.css('opacity', 1);
};

OS.MemoryDisplay.stop = function () {
    _$display.css('opacity', 0);
};

OS.MemoryDisplay.setAutoscroll = function (autoscroll) {
    _autoscroll = autoscroll;
};

OS.MemoryDisplay.update = function () {
    var memory = OS.Memory.memory;
    var statuses = OS.Memory.statuses;

    var html = '';
    var isNewBlockBeginning = false;
    var isCurrentBlockAvailable = isBlockAvailable(0);

    // Start with the largest address + 1
    var earliestChangedAddress = memory.length;

    // Grey out unallocated block
    if (isCurrentBlockAvailable) {
        html += '<span class="grey">';
    }

    for (var i = 0; i < memory.length; i++) {
        // If a new block is beginning and it's not the first (i !== 0)
        isNewBlockBeginning = i && i % OS.MEMORY_BLOCK_SIZE === 0;

        if (isNewBlockBeginning) {
            // End grey out
            if (isCurrentBlockAvailable) {
                html += '</span>';
            }

            // Grey out unallocated block
            isCurrentBlockAvailable = isBlockAvailable(Math.floor(i / OS.MEMORY_BLOCK_SIZE));
            if (isCurrentBlockAvailable) {
                html += '<span class="grey">';
            }

            // Add a separator
            html += '<div class="osMemoryDisplaySeparator"></div>';
        }

        // Check if adding new line
        if (i % OS.MEMORY_DISPLAY_ADDRESSES_PER_LINE === 0) {
            // Add new line if i is not 0 and it's not the beginning of a new block
            html += '<span class="grey">' +
                        (i && !isNewBlockBeginning ? '\n' : '') +
                        '0x' + i.toHex(3) + // Current address
                    '</span>';
        }

        // statuses holds the proper enum type; call the formatWord function defined below to format
        //   the word depending on its status
        html += ' ' + statuses[i].MemoryDisplay_formatWord(memory[i]);

        // If a changed address has not be found and the current address is changed
        if (i < earliestChangedAddress && statuses[i] !== OS.MemoryStatus.NORMAL) {
            earliestChangedAddress = i;
        }
    }

    _$display.html(html);
    _$displayContainer.perfectScrollbar('update');

    // If autoscroll is enabled and there is a changed address...
    if (_autoscroll && earliestChangedAddress !== memory.length) {
        _$displayContainer.scrollTop(
            // Number of lines multiplied by the line height
            Math.floor(earliestChangedAddress / OS.MEMORY_DISPLAY_ADDRESSES_PER_LINE) * _fontHeight +
            // Add number of separators that come before it (number of blocks - 1 multiplied by line height)
            Math.floor(earliestChangedAddress / OS.MEMORY_BLOCK_SIZE) * _fontHeight
        );
        _$displayContainer.perfectScrollbar('update');
    }

    OS.Memory.resetStatuses();
};

/*
 * These functions are added directly to the enum types of the MemoryStatus enum. This is a faster
 * way of writing a switch or if...else to format each word depending on its status.
 */

OS.MemoryStatus.NORMAL.MemoryDisplay_formatWord = function (value) {
    return value.toHex(2);
};

OS.MemoryStatus.READ.MemoryDisplay_formatWord = function (value) {
    return '<span class="green">' + value.toHex(2) + '</span>';
};

OS.MemoryStatus.WRITTEN.MemoryDisplay_formatWord = function (value) {
    return '<span class="blue">' + value.toHex(2) + '</span>';
};

})();
