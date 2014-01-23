
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
 */
Enum = function () {
	for (var i = 0; i < arguments.length; i++) {
		this[arguments[i]] = new EnumType(arguments[i]);
	}
};

var ids = 0;

function EnumType(name) {
	this.id = ids++;
	this.name = name.varToPhrase();
}

EnumType.prototype.is = function (type) {
	return this.id === type.id;
};

EnumType.prototype.toString = function () {
	return this.name;
};

})();