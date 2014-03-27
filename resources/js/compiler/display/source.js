
Compiler.Source = {};

(function () {

var _code;

var _$options;

Compiler.Source.init = function () {
    _code = CodeMirror.fromTextArea($('#compilerSource')[0], {
        lineNumbers: true,
        theme: 'twilight'
    });

    _code.setSize($('#compilerSourceContainer').width(), $('#compilerSourceContainer').height());

    _$options = $('#compilerSourceOptions');

    $('#compilerCompileButton').click(Compiler.compile);
    $('#compilerRunButton').click(function () {
        Compiler.compile();
        Compiler.run();
    });

    for (var name in Compiler.TEST_PROGS) {
        var $button = $('<div class="compilerSourceButton">' + name + '</div>');
        $button.click(name, setCode);
        _$options.append($button);
    }
};

Compiler.Source.getCode = function () {
    return _code.getValue();
};

function setCode(event) {
    _code.setValue(Compiler.TEST_PROGS[event.data]);
}


})();
