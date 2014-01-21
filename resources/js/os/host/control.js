
OS.Control = {};

OS.CPU_CLOCK_INTERVAL = null;
OS.CPU_CLOCK_SPEED = 100;

OS.IRQ = Utils.bidirectional(Utils.number([
    'keyboard',
    'processFault',
    'processTerminated',
    'contextSwitch',
    'systemCall',
    'hardDrive'
]));

OS.clock = 0;
OS.status = 'shutdown';


(function () {

OS.Control.init = function () {
    OS.Console.init();
    OS.StatusBar.init();
    OS.Log.init();

    OS.log = OS.Log.add;
    OS.trace = OS.Control.trace;
};

OS.Control.start = function () {
    OS.trace('Starting CPU clock.');
    OS.CPU_CLOCK_INTERVAL = setInterval(OS.Control.clockPulse, OS.CPU_CLOCK_SPEED);

    OS.trace('Starting console.');
    OS.Console.start();

    OS.trace('Bootstrap.');
    OS.Kernel.bootstrap();

    OS.trace('Started.');
    OS.Control.updateStatus('operating');
};

OS.Control.halt = function () {
    
};

OS.Control.restart = function () {
    
};

OS.Control.updateStatus = function (status) {
    OS.status = status;
    OS.StatusBar.update();
};

OS.Control.clockPulse = function () {
    OS.Kernel.clockPulse();

    OS.clock++;
};

OS.Control.trace = function (message) {
    OS.log(message, 'Host');
};

})();