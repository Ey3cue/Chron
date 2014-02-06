
OS.HardDriveDriver = {};

(function () {

var _loaded = false;
var _hardDrive;

OS.HardDriveDriver.start = function () {

    var _hardDrive = new OS.HardDrive();

    _loaded = true;
    trace('Driver loaded.');
};

OS.HardDriveDriver.stop = function () {
    _loaded = false;
    trace('Driver unloaded.');
};

OS.HardDriveDriver.isr = function (params) {
    var write = params.write;
    var command = params.command;
    var filename = params.filename; // Will be undefined if the command is format or list.
    var data = params.data; // Will be undefined if the command is not write.

    /*
    try {
    //*/
        switch (command) {
        // Shell commands
        case 'create':
            OS.HardDriveDriver.createFile(filename);
            write('File created.');
            break;
        case 'read':
            write(OS.HardDriveDriver.readFile(filename));
            break;
        case 'write':
            OS.HardDriveDriver.writeFile(filename, data);
            write('File written.');
            break;
        case 'delete':
            OS.HardDriveDriver.deleteFile(filename);
            write('File deleted.');
            break;
        case 'list':
            OS.HardDriveDriver.listFiles(write);
            break;
        case 'format':
            OS.HardDriveDriver.format();
            write('Format successful.');
            break;

        // Swap commands
        case 'swap-write':
            OS.HardDriveDriver.createFile(filename, true);
            OS.HardDriveDriver.writeFile(filename, data, true);
            break;
        case 'swap-read':
            OS.HardDriveDriver.buffer = OS.HardDriveDriver.read(filename);
            break;
        case 'swap-delete':
            OS.HardDriveDriver.deleteFile(filename);
            break;

        default:
            OS.Kernel.trapError('Invalid HDD Driver command.');
        }
    /*
    } catch (e) {
        if (!(/swap/).test(command))
            write(e);
        else
            Kernel.trace('Swap file error: ' + e);
    }
    //*/
};

/**
 * Creates the specified file.
 *
 * @param {String} filename the file
 * @param {Boolean} forSwap true if this operation is for swapping
 */
OS.HardDriveDriver.createFile = function (filename, forSwap)
{
    trace('Creating file: ' + filename);

    try {
        var filenameFile = OS.HardDriveDriver.findFile(filename);
    } catch (e) {
        var file = OS.HardDriveDriver.findFreeFile();
        file.setData(filename);
        file.setLinkedTSB(0, 0, 0);
        file.writeToDrive(OS.hardDrive);
        return;
    }

    if (!forSwap) {
        throw 'Error: File already exists.';
    }
};

/**
 * Reads the specified file.
 *
 * @param filename the file
 */
OS.HardDriveDriver.readFile = function (filename)
{
    trace('Reading file: ' + filename);

    var filenameFile = OS.HardDriveDriver.findFile(filename);

    if (!filenameFile.isLinked())
        throw 'File contains nothing.';

    var contentsFile = OS.HardDriveDriver.getLinkedFile(filenameFile);

    var contents = contentsFile.getData();

    while (contentsFile.isLinked())
    {
        contentsFile = OS.HardDriveDriver.getLinkedFile(contentsFile);
        contents += contentsFile.getData();
    }

    return contents;
};

/**
 * Writes data to the specified file (overwrites; does not append).
 *
 * @param filename the file
 */
OS.HardDriveDriver.writeFile = function (filename, data, binaryData)
{
    trace('Writing to file: ' + filename + ' ' + data);

    /*
     * filenameFile - the file in the directory containing the name and linked TSB
     * files - an array of file objects containing the contents of the file to store.
     * currentFile - the current file of the iteration
     * file - the file shifted from the front of files
     * foundFiles - an array of the final file objects found to store the file's contents
     */

    var filenameFile = OS.HardDriveDriver.findFile(filename);

    OS.HardDriveDriver.deleteFileChain(filenameFile);

    var files = OS.File.filesFromData(data, binaryData);

    var iterator = new HardDriveIterator(OS.hardDrive);
    iterator.setStart(1, 0, 0);

    var element, currentFile, file, foundFiles = [];

    while ((element = iterator.next()) && files.length > 0)
    {
        currentFile = OS.File.fileFromStr(element);
        if (currentFile.isAvailable())
        {
            file = files.shift();
            file.setTSB(iterator.track, iterator.sector, iterator.block);
            foundFiles.push(file);
        }
    }

    if (files.length > 0)
        throw 'Not enough free space for contents.';

    // Link filename file to file contents.
    filenameFile.setLinkedTSB(foundFiles[0].track, foundFiles[0].sector, foundFiles[0].block);
    filenameFile.writeToDrive(OS.hardDrive);

    // Link all contents files to the following file except for the last and write to drive.
    for (var i = 0; i < foundFiles.length - 1; i++)
    {
        foundFiles[i].setLinkedTSB(foundFiles[i + 1].track, foundFiles[i + 1].sector, foundFiles[i + 1].block);
        foundFiles[i].writeToDrive(OS.hardDrive);
    }

    // Write the last file.
    foundFiles[foundFiles.length - 1].writeToDrive(OS.hardDrive);
};

/**
 * Deletes the specified file.
 *
 * @param filename the file
 */
OS.HardDriveDriver.deleteFile = function (filename)
{
    trace('Deleting file: ' + filename);

    if (filename === 'MBR')
        throw 'Cannot delete MBR.';

    OS.HardDriveDriver.deleteFileChain(OS.HardDriveDriver.findFile(filename), true);
};

/**
 * Deletes (sets as available) the chain of files starting with the specified file.
 *
 * @param {File} file the first file of the chain to delete
 * @param {Boolean} inclusive true if the first file in the chain should also be deleted.
 */
OS.HardDriveDriver.deleteFileChain = function (file, inclusive)
{
    if (inclusive)
        file.deleteFromDrive(OS.hardDrive);

    if (!file.isLinked())
        return;

    var nextFile = OS.HardDriveDriver.getFile(file.linkedTrack, file.linkedSector, file.linkedBlock);
    nextFile.deleteFromDrive(OS.hardDrive);

    while (nextFile.isLinked())
    {
        nextFile = OS.HardDriveDriver.getFile(nextFile.linkedTrack, nextFile.linkedSector, nextFile.linkedBlock);
        nextFile.deleteFromDrive(OS.hardDrive);
    }
};

/**
 * Lists the files to the console.
 */
OS.HardDriveDriver.listFiles = function (write)
{
    var iterator = new HardDriveIterator(OS.hardDrive), element, file;
    iterator.setTermination(0, 7, 7);

    console.log('start');
    while ((element = iterator.next()))
    {
        file = OS.File.fileFromStr(element);
        console.log(file);
        if (!file.isAvailable())
        {
            write(file.getData() + '\n');
        }
    }
};

/**
 * Formats the hard drive (i.e. zero-fills it).
 */
OS.HardDriveDriver.format = function ()
{
    trace('Formatting hard drive...');

    var t, s, b;

    // Each hex character is 4 bits, so the block size in bytes * 2 will yield number of hex digits per block.
    var data = ''.pad(OS.hardDrive.blockSize * 2, '0');

    var iterator = new HardDriveIterator(OS.hardDrive);

    while (!iterator.terminated)
    {
        iterator.next();
        OS.hardDrive.write(iterator.track, iterator.sector, iterator.block, data);
    }

    OS.hardDrive.write(0, 0, 0, OS.mbr.toFileString());
};

/**
 * Finds and returns the specified file.
 *
 * @param {String} filename the file's name
 *
 * @return {File} the file
 */
OS.HardDriveDriver.findFile = function (filename)
{
    var iterator = new HardDriveIterator(OS.hardDrive), element, file, currentFilename;
    iterator.setTermination(0, 7, 7);

    while ((element = iterator.next()))
    {
        file = OS.File.fileFromStr(element);
        currentFilename = file.getData();
        if (!file.isAvailable() && currentFilename === filename)
        {
            file.setTSB(iterator.track, iterator.sector, iterator.block);
            return file;
        }
    }

    throw 'File not found: ' + filename;
};

/**
 * Returns the file located at the TSB of this driver's hard drive or null if the file doesn't exist.
 *
 * @param {Number} track the track
 * @param {Number} sector the sector
 * @param {Number} block the block
 *
 * @return {File} the file
 */
OS.HardDriveDriver.getFile = function (track, sector, block)
{
    try
    {
        var file = OS.File.fileFromStr(OS.hardDrive.read(track, sector, block));
        file.setTSB(track, sector, block);
        return file;
    }
    catch (e)
    {
        return null;
    }
};

/**
 * Returns the file linked from the specified file.
 *
 * @param {File} file the linking file
 *
 * @return {File} the linked file
 */
OS.HardDriveDriver.getLinkedFile = function (file)
{
    try
    {
        var linkedFile = OS.File.fileFromStr(OS.hardDrive.read(file.linkedTrack, file.linkedSector, file.linkedBlock));
        linkedFile.setTSB(file.linkedTrack, file.linkedSector, file.linkedBlock);
        return linkedFile;
    }
    catch (e)
    {
        return null;
    }
};

/**
 * Finds and return the first free file space to store a file name in the main directory.
 *
 * @return {File} the first free file space
 */
OS.HardDriveDriver.findFreeFile = function ()
{
    var iterator = new HardDriveIterator(OS.hardDrive), element, file;
    iterator.setTermination(0, 7, 7); // Directory is the first track

    while ((element = iterator.next()))
    {
        file = OS.File.fileFromStr(element);
        if (file.isAvailable())
        {
            file.setTSB(iterator.track, iterator.sector, iterator.block);
            return file;
        }
    }

    throw 'Cannot create file; directory full.';
};

/**
 * Returns the contents of the hard drive. For display purposes only.
 *
 * @return {Array} the hard drive's contents
 */
OS.HardDriveDriver.getContents = function ()
{
    var t, s, b;
    var data = [];

    for (t = 0; t < OS.hardDrive.tracks; t++) {
        data.push([]);

        for (s = 0; s < OS.hardDrive.sectors; s++) {
            data[t].push([]);

            for (b = 0; b < OS.hardDrive.blocksPer; b++) {
                data[t][s].push(OS.hardDrive.read(t, s, b));
            }
        }
    }

    return data;
};


/**
 * A convenience object used to iterate through a hard drive's contents.
 *
 * @param {HardDrive} hardDrive the hard drive to be iterated through.
 */
function HardDriveIterator(hardDrive) {
    this.hardDrive = hardDrive;

    this.track = 0;
    this.sector = 0;
    this.block = -1; // Start 1 less as the iterator will increment it

    this.terminationTrack = this.hardDrive.tracks - 1;
    this.terminationSector = this.hardDrive.sectors - 1;
    this.terminationBlock = this.hardDrive.blocksPer - 1;

    this.terminated = false;
}

/**
 * Returns the next element of the hard drive or null if the element doesn't exist.
 *
 * @return {String} the next element
 */
HardDriveIterator.prototype.next = function () {
    this.increment();

    if (this.terminated) {
        return null;
    }

    return this.hardDrive.read(this.track, this.sector, this.block);
};

/**
 * Sets the track, sector, and block to start at (inclusive).
 *
 * @param {Number} track the track
 * @param {Number} sector the sector
 * @param {Number} block the block
 */
HardDriveIterator.prototype.setStart = function (track, sector, block) {
    this.track = track !== undefined ? track : this.track;
    this.sector = sector !== undefined ? sector : this.sector;
    this.block = block !== undefined ? block - 1 : this.block - 1;
};

/**
 * Sets the track, sector, and block to terminate at (inclusive).
 *
 * @param {Number} track the track
 * @param {Number} sector the sector
 * @param {Number} block the block
 */
HardDriveIterator.prototype.setTermination = function (track, sector, block) {
    this.terminationTrack = track !== undefined ? track : this.terminationTrack;
    this.terminationSector = sector !== undefined ? sector : this.terminationSector;
    this.terminationBlock = block !== undefined ? block : this.terminationBlock;
};

/**
 * Terminates the iterator.
 */
HardDriveIterator.prototype.terminate = function () {
    this.track = -1;
    this.sector = -1;
    this.block = -1;
    this.terminated = true;
};

/**
 * Moves this iterator to the next iteration.
 */
HardDriveIterator.prototype.increment = function () {
    // Check for termination.
    if (this.terminated) {
        return;
    }

    if (this.track === this.terminationTrack &&
        this.sector === this.terminationSector &&
        this.block === this.terminationBlock) {

        this.terminate();
        return;
    }

    // Increment TSB
    this.block++;

    if (this.block >= this.hardDrive.blocksPer) {
        this.block = 0;
        this.sector++;

        if (this.sector >= this.hardDrive.sectors) {
            this.sector = 0;
            this.track++;

            if (this.track > this.hardDrive.tracks) {
                this.terminate();
            }
        }
    }
};

function trace(message) {
    OS.log(message, 'HardDriveDriver');
}

})();

