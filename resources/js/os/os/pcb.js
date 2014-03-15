
(function () {

var lastPid = 0;

OS.Pcb = function (write) {
    this.pid   = lastPid++; // Process ID
    this.pc    = 0;  // Program Counter
    this.acc   = 0;
    this.xReg  = 0;
    this.yReg  = 0;
    this.zFlag = 0;

    this.priority = OS.DEFAULT_PRIORITY;
    this.arrivalTime = OS.clock;
    this.lastAccessTime = OS.clock;

    this.status = OS.ProcessStatus.NEW;

    // For memory; to be set by the memory manager
    this.base  = null;
    this.limit = null;

    // The function to write output to the console
    this.write = write || null;
};

/**
 * Sets the registers of this PCB based on the registers of the specified CPU.
 */
OS.Pcb.prototype.setRegistersWithCpu = function () {
    this.pc = OS.Cpu.pc.data;
    this.acc = OS.Cpu.acc.data;
    this.xReg = OS.Cpu.xReg.data;
    this.yReg = OS.Cpu.yReg.data;
    this.zFlag = OS.Cpu.zFlag.data;
};

/**
 * Returns the scheduling priority depending on the current scheduling mode.
 *
 * @return {Number} the scheduling priority
 */
OS.Pcb.prototype.getPriority = function () {
    return OS.Kernel.getSchedulingMode() === OS.SchedulingMode.FCFS ? this.arrivalTime : this.priority;
};

/**
 * Returns the swap file name for this PCB.
 *
 * @return {String} the swap file name.
 */
OS.Pcb.prototype.getSwapFilename = function () {
    return 'swap@pid' + this.pid + '.sys';
};

})();
