
Compiler.ControlFlowGraphDisplay = {};

(function () {

var FONT_SIZE = 12;

var _$display;
var _$container;
var _$scroller;

var _defaultWidth;
var _defaultHeight;

var _$displayOptions;
var _$expandButton;
var _isExpanded;

var _graph;
var _paper;
var _cells;
var _edgeCells;

var _sourceCode;

Compiler.ControlFlowGraphDisplay.init = function () {
    _$display = $('#compilerCfg');
    _$container = $('#compilerCfgContainer');
    _$scroller = $('#compilerCfgScroller');

    _defaultWidth = _$scroller.height();
    _defaultHeight = _$scroller.width();

    _$displayOptions = $('#compilerCfgOptions');
    _$expandButton = $('#compilerButtonCfgExpand');
    _$expandButton.click(toggleExpand);
    _isExpanded = false;

    _graph = new joint.dia.Graph();
    _paper = new joint.dia.Paper({
        el: _$display,
        width: _$display.width(),
        height: _$display.height(),
        gridSize: 1,
        model: _graph
    });
};

Compiler.ControlFlowGraphDisplay.initCfg = function () {
    _graph.clear();
    _paper.fitToContent();
    _$display.addClass('compilerCfgGen')
             .on('click', Compiler.ControlFlowGraphDisplay.set);
};

Compiler.ControlFlowGraphDisplay.set = function () {
    _$display.removeClass('compilerCfgGen')
             .off('click');

    _cells = [];
    _edgeCells = [];

    cfg = Compiler.cfg;

    _sourceCode = Compiler.sourceCode.split(/[\n\r]/g);
    for (var i = 0; i < _sourceCode.length; i++) {
        _sourceCode[i] = _sourceCode[i].trim();
    }
    _sourceCode.unshift(''); // So that lines numbers correspond to array indices (off by 1)

    cfg.graph.setNewVisitor();
    createNodes(null, cfg.graph);
    cfg.graph.resetVisitor();

    _graph.resetCells(_cells.concat(_edgeCells));
    joint.layout.DirectedGraph.layout(_graph, { setLinkVertices: false, nodeSep: 150 });

    _paper.fitToContent();
    //_paper.setDimensions(_paper.options.width + 10, _paper.options.width + 10);
    scalePaper();

    _$scroller.scrollTop(0)
              .scrollLeft(0)
              .perfectScrollbar('update');
};

function createNodes(parentCell, node) {
    var cell;

    if (!node.wasVisited()) {
        node.visit();

        cell = createNode(node.value);
        node.ControlFlowGraphDisplay_id = cell.id;
        _cells.push(cell);

        for (var i = 0; i < node.children.length; i++) {
            createNodes(cell, node.children[i]);
        }
    }

    if (parentCell) {
        _edgeCells.push(createEdge(parentCell.id, node.ControlFlowGraphDisplay_id,
                cell ? '#4DD2FF' : '#7AFF4D'));
    }
}

function createNode(block) {
    var text = '';
    var parts = [];
    var maxLength = 0;
    for (var i = 0; i < block.length; i++) {
        var line = _sourceCode[block[i].value.line];
        parts.push(line);
        text += line + '\n';
        maxLength = Math.max(maxLength, line.length);
    }

    var width = (FONT_SIZE * (0.6 * maxLength)) + 5;
    var height = (parts.length) * (FONT_SIZE - 1) + 5;

    return new joint.shapes.basic.Rect({
        size: {
            width: width + 5,
            height: height + 5
        },
        attrs: {
            rect: {
                'fill': 'none',
                // 'stroke': 'none'
                'stroke': '#E0E0E0',
                'stroke-width': 2,
                width: width,
                height: height,
                rx: 5,
                ry: 5,
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

function createEdge(fromId, toId, color, smooth) {
    color = color || '#E0E0E0';

    return new joint.dia.Link({
        source: { id: fromId },
        target: { id: toId },
        attrs: {
            '.connection': { stroke: color },
            '.marker-target': { fill: color, d: 'M 10 0 L 0 5 L 10 10 z' }
        },
        smooth: smooth
    });
}

function scalePaper() {
    if (_isExpanded) {
        _paper.scale(1, 1);
    } else {
        _paper.scale(Math.min(_defaultWidth / _paper.options.width, 1), Math.min(_defaultHeight / _paper.options.height, 1));
    }
}

function toggleExpand() {
    _isExpanded = !_isExpanded;

    _$expandButton.toggleClass('buttonExpand buttonRestore');
    _$container.toggleClass('expanded');

    scalePaper();

    if (_isExpanded) {
        // Must wait till after animation to update
        setTimeout(function () { _$scroller.perfectScrollbar({ wheelSpeed: 30 }); }, 400);
    } else {
        _$scroller.scrollTop(0)
                  .scrollLeft(0)
                  .perfectScrollbar('destroy');
    }
}

})();
