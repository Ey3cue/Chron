
Compiler.SymbolTableDisplay = {};

(function () {

var _$container;
var _$display;

var HEADER = '<table><tr>' +
                 '<th>Scope</th>' +
                 '<th>Line</th>' +
                 '<th>Name</th>' +
                 '<th>Type</th>' +
             '</tr>';

Compiler.SymbolTableDisplay.init = function () {
    _$container = $('#compilerSymbolTableContainer');
    _$display = $('#compilerSymbolTable');
};

Compiler.SymbolTableDisplay.set = function (symbolTable) {
    symbolTable = symbolTable || Compiler.symbolTable;
    var symbols = symbolTable.getSymbols();

    if ($.isEmptyObject(symbols)) {
        _$display.html('<span class="grey">No symbols found.</span>');
    } else {
        var html = HEADER;

        for (var i in symbols) {
            html += '<tr>' +
                        '<td>' + symbols[i].scope + '</td>' +
                        '<td>' + symbols[i].line + '</td>' +
                        '<td>' + symbols[i].name + '</td>' +
                        '<td>' + symbols[i].type + '</td>' +
                    '</td>';
        }

        _$display.html(html);
    }
};

Compiler.SymbolTableDisplay.clear = function () {
    _$display.html('');
};

})();
