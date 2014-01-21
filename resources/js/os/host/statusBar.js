
OS.StatusBar = {};

(function () {

var _$osTime;
var _$osStatus;

var _$powerButton;
var _$haltButton;
var _$restartButton;

var _$buttons;

var _disabled;

OS.StatusBar.init = function () {
    _$osTime = $('#osTime');
    _$osStatus = $('#osStatus');

    _$powerButton = $('#osButtonPower');
    _$haltButton = $('#osButtonHalt');
    _$restartButton = $('#osButtonRestart');

    _$buttons = $('#osButtonPower, #osButtonHalt, #osButtonRestart');

    setInterval(updateTime, 1000);

    disableAll();
    OS.StatusBar.update();
};

OS.StatusBar.update = function (status) {
    status = status || OS.status;

    _$osStatus.removeAttr('class');
    _$osStatus.addClass(status);

    switch (status) {
    case 'operating':
        enable(_$haltButton);
        enable(_$restartButton);
        _$osTime.css('opacity', 1);
        break;
    case 'shutdown':
        enable(_$powerButton);
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

    if (_$powerButton.is(event.target)) {
        OS.Control.start();
    } else if (_$haltButton.is(event.target)) {
        
    } else if (_$restartButton.is(event.target)) {

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

function enable($button) {
    $button.removeClass('disabled')
           .on('click', pressed);
}

function enableAll() {
    _$buttons.removeClass('disabled')
             .on('click', pressed);
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