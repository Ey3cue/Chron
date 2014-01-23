
OS.StatusBar = {};

(function () {

var _$osTime;
var _$osStatus;

var _buttons;
var _$buttons;

var _disabled;

OS.StatusBar.init = function () {
    _$osTime = $('#osTime');
    _$osStatus = $('#osStatus');

    _buttons = {
        power: $('#osButtonPower'),
        halt: $('#osButtonHalt'),
        restart: $('#osButtonRestart')
    };

    _$buttons = $();
    for (var key in _buttons) {
        // Might be a better way to do this...
        _$buttons = _$buttons.add(_buttons[key]);
    }

    // Update the clock every second. Not a magic number; there's 1000 ms in 1 s
    setInterval(updateTime, 1000);

    disableAll();
    OS.StatusBar.update();
};

OS.StatusBar.update = function (status) {
    status = status || OS.status;

    // Prevents two click listeners being registered to the same button
    disableAll();

    _$osStatus.removeAttr('class');
    _$osStatus.addClass(status.toString().toLowerCase());

    switch (status) {
    case OS.Status.OPERATING:
        //enableAll();
        enable(_buttons.power);
        enable(_buttons.restart);
        _$osTime.css('opacity', 1);
        break;
    case OS.Status.SHUTDOWN:
        enable(_buttons.power);
        _$osTime.css('opacity', 0);
        break;
    }

    _disabled = false;
};

function pressed(event) {
    if (_disabled) {
        return;
    }

    // Wait for an update before trying to trigger another event
    _disabled = true;
    disableAll();

    if (_buttons.power.is(event.target)) {
        OS.Control.toggle();
    } else if (_buttons.halt.is(event.target)) {
        OS.Control.halt();
    } else if (_buttons.restart.is(event.target)) {
        OS.Control.restart();
    }
}

function disable($button) {
    $button.addClass('disabled')
           .off('click');
}

function disableAll() {
    _$buttons.addClass('disabled')
             .off('click');
}

function enable($button, time) {
    time = time || OS.TRANSITION_TIME;
    setTimeout(function() {
        $button.removeClass('disabled')
               .on('click', pressed);
    }, time);
}

function enableAll(time) {
    time = time || OS.TRANSITION_TIME;
    setTimeout(function() {
        _$buttons.removeClass('disabled')
                 .on('click', pressed);
    }, time);
}


function updateTime() {
    var now = new Date();
    var hours = now.getHours();

    _$osTime.html(
        now.toDateString() + '&nbsp;&nbsp;' +
        (hours > 12 ? hours - 12 : hours) + ':' +
        now.getMinutes().toString().prepad(2, '0') + ':' +
        now.getSeconds().toString().prepad(2, '0') + ' ' +
        (hours < 12 ? 'AM' : 'PM')
    );
}

})();