
OS.Kernel = {};

(function () {

var _interruptQueue = null;


OS.Kernel.bootstrap = function () {
    _interruptQueue = [];

    trace('Loading device drivers.');
    OS.KeyboardDriver.load();
};

OS.Kernel.clockPulse = function () {
    if (_interruptQueue.length > 0) {
        handleInterrupt(_interruptQueue.dequeue());
    } else if (false /* _CPU.isExecuting || Kernel.readyQueue.size() > 0 */) {

    } else {
        trace('Idle');
    }
};

OS.Kernel.interrupt = function (irq, params) {
    _interruptQueue.enqueue(new OS.Interrupt(irq, params));
};

function handleInterrupt(interrupt) {
    trace('Interrupt: ' + interrupt.name);

    switch (interrupt.irq) {
    case OS.IRQ.keyboard:
        OS.KeyboardDriver.isr(interrupt.params);
        break;
    default:
        trace('Error: Unknown interrupt request.');
    }
}

OS.Kernel.trapError = function (message) {
    trace('Trap Error: ' + message);

    OS.Console.bsod();
    OS.Control.halt();
};

function trace(message) {
    // Don't log every idle clock pulse.
    if (message === 'Idle') {
        if (OS.clock % 10 === 0) {
            OS.log(message, 'OS.Kernel');
        }
    } else {
        OS.log(message, 'OS.Kernel');
    }
}

})();