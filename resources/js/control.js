/* ----------
   control.js

   Initializes the document.
   ---------- */

var COMPILER_ID = 'chronosll';
var OS_ID = 'chronos';
var CPU_ID = 'chroniscpu';

var __resizeFunctions = [];

var Control = {};

(function () {

Control.init = function () {
	Layout.init();
};

Control.resize = function () {
	for (var i = __resizeFunctions.length - 1; i >= 0; i--) {
		__resizeFunctions[i]();
	}
};

$(window).load(Control.init);
$(window).resize(Control.resize);

})();