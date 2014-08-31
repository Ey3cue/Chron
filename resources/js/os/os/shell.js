
OS.Shell = {};

(function () {

var _commands = {};

var _lastSpacerId = 0;

OS.Shell.init = function () {};

OS.Shell.start = function () {};

OS.Shell.stop = function () {};

OS.Shell.issueCommand = function (write, input) {
    var args = input.trim().split(/\s+/g);

    // The command will be the first argument
    var command = args.shift().toLowerCase();
    trace('Command issued: ' + command);

    // Execute command if it exists
    if (command in _commands) {
        _commands[command].execute(write, args);
    } else {
        write(
            'Unrecognized command: `blue`' + command + '``\n' +
            'Enter `blue`help`` to see a list of valid commands.'
        );
    }
};

function addCommand(options) {
    if (options === 'spacer') {
        _commands['__spacer__' + _lastSpacerId++] = new ShellCommand({ description: '__spacer__' });
    } else {
        _commands[options.command] = new ShellCommand(options);
    }
}

function ShellCommand(options) {
    this.command = options.command;
    this.description = options.description || '???';
    this.detail = options.detail || null;
    this.funct = options.funct || function (write) {
        write('Command not implemented: `blue`' + options.command + '``');
    };
}

ShellCommand.prototype.execute = function (write, args) {
    if (args[0] === '?') {
        write('`blue`' + this.command + '`` ' + this.description + '\n\n' +
              (this.detail || 'There is no further information on this command.'));
    } else {
        this.funct(write, args);
    }
};

// ---------- General ----------

addCommand({
    command: 'help',
    description: 'Displays this screen. Try entering `blue`help ?``.',
    detail: 'Enter a command followed by a `blue`?`` to get more information.\n\ne.g. `blue`help ?``',
    funct: function (write) {
        var out = 'Format: `blue`command`` `em cyanBlue`argument select|one|argument [optionalArgument]``\n\n';
        for (var command in _commands) {
            if (_commands[command].description === '__spacer__') {
                out += '\n';
            } else {
                out += '`blue`' + command + '`` ' + _commands[command].description + '\n';
            }
        }
        write(out);
    }
});

addCommand({
    command: 'ver',
    description: 'Displays the OS name and version.',
    funct: function (write) {
        write(OS.info);
    }
});

addCommand({
    command: 'prompt',
    description: '`em cyanBlue`prompt`` Sets the prompt.',
    funct: function (write, args) {
        OS.Console.setPrompt(args[0]);
    }
});

addCommand({
    command: 'cls',
    description: 'Clears the console.',
    funct: OS.Console.clear
});

addCommand({
    command: 'rot13',
    description: '`em cyanBlue`string`` Gives the ROT13 obfuscation of a string.',
    funct: function (write, args) {
        if (args.length) {
            write(args[0].rot13());
        }
    }
});

addCommand({
    command: 'whereami',
    description: 'Displays your location.',
    funct: function (write) {
        $.ajax({
            url: 'http://smart-ip.net/geoip-json?callback=?',
            dataType: 'json',
            success: function (data) { write(data.host); },
            error: function () { write('Unable to get location.'); }
        });
    }
});

addCommand({
    command: 'date',
    description: 'Displays the current date.',
    funct: function (write) {
        write(new Date().toString());
    }
});

addCommand({
    command: 'fail',
    description: 'Produce an OS error to be trapped.',
    funct: function () {
        OS.Kernel.trapError('A user-generated trap error.');
    }
});

addCommand('spacer');

// ---------- Process Handling ----------

addCommand({
    command: 'load',
    description: '`em cyanBlue`[priority times]`` Loads a process into memory.',
    detail: 'Loads a process into memory from the program input. Specify a priority if the OS is ' +
            'set to priority scheduling. A lower number is a higher priority.\n\nSpecify a times ' +
            'argument to load the process that number of times.',
    funct: function (write, args) {
        var priority = args[0];
        var numLoads = args[1] || 1;

        if (priority !== undefined) {
            if (/^(\d+)$/.test(priority)) {
                priority = parseInt(priority, 10);
            } else {
                write('Invalid priority: ' + priority);
                return;
            }
        }

        OS.Kernel.loadProgram(OS.ProgramInput.getInput(), priority, write);

        for (var i = 1; i < numLoads; i++) {
            OS.Kernel.loadProgram(OS.ProgramInput.getInput(),
                    priority, OS.Console.getWriteFunction());
        }
    }
});

addCommand({
    command: 'run',
    description: '`em cyanBlue`PID0 [PID1 PID2 ...]`` Runs the process(es).',
    detail: 'Runs the specified process(es). Enter multiple PIDs seperated by a space to run ' +
            'multiple processes.\n\ne.g. `blue`run 0 1 2``',
    funct: function (write, args) {
        if (args.length) {
            OS.Kernel.runProcess(parseInt(args[0].replace(/\D+/, ''), 10), write);
            for (var i = 1; i < args.length; i++) {
                OS.Kernel.runProcess(parseInt(args[i].replace(/\D+/, ''), 10), OS.Console.getWriteFunction());
            }
        } else {
            write('Please specify a process to run.');
        }
    }
});

addCommand({
    command: 'runall',
    description: 'Runs all loaded processes.',
    funct: function (write) {
        OS.Kernel.runAllProcesses();
    }
});

addCommand({
    command: 'active',
    description: 'Displays active processes.',
    funct: function (write) {
        var processes = OS.Kernel.getActiveProcesses();
        if (processes.length) {
            var str = 'PID' + processes[0].pid + ' (Running)';
            for (var i = 1; i < processes.length; i++) {
                str += '\nPID' + processes[i].pid;
            }
            write(str);
        } else {
            write('No processes are active.');
        }
    }
});

addCommand({
    command: 'sched',
    description: '`em cyanBlue`rr|fcfs|priority`` Sets the scheduling mode.',
    detail: '`em cyanBlue`rr`` - Round Robin (default)\n' +
            '`em cyanBlue`fcfs`` - First Come First Serve\n' +
            '`em cyanBlue`priority`` - Priority (specified on process load)',
    funct: function (write, args) {
        var method;
        switch (args[0].toLowerCase()) {
        case 'rr':       method = OS.SchedulingMode.ROUND_ROBIN; break;
        case 'fcfs':     method = OS.SchedulingMode.FCFS;        break;
        case 'priority': method = OS.SchedulingMode.PRIORITY;    break;
        default:         write('Invalid scheduling mode.');      return;
        }

        OS.Kernel.setSchedulingMode(method, write);
    }
});

addCommand({
    command: 'quantum',
    description: '`em cyanBlue`quantum`` Sets the round robin quantum.',
    funct: function (write, args) {
        if (/^(\d+)$/.test(args[0])) {
            OS.Kernel.setRoundRobinQuantum(parseInt(args[0], 10));
        } else {
            write('Invalid quantum. Quantum must be a positive integer.');
        }
    }
});

addCommand({
    command: 'kill',
    description: '`em cyanBlue`pid`` Terminates the specified process.',
    funct: function (write, args) {
        if (/^(\d+)$/.test(args[0])) {
            OS.Kernel.killProcess(parseInt(args[0], 10), write);
        } else {
            write('Invalid PID.');
        }
    }
});

addCommand('spacer');

// ---------- File Handling ----------

addCommand({
    command: 'format',
    description: 'Formats the hard drive.',
    funct: function(write) {
        OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
            write: write,
            command: 'format'
        });
    }
});

addCommand({
    command: 'create',
    description: '`em cyanBlue`filename`` Creates a file.',
    funct: function(write, args) {
        if (args.length) {
            OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
                write: write,
                command: 'create',
                filename: args[0]
            });
        } else {
            write('Usage: `blue`create`` `em cyanBlue`filename``\nPlease supply a filename.');
        }
    }
});

addCommand({
    command: 'read',
    description: '`em cyanBlue`filename`` Reads a file.',
    funct: function(write, args) {
        if (args.length) {
            OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
                write: write,
                command: 'read',
                filename: args[0]
            });
        } else {
            write('Usage: `blue`read`` `em cyanBlue`filename``\nPlease supply a filename.');
        }
    }
});

addCommand({
    command: 'write',
    description: '`em cyanBlue`filename data`` Writes data to a file.',
    funct: function(write, args) {
        if (args.length >= 2) {
            OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
                write: write,
                command: 'write',
                filename: args[0],
                data: args[1]
            });
        } else {
            write('Usage: `blue`write`` `em cyanBlue`filename data``\n' +
                  'Please supply a filename and data to write.');
        }
    }
});

addCommand({
    command: 'delete',
    description: '`em cyanBlue`filename`` Deletes a file.',
    funct: function(write, args) {
        if (args.length) {
            OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
                write: write,
                command: 'delete',
                filename: args[0]
            });
        } else {
            write('Usage: `blue`delete`` `em cyanBlue`filename``\nPlease supply a filename.');
        }
    }
});

addCommand({
    command: 'ls',
    description: 'Lists all files.',
    funct: function(write) {
        OS.Kernel.interrupt(OS.Irq.HARD_DRIVE, {
            write: write,
            command: 'list'
        });
    }
});

function trace(message) {
    OS.log(message, 'Shell');
}

})();
