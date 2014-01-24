
OS.Shell = {};

(function () {

var HELP_PATTERN = /(h)|(help)|(\?)/i;

var _commands = {};

OS.Shell.init = function () {};

OS.Shell.start = function () {};

OS.Shell.stop = function () {};

OS.Shell.issueCommand = function (write, input) {
    var args = input.trim().split(/\s+/g);

    // The command will be the first argument
    var command = args.shift().toLowerCase();
    trace('Command issued: ' + command);

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
    _commands[options.command] = new ShellCommand(options);
}

function ShellCommand(options) {
    this.description = options.description || '???';
    this.detail = options.detail || null;
    this.funct = options.funct || function (write) {
        write('Command not implemented: `blue`' + options.command + '``');
    };
}

ShellCommand.prototype.execute = function (write, args) {
    if (HELP_PATTERN.test(args[0])) {
        write(this.detail || 'There is no further information on this command.');
    } else {
        this.funct(write, args);
    }
};

addCommand({
    command: 'help',
    description: 'Displays this screen. Try entering `blue`help ?``.',
    detail: 'Enter a command followed by a `blue`?`` to get more information.\n\ne.g. `blue`help ?``',
    funct: function (write) {
        var out = '';
        for (var command in _commands) {
            out += '`blue`' + command + '`` ' + _commands[command].description + '\n';
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
    command: 'cls',
    description: 'Clears the console.',
    funct: OS.Console.clear
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

function trace(message) {
    OS.log(message, 'Shell');
}

})();