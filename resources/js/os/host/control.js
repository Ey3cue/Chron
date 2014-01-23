
OS.Control = {};

OS.CPU_CLOCK_SPEED = 100;

OS.TRANSITION_TIME = 1000;

OS.Irq = new Enum(
    'KEYBOARD',
    'PROCESS_FAULT',
    'PROCESS_TERMINATED',
    'CONTEXT_SWITCH',
    'SYSTEM_CALL',
    'HARD_DRIVE'
);

OS.Status = new Enum(
    'SHUTDOWN',
    'OPERATING',
    'HALTED'
);

OS.clock = 0;
OS.cpuClockInterval = null;
OS.status = OS.Status.SHUTDOWN;


(function () {

OS.Control.init = function () {
    OS.Console.init();
    OS.StatusBar.init();
    OS.Log.init();

    OS.log = OS.Log.add;
    OS.trace = OS.Control.trace;
};

OS.Control.activate = function () {
    if (OS.status === OS.Status.SHUTDOWN) {
        OS.Control.start();
    }
};
var _tei = 0;
OS.Control.toggle = function () {
    if (OS.status === OS.Status.SHUTDOWN) {
        OS.Control.start();
    } else {
        OS.Control.stop();
    }
};

OS.Control.start = function () {
    OS.Log.clear();

    OS.trace('Starting.');

    OS.trace('Starting CPU clock.');
    OS.cpuClockInterval = setInterval(OS.Control.clockPulse, OS.CPU_CLOCK_SPEED);

    OS.trace('Starting console.');
    OS.Console.start();

    OS.trace('Bootstrap.');
    OS.Kernel.start();
    
    OS.trace('Started.');
    OS.Control.updateStatus(OS.Status.OPERATING);
};

OS.Control.stop = function () {
    OS.trace('Shutting down.');

    OS.trace('Shutting down kernel.');
    OS.Kernel.stop();

    OS.trace('Shutting down console.');
    OS.Console.stop();

    OS.trace('Stopping CPU clock.');
    clearInterval(OS.cpuClockInterval);
    OS.clock = 0;

    OS.trace('Shut down.');
    OS.Control.updateStatus(OS.Status.SHUTDOWN);
};

OS.Control.halt = function () {
    throw 'Unimplemented: OS.Control.halt';
};

OS.Control.restart = function () {
    OS.Control.stop();
    setTimeout(OS.Control.start, OS.TRANSITION_TIME);
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

OS.Control.checkFunctions = function () {
    var exclusions = Utils.number([
        'StatusBar',
        'Interrupt'
    ]);

    for (var obj in OS) {
        if (/[A-Z][a-z]+/.test(obj) && OS[obj].constructor !== Enum && !(obj in exclusions)) {
            console.log(
                (obj + ':').prepad(20) +
                (' [start]').prepad(10) + ('start' in OS[obj]).toString().prepad(5) +
                (' [stop]').prepad(10) + ('stop' in OS[obj]).toString().prepad(5)
            );
        }
    }
};

})();