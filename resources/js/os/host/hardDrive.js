
(function () {

// Number of tracks
var DEFAULT_TRACKS = 4;
// Number of sectors
var DEFAULT_SECTORS = 8;
// Number of blocks per track and sector
var DEFAULT_BLOCKS_PER = 8;
// Block size in bytes
var DEFAULT_BLOCK_SIZE = 64;

var LOG_2 = Math.log(2);

// The disk index which refers to the section of local storage this disk will refer to. That is,
//   if two hard drives are created with index 0, they will refer to the same section of storage,
//   which should not happen.
var _diskIndex = 0;

/**
 * Creates a new hard drive.
 *
 * @param {Number} tracks the number of tracks
 * @param {Number} sectors the number of sectors
 * @param {Number} blocksPer the number of blocks per track and sector
 * @param {Number} blockSize the block size in bytes
 */
OS.HardDrive = function (tracks, sectors, blocksPer, blockSize) {
    if (!Utils.html5StorageSupported()) {
        throw 'Cannot create hard drive; local storage is not supported.';
    }

    this.tracks = tracks || DEFAULT_TRACKS;
    this.sectors = sectors || DEFAULT_SECTORS;
    this.blocksPer = blocksPer || DEFAULT_BLOCKS_PER;
    this.blockSize = blockSize || DEFAULT_BLOCK_SIZE;

    // Size in blocks
    this.size = this.tracks * this.sectors * this.blocksPer;
    this.indexOffset = _diskIndex++ * this.size;

    // Number of bits to shift the track index and sector index to convert each TSB to a single index,
    //   representing the key to store the object under in local storage.
    var blocksLog = Math.log(this.blocksPer);
    this.trackShift = Math.ceil(Math.log(this.sectors) / LOG_2) + // Bits to represent the sector
                      Math.ceil(blocksLog / LOG_2);     // Bits to represent the block
    this.sectorShift = Math.ceil(blocksLog / LOG_2);    // Bits to represent the block
};

/**
 * Returns the data at the specified TSB.
 *
 * @param {Number} track the track
 * @param {Number} sector the sector
 * @param {Number} block the block
 *
 * @return {String} the data
 */
OS.HardDrive.prototype.read = function (track, sector, block) {
    return localStorage.getItem(this.toIndex(track, sector, block));
};

/**
 * Writes the data at the specified TSB.
 *
 * @param {Number} track the track
 * @param {Number} sector the sector
 * @param {Number} block the block
 * @param {Object} data the data to write
 */
OS.HardDrive.prototype.write = function (track, sector, block, data) {
    // Ensure data doesn't exceed block size. Data is in hex, each character is then 4 bits, so the
    //   block size * 16 will yield the maximum length of the data string.
    if (data.length > this.blockSize * 16)
        throw 'Data exceeds block size.';

    localStorage.setItem(this.toIndex(track, sector, block), data);
};

/**
 * Converts the specified TSB to an index representing the key in local storage.
 *
 * @param {Number} track the track
 * @param {Number} sector the sector
 * @param {Number} block the block
 *
 * @return {Number} the index/key
 */
OS.HardDrive.prototype.toIndex = function (track, sector, block) {
    // This check is lengthy operation-wise, but necessary to avoid possible very bad logical
    //   errors. It does not check for non-negative parameters (that does seem a bit excessive)
    if (track > this.tracks || sector > this.sectors || block > this.blocksPer)
        throw 'Requested TSB is outside hard drive size.';

    // In terms of bits, TTSSSBBB (for the default size)
    var index = (track << this.trackShift) | (sector << this.sectorShift) | block;

    return index + this.indexOffset;
};


})();
