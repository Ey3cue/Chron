
var Enum;

(function () {

/**
 * Creates a new enumerated type. Arguments passed in are the possible values of the tpye.
 *
 * e.g.
 *
 * var Weekday = new Enum('MONDAY', 'TUESDAY', 'WEDNESDAY', ...);
 *
 * var day = Weekday.MONDAY;
 *
 * if (day === Weekday.MONDAY) {
 *     ...
 * }
 *
 * @param {Number} startId (optional) the starting ID to identify the enum type with
 */
Enum = function (startId) {
    var isStartUndefined = !($.isNumeric(startId));

    for (var i = isStartUndefined ? 0 : 1; i < arguments.length; i++) {
        this[arguments[i]] = new EnumType(arguments[i], isStartUndefined ? undefined : startId++);
    }
};

Enum.prototype.fromId = function (id) {
    for (var type in this) {
        if (this[type].id === id) {
            return this[type];
        }
    }
    return null;
};

// When generating IDs, start with -1 and decrement. When the user specifies a custom ID, it is
//   usually a positive number. This will help reduce overlapping IDs.
var ids = -1;

function EnumType(name, id) {
    this.id = id === undefined ? ids-- : id;
    this.name = name.varToPhrase();
}

EnumType.prototype.is = function (type) {
    return this.id === type.id;
};

EnumType.prototype.toString = function () {
    return this.name;
};

})();
