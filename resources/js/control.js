/* ----------
   control.js

   Initializes the document.
   ---------- */

var COMPILER_ID = 'compiler';
var OS_ID = 'os';
var CPU_ID = 'cpu';

var URL_PARAMETERS = null;

var MIN_WINDOW_SIZE = 675;

var __resizeFunctions = [];

var Control = {};

var Compiler = {};
var OS = {};
var CPU = {};

// Globals specific to each application will be defined in that application's control.js within
//   the respective objects.

(function () {

Control.init = function () {
    // General
    URL_PARAMETERS = Utils.getUrlParameters();
    Layout.init();

    // OS
    OS.Control.init();

    // Compiler
    Compiler.Control.init();

    // CPU
    CPU.Control.init();

    // TODO Figure out why this timeout is needed. For developing, disabling it, but it is a current
    //   workaround for the OS not being able to shut down when activated too quickly.
    setTimeout(function () {
        MainTabs.triggerSelect(URL_PARAMETERS.start);
    }, 1000);
};

Control.resize = function () {
    for (var i in __resizeFunctions) {
        __resizeFunctions[i]();
    }
};

$(window).load(Control.init);
$(window).resize(Control.resize);

})();
