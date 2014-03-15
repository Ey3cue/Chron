
OS.Cpu = {};

(function () {

var _pc;   // Program Couter

var _ir;   // Instruction Register
var _op;   // The decoded instruction

var _acc;
var _xReg;
var _yReg;
var _zFlag;

OS.Cpu.init = function () {
    _pc = OS.Cpu.pc = new Register();  // Program Couter

    _ir = 0;                           // Instruction Register
    _op = null;                        // The decoded instruction

    _acc = OS.Cpu.acc = new Register();
    _xReg = OS.Cpu.xReg = new Register();
    _yReg = OS.Cpu.yReg = new Register();
    _zFlag = OS.Cpu.zFlag = new Register();
};

/**
 * Sets the registers of this CPU based on the contents of the specified PCB.
 *
 * @param {OS.Pcb} pcb the PCB
 */
OS.Cpu.setRegisters = function (pcb) {
    _pc.write(pcb.pc);
    _acc.write(pcb.acc);
    _xReg.write(pcb.xReg);
    _yReg.write(pcb.yReg);
    _zFlag.write(pcb.zFlag);
};

/**
 * Sets the registers of this CPU to 0.
 */
OS.Cpu.clearRegisters = function () {
    _pc.write(0);
    _acc.write(0);
    _xReg.write(0);
    _yReg.write(0);
    _zFlag.write(0);
};

OS.Cpu.getRegisters = function () {
    return {
        pc: _pc,
        acc: _acc,
        x: _xReg,
        y: _yReg,
        z: _zFlag
    };
};

/**
 * The main CPU cycle to be executed every clock pulse.
 */
OS.Cpu.cycle = function () {
    trace('Cycle.');

    fetch();
    decode();
    execute();
};

function fetch() {
    try {
        _ir = OS.MemoryManager.read(_pc.data);
        _pc.increment();
    } catch(error) { // Memory access out of bounds error.
        fault(error);
    }
}

function decode() {
    _op = _opCodes[_ir];
}

function execute() {
    if (!_op) {
        fault("Invalid operation.");
    } else {
        try {
            _op();
        } catch (e) {
            fault(e);
            throw e;
        }
    }
}

// ---------- Interrupt ----------

/**
 * Equeues a new interrupt in the case of the CPU fault.
 *
 * @param {String} message a description of why the fault occurred
 */
function fault(message) {
    OS.Kernel.interrupt(OS.Irq.PROCESS_FAULT, message);
}

// ---------- Operations ----------

function loadAccWithConstant() { // A9
    _acc.write(readFromMemory(1));
}

function loadAccFromMemory() { // AD
    _acc.write(OS.MemoryManager.read(readFromMemory(2)));
}

function storeAccInMemory() { // 8D
    OS.MemoryManager.write(readFromMemory(2), _acc.read());
}

function addWithCarry() { // 6D
    _acc.increment(OS.MemoryManager.read(readFromMemory(2)));
}

function loadXRegWithConstant() { // A2
    _xReg.write(readFromMemory(1));
}

function loadXRegFromMemory() { // AE
    _xReg.write(OS.MemoryManager.read(readFromMemory(2)));
}

function loadYRegWithConstant() { // A0
    _yReg.write(readFromMemory(1));
}

function loadYRegFromMemory() { // AC
    _yReg.write(OS.MemoryManager.read(readFromMemory(2)));
}

function noOperation() { // EA
    // Do nothing - this function must still exist however, otherwise the CPU will see the
    //   opcode "EA" as an invalid instruction and cause a fault.
}

function breakOp() { // 00
    OS.Kernel.interrupt(OS.Irq.PROCESS_TERMINATED);
}

function compareXReg() { // EC
    if (_xReg.read() === OS.MemoryManager.read(readFromMemory(2))) {
        _zFlag.write(1);
    } else {
        _zFlag.write(0);
    }
}

function branchIfZero() { // D0
    if (_zFlag.read() === 0) {
        // Subtract memory block size if branch causes PC >= memory block size
        _pc.increment(readFromMemory(1));

        if (_pc.data >= OS.MEMORY_BLOCK_SIZE) {
            _pc.increment(-OS.MEMORY_BLOCK_SIZE);
        }
    } else {
        _pc.increment();
    }
}

function incrementByte() { // EE
    var address = readFromMemory(2);
    var value = OS.MemoryManager.read(address);
    OS.MemoryManager.write(address, (value + 1));
}

function systemCall() { // FF
    if (_xReg.read() === 1) {
        OS.Kernel.interrupt(OS.Irq.SYSTEM_CALL, 1);
    } else if (_xReg.read() === 2) {
        OS.Kernel.interrupt(OS.Irq.SYSTEM_CALL, 2);
    }
}

/**
 * The CPU's opcodes. Opcodes located in this map and having a valid associating function will be
 * seen as valid. Note this map must be placed after the operation functions.
 */
var _opCodes = {
    0xA9 : loadAccWithConstant,
    0xAD : loadAccFromMemory,
    0x8D : storeAccInMemory,
    0x6D : addWithCarry,
    0xA2 : loadXRegWithConstant,
    0xAE : loadXRegFromMemory,
    0xA0 : loadYRegWithConstant,
    0xAC : loadYRegFromMemory,
    0xEA : noOperation,
    0x00 : breakOp,
    0xEC : compareXReg,
    0xD0 : branchIfZero,
    0xEE : incrementByte,
    0xFF : systemCall
};

// ---------- Helper functions ----------

/**
 * Returns the next specified number of values in memory according to the PC as a number.
 * For 2 argument operations, this will convert the 2 arguments to one number.
 *
 * E.g. If 03 00 are the next 2 values after a load from memory for example, this will
 *   return 0x0003 or 3 as an integer.
 *
 * @param {Number} numValues the number of values to read (1 or 2)
 */
function readFromMemory (numValues) {
    if (numValues === 1) {
        var arg = OS.MemoryManager.read(_pc.read());
        _pc.increment();
        return arg;
    } else if (numValues === 2) {
        var arg1 = OS.MemoryManager.read(_pc.read()).toString(16);
        _pc.increment();
        var arg2 = OS.MemoryManager.read(_pc.read()).toString(16);
        _pc.increment();

        // Prepend 0 to arg1 if it's only a single digit.
        arg1 = arg1.length < 2 ? '0' + arg1 : arg1;

        return parseInt((arg2 + arg1), 16);
    }
}

function trace(message) {
    OS.log(message, 'CPU');
}

/**
 * Defines a register which holds the register's current value and status.
 */
var Register = OS.Register = function () {
    // The current value
    this.data = 0;
    // The status of the register (for display purposes).
    this.status = OS.RegisterStatus.NORMAL;
};

/**
 * Returns the register's current value.
 *
 * @return {Number} the register's current value
 */
Register.prototype.read = function () {
    this.status = OS.RegisterStatus.READ;
    return this.data;
};

/**
 * Writes the specified data to the register.
 *
 * @param {Number} data the data to write
 */
Register.prototype.write = function (data) {
    this.status = OS.RegisterStatus.WRITTEN;
    this.data = data;
};

/**
 * Increments the value held by the register by the specified amount.
 *
 * @param {Number} amount the amount to increment
 */
Register.prototype.increment = function (amount) {
    this.status = OS.RegisterStatus.WRITTEN;
    this.data = this.data.addTwosComplement(amount === undefined ? 1 : amount);
};

/**
 * Resets the status of this register to normal.
 */
Register.prototype.resetStatus = function () {
    this.status = OS.RegisterStatus.NORMAL;
};

})();
