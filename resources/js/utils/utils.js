
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

$.fn.center = function () {
    this.wrap('<div></div>');
    var $div = this.parent();
    
    $div.css({
        width: '100%',
        height: '100%',
        'text-align': 'center'
    });
    
    this.css({
        position: 'relative',
        margin: 'auto',
        top: $div.height() / 2 - this.height() / 2
    }).children().css({
        margin: 'auto'
    });
    
    return this;
};

})();