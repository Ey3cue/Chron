
var Utils = {};

(function () {

function defineFunction(obj, funct) {
    if (obj.prototype.hasOwnProperty(funct.name)) {
        console.warn("WARNING: PREDEFINED PROPERTY POSSIBLY OVERWRITTEN: " + obj.name + ": " + funct.name);
    }
    
    Object.defineProperty(obj.prototype, funct.name, { value: funct });
}

defineFunction(String, function prepad(length, character) {
    character = character || " ";
    
    var str = this; // This performs a deep copy.
    
    while (str.length < length)
        str = character + str;
    
    return str;
});

defineFunction(String, function pad(length, character) {
    character = character || " ";
    
    var str = this; // This performs a deep copy.
    
    while (str.length < length)
        str += character;
    
    return str;
});

})();