
CPU.DatapathDisplay = {};

(function () {

var FONT_SIZE = 12;

var _$display;

var _graph;
var _paper;
var _cells;
var _edgeCells;

CPU.DatapathDisplay.init = function () {
    _$display = $('#cpuDatapath');

    _graph = new joint.dia.Graph();
    _paper = new joint.dia.Paper({
        el: _$display,
        width: _$display.width(),
        height: _$display.height(),
        gridSize: 5,
        model: _graph,
        snapLinks: true,
        defaultLink: new joint.shapes.logic.Wire()
    });

    test();
};

function test() {
    var rect = new Shapes.Register16({
        position: { x: 50, y: 70 }
    });

    _graph.addCell(rect);
}

var Shapes = joint.shapes.cpu = {
    Register16_new: joint.shapes.basic.Generic.extend({
        markup: '<g class="rotatable"><g class="scalable"><rect/></g><text class="label"/><text class="value"/></g>',

        defaults: joint.util.deepSupplement({
            type: 'cpu.Register16',
            size: {
                x: 60,
                y: 160
            },
            attrs: {
                'rect': {
                    fill: 'none',
                    stroke: 'white',
                    'follow-scale': true
                },
                'text': {
                    fill: 'white',
                    'font-family': 'Consolas, monospace',
                    'font-size': 14,
                    'x-alignment': 'middle'
                },
                '.label': {
                    text: 'Register',
                    'y-alignment': 'top'
                },
                '.value': {
                    'y-alignment': 'bottom',
                    text: '0000000000000000'
                }
            }
        }, joint.shapes.basic.Generic.prototype.defaults)
    }),

    Register8_old: joint.shapes.basic.Rect.extend({
        markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/></g>',
        defaults: joint.util.deepSupplement({
            type: 'cpu.Register8',
            attrs: {
                rect: {
                    fill: 'none',
                    stroke: 'white'
                },
                text: {
                    text: '00000000',
                    'font-family': 'Consolas, monospace',
                    fill: 'white'
                }
            },
            size: { width: 80, height: 30 }
        }, joint.shapes.basic.Rect.prototype.defaults)
    }),

    Register16: joint.shapes.basic.Rect.extend({
        markup: '<g class="rotatable"><g class="scalable"><rect/></g><text class="label"/><text class="value"/></g>',
        defaults: joint.util.deepSupplement({
            type: 'cpu.Register16',
            attrs: {
                rect: {
                    fill: 'none',
                    stroke: 'white'
                },
                text: {
                    'font-family': 'Consolas, monospace',
                    fill: 'white',
                },
                '.label': {
                    text: 'Register',
                    ref: 'rect',
                    'ref-y': 0.1,
                    'ref-x': 0.5,
                    'x-alignment': 'middle'
                },
                '.value': {
                    text: '0000000000000000',
                    ref: 'rect',
                    'ref-y': 0.5,
                    'ref-x': 0.5,
                    'x-alignment': 'middle'
                }
            },
            size: { width: 145, height: 40 }
        }, joint.shapes.basic.Rect.prototype.defaults)
    })
};

})();
