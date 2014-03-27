
Compiler.SyntaxTreeDisplay = {};

(function () {

var FONT_SIZE = 13;

var _$cst;
var _$ast;

var _$displayContainer;
var _$displayScroller;

var _defaultWidth;
var _defaultHeight;

var _$displayOptions;
var _$expandButton;
var _$toggleButton;
var _isExpanded;

var _cstGraph;
var _cstPaper;
var _cstCells;
var _cstEdgeCells;

var _astGraph;
var _astPaper;
var _astCells;
var _astEdgeCells;

Compiler.SyntaxTreeDisplay.init = function () {
    _$cst = $('#compilerCst');
    _$ast = $('#compilerAst');

    _$displayContainer = $('#compilerSyntaxTreeContainer');
    _$displayScroller = $('#compilerSyntaxTreeScroller');

    _defaultWidth = _$displayScroller.width();
    _defaultHeight = _$displayScroller.height();

    _$displayOptions = $('#compilerSyntaxTreeOptions');
    _$expandButton = $('#compilerButtonSTExpand');
    _$toggleButton = $('#compilerButtonSTToggle');
    _$expandButton.click(toggleExpand);
    _$toggleButton.click(toggleSyntaxTree);
    _isExpanded = false;

    _cstGraph = new joint.dia.Graph();
    _cstPaper = new joint.dia.Paper({
        el: _$cst,
        width: _$cst.width(),
        height: _$cst.height(),
        gridSize: 1,
        model: _cstGraph
    });

    _astGraph = new joint.dia.Graph();
    _astPaper = new joint.dia.Paper({
        el: _$ast,
        width: _$ast.width(),
        height: _$ast.height(),
        gridSize: 1,
        model: _astGraph
    });
};

Compiler.SyntaxTreeDisplay.initCst = function () {
    _cstGraph.clear();
    _cstPaper.fitToContent();
    _$cst.addClass('compilerSTGen')
         .on('click', Compiler.SyntaxTreeDisplay.setCst);
};

Compiler.SyntaxTreeDisplay.initAst = function () {
    _astGraph.clear();
    _astPaper.fitToContent();
    _$ast.addClass('compilerSTGen')
         .on('click', Compiler.SyntaxTreeDisplay.setAst);
};

Compiler.SyntaxTreeDisplay.setCst = function () {
    _$cst.removeClass('compilerSTGen')
         .off('click');

    _cstCells = [];
    _cstEdgeCells = [];

    createCstNodes(null, Compiler.cst.tree);

    _cstGraph.resetCells(_cstCells.concat(_cstEdgeCells));

    joint.layout.DirectedGraph.layout(_cstGraph, { setLinkVertices: false });

    _cstPaper.fitToContent();

    scalePaper(_cstPaper);

    _$displayScroller.scrollTop(0)
                     .scrollLeft(0)
                     .perfectScrollbar('update');
};

Compiler.SyntaxTreeDisplay.setAst = function () {
    _$ast.removeClass('compilerSTGen')
         .off('click');

    _astCells = [];
    _astEdgeCells = [];

    createAstNodes(null, Compiler.ast.tree);

    _astGraph.resetCells(_astCells.concat(_astEdgeCells));

    joint.layout.DirectedGraph.layout(_astGraph, { setLinkVertices: false });

    _astPaper.fitToContent();

    scalePaper(_astPaper);

    _$displayScroller.scrollTop(0)
                     .scrollLeft(0)
                     .perfectScrollbar('update');
};

function createCstNodes(parentCell, node) {
    var cell = createNode(node.value.toString());
    _cstCells.push(cell);

    if (parentCell) {
        _cstEdgeCells.push(createEdge(parentCell.id, cell.id));
    }

    for (var i = 0; i < node.children.length; i++) {
        createCstNodes(cell, node.children[i]);
    }
}

function createAstNodes(parentCell, node) {
    var cell = createNode(node.value.toString());
    _astCells.push(cell);

    if (parentCell) {
        _astEdgeCells.push(createEdge(parentCell.id, cell.id));
    }

    for (var i = 0; i < node.children.length; i++) {
        createAstNodes(cell, node.children[i]);
    }
}

function createNode(text) {
    text = text || 'n/a';

    var parts = text.split('\n');
    var maxLength = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
        maxLength = Math.max(maxLength, parts[i].length);
    }

    var width = (FONT_SIZE * (0.6 * maxLength));
    var height = (parts.length) * FONT_SIZE;

    return new joint.shapes.basic.Rect({
        size: {
            width: width,
            height: height
        },
        attrs: {
            rect: {
                'fill': 'none',
                'stroke': 'none'
            },
            text: {
                'text': text,
                'font-family': 'Consolas',
                'font-size': FONT_SIZE + 'px',
                'fill': '#E0E0E0'
            }
        }
    });
}

function createEdge(fromId, toId, color) {
    color = color || '#E0E0E0';

    return new joint.dia.Link({
        source: { id: fromId },
        target: { id: toId },
        attrs: {
            '.connection': { stroke: color },
            '.marker-target': { fill: color, d: 'M 10 0 L 0 5 L 10 10 z' }
        }
    });
}

function scalePaper(paper) {
    if (_isExpanded) {
        paper.scale(1, 1);
    } else {
        paper.scale(Math.min(_defaultWidth / paper.options.width, 1), Math.min(_defaultHeight / paper.options.height, 1));
    }
}

function toggleExpand() {
    _isExpanded = !_isExpanded;

    _$expandButton.toggleClass('buttonExpand buttonRestore');
    _$displayContainer.toggleClass('expanded');
    scalePaper(_cstPaper);
    scalePaper(_astPaper);

    if (_isExpanded) {
        // Must wait till after animation to update
        setTimeout(function () { _$displayScroller.perfectScrollbar({ wheelSpeed: 30 }); }, 400);
    } else {
        _$displayScroller.scrollTop(0)
                         .scrollLeft(0)
                         .perfectScrollbar('destroy');
    }
}

function toggleSyntaxTree() {
    _$toggleButton.toggleClass('buttonCst buttonAst');
    _$cst.toggleClass('compilerActiveST');
    _$ast.toggleClass('compilerActiveST');

    scalePaper(_astPaper);
    scalePaper(_cstPaper);
}

})();
