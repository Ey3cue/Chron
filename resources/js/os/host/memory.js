/* ----------
   memory.js

   Defines the virtual host's memory.

   Originally, this was managed with one array containing an array of MemoryWord objects, each of
   which held both a value and a status (normal, read, or written). This manaages two arrays, which
   is harder to manage (the two arrays must be kept synchronized), however will prove to be much
   faster as the arrays will be simple arrays of integers (the status array being addresses to the
   enumerated type). Performance here is necessary because the memory displays uses the data here
   to update its contents every clock pulse. If further performance is needed, the arrays can be
   converted to JavaScript unsigned integer arrays.
   ---------- */

OS.Memory = {};

(function () {

var MEMORY_SIZE = OS.MEMORY_BLOCK_SIZE * OS.MEMORY_BLOCKS;

var _memory;
var _statuses;

OS.Memory.init = function () {
    _memory = new Array(MEMORY_SIZE);
    _statuses = new Array(MEMORY_SIZE);

    OS.Memory.memory = _memory;
    OS.Memory.statuses = _statuses;

    for (var i = 0; i < MEMORY_SIZE; i++) {
        _memory[i] = 0;
        _statuses[i] = OS.MemoryStatus.NORMAL;
    }
};





})();
