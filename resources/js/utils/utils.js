
var Utils = {};

(function () {

function defineFunction(obj, funct, name) {
    name = name || funct.name;

    if (obj.prototype.hasOwnProperty(name)) {
        console.warn('WARNING: PREDEFINED PROPERTY POSSIBLY OVERWRITTEN: ' + obj.name + ': ' + name);
    }
    
    Object.defineProperty(obj.prototype, name, { value: funct });
}

defineFunction(String, function prepad(length, character) {
    character = character || ' ';
    
    var str = this; // This performs a deep copy.
    
    while (str.length < length)
        str = character + str;
    
    return str;
});

defineFunction(String, function pad(length, character) {
    character = character || ' ';
    
    var str = this; // This performs a deep copy.
    
    while (str.length < length)
        str += character;
    
    return str;
});

defineFunction(String, function varToTitle() {
    if (!this.length) {
        return this;
    }

    var str = this.replace(/([A-Z])/g, ' $1');
    return str[0].toUpperCase() + str.substring(1);
});

defineFunction(String, function varToPhrase() {
    if (!this.length) {
        return this;
    }

    var str = this.replace(/([A-Z])/g, ' $1');
    return str[0].toUpperCase() + str.substring(1).toLowerCase();
});

defineFunction(Array, Array.prototype.push, 'enqueue');
defineFunction(Array, Array.prototype.shift, 'dequeue');

Utils.bidirectional = function (obj) {
    for (var key in obj) {
        obj[obj[key]] = key;
    }
    
    return obj;
};

Utils.number = function (obj, start) {
    var id = start === undefined ? 0 : start;

    if ($.isArray(obj)) {
        var array = obj;
        obj = {};

        for (var i = 0; i < array.length; i++) {
            obj[array[i]] = id++;
        }

        return obj;
    }

    for (var key in obj) {
        obj[key] = id++;
    }
    
    return obj;
};

/**
 * Returns an object of the URL parameters. 
 * 
 * Adapted from http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
 *
 * @return {Object} an object of the URL parameters
 */
Utils.getUrlParameters = function () {
    var params = {};
    var vars = window.location.search.substring(1).split('&');

    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        
        // If first entry with this name
        if (typeof params[pair[0]] === 'undefined') {
            params[pair[0]] = pair[1];
        // If second entry with this name
        } else if (typeof params[pair[0]] === 'string') {
            var arr = [params[pair[0]], pair[1]];
            params[pair[0]] = arr;
        // If third or later entry with this name
        } else {
            params[pair[0]].push(pair[1]);
        }
    }

    return params;
};

})();