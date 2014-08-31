
OS.Control = {};

// Display properties...
OS.TRANSITION_TIME = 1000; // In milliseconds
OS.MAXIMUM_LOG_SIZE = 50; // In number of messages
OS.MEMORY_DISPLAY_ADDRESSES_PER_LINE = 8;

// OS properties...
OS.CPU_CLOCK_SPEED = 100; // In milliseconds

OS.MEMORY_BLOCK_SIZE = 256; // In bytes
OS.MEMORY_BLOCKS = 3;

OS.DEFAULT_PRIORITY = Number.MAX_VALUE;
OS.DEFAULT_SCHEDULING_QUATUM = 6;

OS.Status = new Enum(
    'SHUTDOWN',
    'OPERATING',
    'HALTED'
);

OS.Irq = new Enum(
    'KEYBOARD',
    'PROCESS_FAULT',
    'PROCESS_TERMINATED',
    'CONTEXT_SWITCH',
    'SYSTEM_CALL',
    'HARD_DRIVE'
);

OS.SchedulingMode = new Enum(
    'ROUND_ROBIN',
    'FCFS',
    'PRIORITY'
);

OS.ProcessStatus = new Enum(
    'NEW',
    'RESIDENT',
    'READY',
    'RUNNING',
    'TERMINATED',
    'ABORTED'
);

OS.MemoryStatus =
OS.RegisterStatus = new Enum(
    'NORMAL',
    'READ',
    'WRITTEN'
);

OS.FileStatus = new Enum(0,
    'AVAILABLE',
    'OCCUPIED_TEXT', // User data
    'OCCUPIED_BIN'   // Swap data
);

// OS variables...
OS.clock = 0;
OS.cpuClockInterval = null;
OS.singleStep = false;
OS.halted = false;

OS.hardDrive = null;
OS.mbr = null;

OS.status = OS.Status.SHUTDOWN;
OS.info = 'ChronOS version 2.0 by Christopher Cordisco';


(function () {

OS.Control.init = function () {
    OS.Memory.init();

    OS.hardDrive = new OS.HardDrive();
    OS.mbr = new OS.File('MBR');

    OS.StatusBar.init();
    OS.Log.init();
    OS.CpuDisplay.init();
    OS.MemoryDisplay.init();
    OS.HardDriveDisplay.init();
    OS.ProcessesDisplay.init();
    OS.ProgramInput.init();

    OS.Console.init();

    OS.Cpu.init();
    OS.MemoryManager.init();
    OS.Shell.init();

    OS.log = OS.Log.add;
    OS.trace = OS.Control.trace;
};

OS.Control.activate = function () {
    if (OS.status === OS.Status.SHUTDOWN) {
        OS.Control.start();
    }
};

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
    OS.halted =

    OS.trace('Starting CPU clock.');
    OS.cpuClockInterval = setInterval(OS.Control.clockPulse, OS.CPU_CLOCK_SPEED);

    OS.trace('Starting CPU display.');
    OS.CpuDisplay.start();

    OS.trace('Starting memory display.');
    OS.MemoryDisplay.start();

    OS.trace('Starting hard drive display.');
    OS.HardDriveDisplay.start();

    OS.trace('Starting processes display.');
    OS.ProcessesDisplay.start();

    OS.trace('Starting program input.');
    OS.ProgramInput.start();

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

    OS.trace('Shutting down the program input.');
    OS.ProgramInput.stop();

    OS.trace('Shutting down the processes display.');
    OS.ProcessesDisplay.stop();

    OS.trace('Shutting down hard drive display.');
    OS.HardDriveDisplay.stop();

    OS.trace('Shutting down memory display.');
    OS.MemoryDisplay.stop();

    OS.trace('Shutting down CPU display.');
    OS.CpuDisplay.stop();

    OS.trace('Stopping CPU clock.');
    clearInterval(OS.cpuClockInterval);
    OS.clock = 0;

    OS.trace('Shut down.');
    OS.Control.updateStatus(OS.Status.SHUTDOWN);
};

OS.Control.halt = function () {
    OS.Control.trace('Emergency halt.');
    OS.halted = true;
};

OS.Control.restart = function () {
    OS.Control.stop();
    setTimeout(OS.Control.start, OS.TRANSITION_TIME);
};

OS.Control.updateStatus = function (status) {
    OS.status = status;
    OS.StatusBar.update();
};

OS.Control.clockPulse = function (step) {
    // Do not pulse if halted or on the compiler
    if (OS.halted || MainTabs.activeId === 'compiler') {
        return;
    }

    // Pass in whether to execute a pulse to the CPU to initiate a single step. If single step is
    //   off, do this regardless. If it's on, only pulse if the step argument is also true (the
    //   step button was pressed then)
    step = !OS.singleStep || step;
    OS.Kernel.clockPulse(step);

    if (step) {
        OS.clock++;

        OS.CpuDisplay.update();
        OS.MemoryDisplay.update();
        OS.ProcessesDisplay.update();
    }
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
