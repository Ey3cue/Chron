
Compiler.Control = {};

Compiler.EXCEPTION = 'compiler-error';

// Variables
Compiler.sourceCode = null;
Compiler.tokenStream = null;
Compiler.symbolTable = null;

Compiler.cst = null;
Compiler.ast = null;

Compiler.cfg = null;

Compiler.code = null;
Compiler.problems = null;

Compiler.isVerbose = true;

(function () {

Compiler.Control.init = function () {
    Compiler.Source.init();

    Compiler.TokenStreamDisplay.init();
    Compiler.SyntaxTreeDisplay.init();
    Compiler.ControlFlowGraphDisplay.init();
    Compiler.Output.init();
    Compiler.SymbolTableDisplay.init();
};

Compiler.compile =
Compiler.Control.compile = function () {
    console.log('---------- Compiling ----------');

    Compiler.sourceCode = Compiler.Source.getCode();
    Compiler.tokenStream = [];
    Compiler.symbolTable = new Compiler.SymbolTable();

    Compiler.cst = new Compiler.CST();

    Compiler.code = '';

    Compiler.problems = [];

    // Compiler.isVerbose = $('#verbose').is(':checked');

    // Clear displays
    Compiler.TokenStreamDisplay.clear();
    Compiler.SyntaxTreeDisplay.clear();
    Compiler.SymbolTableDisplay.clear();
    Compiler.Output.clear();

    // Check for empty source code
    if (/^(\s*)$/.test(Compiler.sourceCode)) {
        return;
    }

    // Compile - Perform all possible points of error inside the try block. If an error occurs,
    //   the compiler throws an exception, which immediately brings the program back to this point.
    //   This is the easiest way I could think of to get out of the parser and tree traversals
    //   (in particular) if there's an error.
    try {
        Compiler.Lexer.analyze();
        Compiler.log('Lex completed successfully.');

        Compiler.Parser.parse();
        Compiler.log('Parse completed successfully.');
        Compiler.SyntaxTreeDisplay.initCst();

        Compiler.ast = new Compiler.AST(Compiler.cst);
        Compiler.SyntaxTreeDisplay.initAst();
        Compiler.SyntaxTreeDisplay.setAst();

        Compiler.SemanticAnalyzer.analyze();
        Compiler.log('Semantic analysis completed successfully.');

        Compiler.cfg = new Compiler.ControlFlowGraph(Compiler.ast);
        Compiler.ControlFlowGraphDisplay.initCfg();
        Compiler.ControlFlowGraphDisplay.set();

        Compiler.CodeGenerator.generate();

    } catch (e) {
        if (e === Compiler.EXCEPTION) {
            // An error compiling
            console.log(e);
        } else {
            // The compiler screwed up somewhere
            throw e;
        }
    }

    // This is outside try block because it handles both errors and successes
    Compiler.TokenStreamDisplay.set();
    Compiler.SymbolTableDisplay.set();

    Compiler.log();
    for (var i = 0; i < Compiler.problems.length; i++) {
        Compiler.log(Compiler.problems[i].toString());
    }

    Compiler.Output.show();

    if (Compiler.code.length) {
        Compiler.Output.showCode(Compiler.code);
    }
};

Compiler.Control.run =
Compiler.run = function () {
    if (Compiler.code.length) {
        MainTabs.triggerSelect('os');
        setTimeout(function () {
            var pid = OS.Kernel.loadProgram(Compiler.code, null, null, true);
            OS.Kernel.runProcess(pid);
        }, 800);
    }
};

Compiler.Control.log =
Compiler.log = function (message) {
    Compiler.Output.add(message);
};

/**
 * Sends a message to the output console if the compiler is in verbose mode.
 *
 * @param {String} message the message to send
 * @param {Number} the line number the message refers to
 */
Compiler.Control.trace =
Compiler.trace = function (message, line) {
    if (Compiler.isVerbose) {
        line = line ? line.toString().prepad(3) + ' ' : '';
        Compiler.Output.add(line + message);
    }
};

/**
 * Adds a warning to the compiler output.
 *
 * @param {String} message the warning message
 * @param {Number} the line number the warning refers to
 */
Compiler.Control.addWarning =
Compiler.addWarning = function (message, line) {
    Compiler.problems.push(new Problem(Problem.Type.WARNING, message, line));
};

/**
 * Adds an error to the compiler output and throws an exception to stop compiling process.
 *
 * @param {String} message the error message
 * @param {Number} the line number the error refers to
 */
Compiler.Control.addError =
Compiler.addError = function (message, line) {
    Compiler.problems.push(new Problem(Problem.Type.ERROR, message, line));
    throw 'compiler-error';
};

/**
 * Creates a new Problem, a general object encapsulating both errors and warnings.
 *
 * @param {Problem.Type} type the type of proble, specified by Problem.Type.<TYPE>
 * @param {String} message the message associated with the problem
 * @param {Number} line the line number the problem refers to in the source code
 */
var Problem = Compiler.Problem = function (type, message, line) {
    this.type = type;
    this.message = message;
    this.line = line;
};

/**
 * Returns a string representation of this problem.
 *
 * @return {String} a string representation of this problem
 */
Problem.prototype.toString = function () {
    return 'Line ' + this.line.toString().prepad(3) + ' ' + this.type.toString().prepad(8) + ' ' +
           this.message;
};

/**
 * Possible types of problems.
 */
Problem.Type = new Enum(
    'HINT',
    'WARNING',
    'ERROR'
);

})();
