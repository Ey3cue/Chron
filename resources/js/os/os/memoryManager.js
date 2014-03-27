/* ----------
   memoryManager.js

   Requires globals.js, memory.js, memoryBlock.js.

   Handles all communication with main memory.
   ---------- */

OS.MemoryManager = {};

(function () {

var _blockPcbs;

var _relocationReg;

OS.MemoryManager.init = function () {};

OS.MemoryManager.start = function () {
    _blockPcbs = new Array(OS.MEMORY_BLOCKS);
    _relocationReg = null;
};

OS.MemoryManager.stop = function () {};

/**
 * Sets the base and limit registers for the given process based on availability. Also sets the
 * block as allocated according to the PID. Swaps out a process if memory is full. Returns true
 * if the procces was successfully allocated.
 *
 * @param {OS.Pcb} pcb the process to allocate
 *
 * @return {Boolean} true if the process was allocated
 */
var allocate = OS.MemoryManager.allocate = function (pcb) {
    trace('Allocating memory.');

    // Find the next available block
    var blockIndex = null;

    for (var i = 0; i < OS.MEMORY_BLOCKS; i++) {
        if (!_blockPcbs[i]) {
            // Block available
            blockIndex = i;
            _blockPcbs[i] = pcb;
            break;
        }
    }

    if (blockIndex !== null) {
        pcb.base = blockIndex * OS.MEMORY_BLOCK_SIZE;
        pcb.limit = OS.MEMORY_BLOCK_SIZE;
        return true;
    } else {
        rollOut();
        return allocate(pcb);
    }
};

/**
 * Deallocates the memory block associated with the given process.
 *
 * @param {Pcb} pcb the process to deallocate
 */
var deallocate = OS.MemoryManager.deallocate = function (pcb) {
    trace('Deallocating memory.');

    var processContents = '';

    for (var i = 0; i < _blockPcbs.length && i < OS.MEMORY_BLOCKS; i++) {
        if (_blockPcbs[i] && _blockPcbs[i].pid === pcb.pid) {
            _blockPcbs[i] = null;

            // Zero-out the block. No, this is not done in reality, but it makes it more readable.
            var savedRelocationReg = _relocationReg;

            _relocationReg = pcb.base;

            for (var j = 0; j < pcb.limit; j++) {
                processContents += read(j).toHex(2);
                //write(j, 0);
            }

            pcb.base = null;
            pcb.limit = null;

            _relocationReg = savedRelocationReg;
        }
    }

    if (!processContents.length) {
        trace('Memory deallocation failed: Process not found.');
        return null;
    }

    return processContents;
};

/**
 * Loads the specified process and code into memory.
 *
 * @param {Pcb} pcb the PCB
 * @param {String} code a hex string of the code
 */
var loadProcess = OS.MemoryManager.loadProcess = function (pcb, code) {
    allocate(pcb);
    var savedRelocationReg = _relocationReg; // In case a process is currently running
    _relocationReg = pcb.base;

    trace('Loading process into memory @0x' + _relocationReg.toHex(3));

    code = code.replace(/[^A-F0-9]+/gi, '').pad(OS.MEMORY_BLOCK_SIZE * 2, '0');
    var codeLength = code.length * 0.5;

    for (var address = 0; address < codeLength && address < OS.MEMORY_BLOCK_SIZE; address++) {
        write(address, code.substr(address * 2, 2));
    }

    _relocationReg = savedRelocationReg;
};

/**
 * Rolls in the specified process from virutal memory.
 *
 * @param {Pcb} pcb the process to roll in
 */
function rollIn(pcb) {
    trace('Rolling in process (PID ' + pcb.pid + ').');

    try {
        var processContents = OS.HardDriveDriver.readFile(pcb.getSwapFilename());
        OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
            command: 'swap-delete',
            filename: pcb.getSwapFilename()
        });

        loadProcess(pcb, processContents);
    } catch (e) {
        trace('Roll in failed: ' + e);
        throw e;
        // TODO Handle
    }
}

/**
 * Rolls out the specified process to virutal memory.
 *
 * @param {Pcb} pcb the process to roll out
 */
function rollOut(pcb) {
    pcb = pcb || getMostRecentlyAccessedProcess();

    trace('Rolling out process (PID ' + pcb.pid + ').');

    var processContents = deallocate(pcb);

    if (processContents) {
        OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
            command: 'swap-write',
            filename: pcb.getSwapFilename(),
            data: processContents
        });
    } else {
        trace('Roll out failed: Process not found.');
    }
}

/**
 * This is the most efficient process to roll out in RR scheduling.
 */
function getMostRecentlyAccessedProcess() {
    var priority = -1;
    var pcb = null;

    for (var i = 0; i < _blockPcbs.length; i++) {
        if (_blockPcbs[i].lastAccessTime > priority) {
            pcb = _blockPcbs[i];
            priority = pcb.lastAccessTime;
        }
    }

    return pcb;
}

/**
 * Sets the relocation register according to the given process.
 *
 * @param {Pcb} pcb the process to set the relocation register for
 */
var setRelocationRegister = OS.MemoryManager.setRelocationRegister = function (pcb) {
    if (pcb.base === null) { // Swapped out
        rollIn(pcb);
    }

    trace('Setting relocation register to ' + pcb.base + ' (PID ' + pcb.pid + ').');
    _relocationReg = pcb.base;
};

/**
 * Reads the data located in the given logical address from memory.
 *
 * @param {Number} address the logical address to read
 */
var read = OS.MemoryManager.read = function (address) {
    // Ensure valid address.
    if (address < 0 || address >= OS.MEMORY_BLOCK_SIZE) {
        throw 'Memory access out of bounds.';
    } else if (_relocationReg !== null) { // Process has been allocated
        return OS.Memory.read(address + _relocationReg);
    }
};

/**
 * Writes the given data to memory at the specified logical address.
 *
 * @param {Number} address the logical address to write the data to
 * @param {Number} data the data to write
 */
var write = OS.MemoryManager.write = function (address, data) {
    // Convert to number
    if (typeof data === 'string') {
        data = parseInt(data, 16);
    }

    // Ensure valid address and data.
    if (address < 0 || address >= OS.MEMORY_BLOCK_SIZE) {
        if (arguments.callee.caller === OS.Kernel.loadProgram) {
            throw 'Not enough memory.';
        } else {
            throw 'Memory access out of bounds.';
        }
    } else if (data % 1 !== 0 || data < 0 || data > 0xFF) {
        throw 'Invalid memory data.';
    } else if (_relocationReg !== null) { // Process has been allocated
        OS.Memory.write(address + _relocationReg, data);
    }
};

var isBlockAvailable = OS.MemoryManager.isBlockAvailable = function (index) {
    return (_blockPcbs && !_blockPcbs[index]);
};

function trace(message) {
    OS.log(message, 'MemoryManager');
}

})();
