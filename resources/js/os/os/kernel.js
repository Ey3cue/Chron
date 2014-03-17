/* ----------
   kernel.js

   The OS kernel which brings the majority of the OS components together.
   ---------- */

OS.Kernel = {};

(function () {

var IDLE_LOG_FACTOR = 1000 / OS.CPU_CLOCK_SPEED;

var _interruptQueue;

var _residentList;
var _readyQueue;
var _runningProcess;

var _schedulingMode;

var _schedulingQuantum;
var _previousQuantum;

var _processCycles; // Number of cycles a particular process has been executing

var _isCpuExecuting;

// ---------- General ----------

OS.Kernel.init = function () {};

OS.Kernel.start =
OS.Kernel.bootstrap = function () {
    _interruptQueue = [];

    _residentList = {};
    _readyQueue = [];
    _runningProcess = null;

    _schedulingMode = OS.SchedulingMode.ROUND_ROBIN;

    _schedulingQuantum = OS.DEFAULT_SCHEDULING_QUATUM;
    _previousQuantum = OS.DEFAULT_SCHEDULING_QUATUM;

    _processCycles = 0;

    _isCpuExecuting = false;

    trace('Starting memory manager.');
    OS.MemoryManager.start();

    trace('Loading device drivers.');
    OS.KeyboardDriver.start();
    OS.HardDriveDriver.start();

    trace('Starting the shell.');
    OS.Shell.start();
};

OS.Kernel.stop = function () {
    trace('Stopping the shell.');
    OS.Shell.stop();

    trace('Unloading device drivers.');
    OS.HardDriveDriver.stop();
    OS.KeyboardDriver.stop();

    trace('Stopping memory manager.');
    OS.MemoryManager.stop();
};

OS.Kernel.clockPulse = function (step) {
    if (_interruptQueue.length > 0) {
        handleInterrupt(_interruptQueue.dequeue());
    } else if (step && (_isCpuExecuting || _readyQueue.length)) {
        scheduleCycle();
    } else {
        trace('Idle');
    }
};

OS.Kernel.isExecuting = function () {
    return _isCpuExecuting;
};

// ---------- Interrupt Handling ----------

var interrupt = OS.Kernel.interrupt = function (irq, params) {
    _interruptQueue.enqueue(new OS.Interrupt(irq, params));
};

function handleInterrupt(interrupt) {
    trace('Interrupt: ' + interrupt.irq);

    switch (interrupt.irq) {
    case OS.Irq.KEYBOARD:           OS.KeyboardDriver.isr(interrupt.params);          break;
    case OS.Irq.PROCESS_FAULT:      processFault(interrupt.params);                                   break;
    case OS.Irq.PROCESS_TERMINATED: processTerminated(interrupt.params);                              break;
    case OS.Irq.CONTEXT_SWITCH:     contextSwitch();                                  break;
    case OS.Irq.SYSTEM_CALL:        systemCallIsr(interrupt.params);                                  break;
    case OS.Irq.HARD_DRIVE:         OS.HardDriveDriver.isr(interrupt.params);         break;
    default:                        trace('Error: Unknown interrupt request.');
    }
}

function systemCallIsr(code) {
    if (code === 1) {
        _runningProcess.write(OS.Cpu.yReg.data);
    } else if (code === 2) {
        var address = OS.Cpu.yReg.read();
        var data = null;

        while (data !== 0) {
            data = OS.MemoryManager.read(address++);
            // TODO make this something more reliable than String.fromCharCode()
            //   (which uses its special codes)
            _runningProcess.write(String.fromCharCode(data));
        }
    }
}

// ---------- Process Handling/Scheduling ----------

/**
 * Loads the specified code into memory.
 *
 * @param {String} code the code to load
 * @param {Number} priority (optional) the priority
 * @param {Function} write the function to write output to the console
 */
var loadProgram = OS.Kernel.loadProgram = function (code, priority, write) {
    write = write || OS.Console.getWriteFunction();
    trace('Loading program.');

    // Create new PCB for the program.
    var pcb = new OS.Pcb(write);

    if (priority) {
        pcb.priority = priority;
    }

    try {
        OS.MemoryManager.loadProcess(pcb, code);

        // Send the PID to the console.
        write('PID: ' + pcb.pid, 'blue');

        // Place on resident list
        _residentList[pcb.pid] = pcb;
        pcb.status = OS.ProcessStatus.RESIDENT;
    } catch (e) {
        trace('Load failed: ' + e);
        write('Load failed: ' + e);
    }
};

/**
 * Runs the specified process.
 *
 * @param {Number} pid the process ID
 * @param {Function} write the function to write output to the console
 */
var runProcess = OS.Kernel.runProcess = function (pid, write) {
    var process = _residentList[pid];

    // Check if the PCB defines a valid process
    if (process) {
        trace('Running process: PID ' + pid);
        // Place on the ready queue
        _readyQueue.enqueue(process);
        process.status = OS.ProcessStatus.READY;
        write('PID ' + pid + ': ', 'blue');
        process.write = write;
        // Remove from resident list
        delete _residentList[pid];
    } else { // Process does not exist
        write('There is no process with that ID.');
    }
};

/**
 * Runs all loaded processes.
 */
var runAllProcesses = OS.Kernel.runAllProcesses = function (write) {
    write = write || OS.Console.getWriteFunction();

    for (var pid in _residentList) {
        var process = _residentList[pid];

        trace('Running process: PID ' + pid);
        // Place on the ready queue
        _readyQueue.enqueue(process);
        process.status = OS.ProcessStatus.READY;
        write('PID ' + pid + ': ', 'blue');
        process.write = write;
        write = OS.Console.getWriteFunction();
        // Remove from resident list
        delete _residentList[pid];
    }
};

/**
 * Terminates the process with the specified ID.
 *
 * @param {Number} pid the process ID
 * @param {Function} write the function to write output to the console
 */
var killProcess = OS.Kernel.killProcess = function (pid, write) {
    write = write || OS.Console.getWriteFunction();
    var process;
    var found = false;

    if (_runningProcess.pid === pid) {
        trace('Terminating process: ' + pid);
        interrupt(OS.Irq.PROCESS_TERMINATED, 'User terminated.');
        found = true;
    } else {
        for (var i = _readyQueue.length - 1; i >= 0; i--) {
            process = _readyQueue[i];

            if (process.pid === pid) {
                trace('Terminating process: ' + pid);
                process.write(' User terminated.', 'yellow');
                process.status = OS.ProcessStatus.TERMINATED;
                _readyQueue.remove(i);
                found = true;
                break;
            }
        }
    }

    if (!found) {
        write('Process not found.', 'yellow');
    }
};

/**
 * Performs appropriate operations to execute ready and running processes simultaneously on the CPU.
 */
function scheduleCycle() {
    if (_isCpuExecuting) {
        OS.Cpu.cycle();
        _processCycles++;

        if ((_processCycles >= _schedulingQuantum) && _readyQueue.length) {
            interrupt(OS.Irq.CONTEXT_SWITCH);
        }
    } else if (_readyQueue.length) {
        dispatchNextProcess();
    }
}

/**
 * Dispatches the next process to the CPU to be executed.
 */
function dispatchNextProcess() {
    _runningProcess = getNextProcess();

    _runningProcess.status = OS.ProcessStatus.RUNNING;

    OS.MemoryManager.setRelocationRegister(_runningProcess);
    OS.Cpu.setRegisters(_runningProcess);
    _isCpuExecuting = true;
}

function contextSwitch() {
    if (!_runningProcess) {
        trace('Context switch aborted; process already terminated.');
        return;
    }

    var nextProcess = getNextProcess();
    trace('Context switch: Process ' + _runningProcess.pid + ' -> ' + nextProcess.pid);

    // Move running process to ready queue
    _runningProcess.status = OS.ProcessStatus.READY;
    _runningProcess.lastAccessTime = OS.clock;
    _runningProcess.setRegistersWithCpu();
    _readyQueue.enqueue(_runningProcess);

    // Dequeue next process and start execution
    _runningProcess = nextProcess;
    _runningProcess.status = OS.ProcessStatus.RUNNING;

    OS.MemoryManager.setRelocationRegister(_runningProcess);
    OS.Cpu.setRegisters(_runningProcess);

    // Reset number of process cycles
    _processCycles = 0;
}

function processFault(message) {
    var fullMessage = 'Process aborted (PID ' + _runningProcess.pid + ')' +
                      (message ? ': ' + message : '');
    trace(fullMessage);
    _runningProcess.write(' Aborted' + (message ? ': ' + message : ''), 'orange');

    // Stop CPU execution
    _isCpuExecuting = false;
    OS.Cpu.clearRegisters();

    // Remove process
    OS.MemoryManager.deallocate(_runningProcess);
    _runningProcess.status = OS.ProcessStatus.ABORTED;
    _runningProcess = null;
}

function processTerminated(message) {
    trace('Process completed (PID ' + _runningProcess.pid + ').');

    // Stop CPU execution
    _isCpuExecuting = false;
    OS.Cpu.clearRegisters();

    // Remove process
    OS.MemoryManager.deallocate(_runningProcess);
    _runningProcess.write(' ' + (message || 'Done.'), (message ? 'yellow' : 'green'));
    _runningProcess.status = OS.ProcessStatus.TERMINATED;
    _runningProcess = null;
}

function getNextProcess() {
    // If the scheduling mode is RR, dequeue the first process
    var nextProcessIndex = 0;

    // If the scheduling mode is not RR, we need to get the next process with the highest priority
    if (_schedulingMode !== OS.SchedulingMode.ROUND_ROBIN) {
        nextProcessIndex = 0;
        for (var i = 1; i < _readyQueue.length; i++) {
            if (_readyQueue[i].getPriority() < _readyQueue[nextProcessIndex].getPriority()) {
                nextProcessIndex = i;
            }
        }
    }

    return _readyQueue.remove(nextProcessIndex);
}

var setSchedulingMode = OS.Kernel.setSchedulingMode = function (mode, write) {
    write = write || OS.Console.getWriteFunction();

    if (_runningProcess || _readyQueue.length) {
        write('Cannot alter scheduling mode while processes are active.');
    } else {
        if (mode === OS.SchedulingMode.FCFS || mode === OS.SchedulingMode.PRIORITY) {
            _previousQuantum = _schedulingQuantum;
            _schedulingQuantum = Number.MAX_VALUE;
        } else if (mode === OS.SchedulingMode.ROUND_ROBIN) {
            _schedulingQuantum = _previousQuantum;
        }

        _schedulingMode = mode;
    }
};

var setRoundRobinQuantum = OS.Kernel.setRoundRobinQuantum = function (quantum) {
    _schedulingQuantum = quantum;
};

var getSchedulingMode = OS.Kernel.getSchedulingMode = function () {
    return _schedulingMode;
};

var getActiveProcesses = OS.Kernel.getActiveProcesses = function () {
    var processes = (_runningProcess ? [_runningProcess] : []).concat(_readyQueue);

    for (var i in _residentList) {
        processes.push(_residentList[i]);
    }

    return processes;
};

// ---------- Utilities ----------

var trapError = OS.Kernel.trapError = function (message) {
    trace('Trap Error: ' + message);

    OS.Console.bsod();
    OS.Control.halt();
};

function trace(message) {
    // Don't log every idle clock pulse.
    if (message === 'Idle') {
        if (OS.clock % IDLE_LOG_FACTOR === 0 && !OS.singleStep) {
            OS.log(message, 'Kernel');
        }
    } else {
        OS.log(message, 'Kernel');
    }
}

})();
