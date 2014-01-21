
OS.Log = {};

(function () {

var MAXIMUM_SIZE = 200;

var _$log;

var _lastMessage;
var _messageRepeatCount;
var _messageCount;

var _$lastEntry;

OS.Log.init = function () {
    _$log = $('#osLog');

    _lastMessage = null;
    _messageRepeatCount = 1;
    _messageCount = 0;

    _$lastEntry = null;
};

OS.Log.add = function (message, source) {
    if (_lastMessage === message) {
        $('.time', _$lastEntry).html(getCurrentDateStamp());
        $('.clock', _$lastEntry).html(parseClock());
        $('.repeats', _$lastEntry).html('[' + (++_messageRepeatCount) + '] ');
    } else {
        var $entry = $(
            '<div class="entry">' +
                '<span class="grey time">' + getCurrentDateStamp() + '</span> ' +
                '<span class="clock">' + parseClock() + '</span> ' +
                (source ? '<span class="blue">' + source + '</span> ' : '') +
                '<span class="grey repeats"></span>' +
                parseMessage(message) +
            '</div>'
        );

        _$log.prepend($entry);
        _$lastEntry = $entry;

        _messageRepeatCount = 1;
        _lastMessage = message;
        _messageCount++;
    }

    if (_messageCount > MAXIMUM_SIZE) {
        $('div:last-child', _$log).remove();
        _messageCount--;
    }
};

function getCurrentDateStamp()
{
    var now = new Date();

    return now.getHours().toString().prepad(2, '0') + ':' +
           now.getMinutes().toString().prepad(2, '0') + ':' +
           now.getSeconds().toString().prepad(2, '0') + '.' +
           now.getMilliseconds().toString().prepad(3, '0');
}

function parseMessage(message) {
    if (message.search(/idle/i) !== -1) {
        return message;
    } else if (message.search(/(emergency|halt|error)/i) !== -1) {
        return '<span class="red">' + message + '</span>';
    } else if (message.search(/(shutdown|failed|fault|abort|terminate|kill|warn)/i) !== -1) {
        return '<span class="orange">' + message + '</span>';
    } else if (message.search(/(file|swap|roll)/i) !== -1) {
        return '<span class="purple">' + message + '</span>';
    } else if (message.search(/(interrupt)/i) !== -1) {
        return '<span class="yellow">' + message + '</span>';
    } else {
        return '<span class="green">' + message + '</span>';
    }
}

function parseClock() {
    return OS.clock.toString().prepad(5).replace(/ /g, '&nbsp;');
}

})();