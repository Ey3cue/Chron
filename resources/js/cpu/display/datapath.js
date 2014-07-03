
CPU.DatapathDisplay = {};

(function () {

var _$display;

var _paper;

var _components;
var _links;

var DEFAULT_SHAPE_ATTRS = {
    'stroke': '#E0E0E0',
    'stroke-width': 2
};

var DEFAULT_TEXT_ATTRS = {
    'text-anchor': 'middle',
    'fill': '#E0E0E0',
    'font-family': 'Consolas, monospace',
    'font-size': 15
};

CPU.DatapathDisplay.init = function () {
    _$display = $('#cpuDatapath');

    _paper = new Raphael(_$display[0], _$display.width(), _$display.height());
    _components = {};
    _links = {};

    var linkPoint1;
    var linkPoint2;

    _components.pc = new Shapes.Register16('PC', 100, 200);
    _components.pcOne = _paper.text(225, 275, '+1').attr(DEFAULT_TEXT_ATTRS).attr('font-size', 20);
    _components.pcIncrement = new Shapes.Alu('Add', 150, 325);
    _components.pcAdd = new Shapes.Alu('Add', 75, 400, 90);
    _components.fetchMagic = _paper.text(338, 75, '...').attr(DEFAULT_TEXT_ATTRS).attr('font-size', 20);
    _components.irNext = new Shapes.Register8('IR_next', 300, 125);
    _components.ir = new Shapes.Register8('IR', 300, 200);


    _links.pcOne_pcIncrement = _paper.path('M 225 290 l 0 35 ' + Shapes.ArrowPath.down).attr(DEFAULT_SHAPE_ATTRS);
    _links.pc_pcIncrement = _paper.path('M ' + _components.pc.linkPoint('b').path() + ' L ' + _components.pcIncrement.linkPoint('inL').path() + ' ' + Shapes.ArrowPath.down).attr(DEFAULT_SHAPE_ATTRS);
    _links.pcIncrement_pcAdd = _paper.path('M ' + _components.pcIncrement.linkPoint('out').path() + ' l 0 28 l -59 0 ' + Shapes.ArrowPath.left).attr(DEFAULT_SHAPE_ATTRS);
    _links.pcAdd_pc = _paper.path('M 105 415 l -45 0 l 0 -194 l 40 0 ' + Shapes.ArrowPath.right).attr(DEFAULT_SHAPE_ATTRS);
    _links.pc_fetchMagic = _paper.path('M ' + _components.pc.linkPoint('t').path() + ' l 0 -95 l 130 0 ' + Shapes.ArrowPath.right).attr(DEFAULT_SHAPE_ATTRS);
    _links.fetchMagic_irNext = _paper.path('M 338 120 L ' + _components.irNext.linkPoint('t').path() + ' ' + Shapes.ArrowPath.down).attr(DEFAULT_SHAPE_ATTRS);
    _links.irNext_ir = _paper.path('M ' + _components.irNext.linkPoint('b').path() + ' L ' + _components.ir.linkPoint('t').path() + ' ' + Shapes.ArrowPath.down).attr(DEFAULT_SHAPE_ATTRS);

    window._components = _components;
    window._paper = _paper;
};

var Shapes = {};

var HEIGHT = 42;
var WIDTH_8 = 75;
var WIDTH_16 = 140;

Shapes.Register8 = function (label, x, y) {
    this.x = x;
    this.y = y;
    this.height = HEIGHT;
    this.width = WIDTH_8;

    this.shape = _paper.rect(x, y, WIDTH_8, HEIGHT, 5).attr(DEFAULT_SHAPE_ATTRS);

    var midX = x + WIDTH_8 * 0.5;

    this.label = _paper.text(midX, y + 12, label).attr(DEFAULT_TEXT_ATTRS);
    this.value = _paper.text(midX, y + 30, '00000000').attr(DEFAULT_TEXT_ATTRS);
};

Shapes.Register16 = function (label, x, y) {
    this.x = x;
    this.y = y;
    this.height = HEIGHT;
    this.width = WIDTH_16;

    this.shape = _paper.rect(x, y, WIDTH_16, HEIGHT, 5).attr(DEFAULT_SHAPE_ATTRS);

    var midX = x + WIDTH_16 * 0.5;

    this.label = _paper.text(midX, y + 12, label).attr(DEFAULT_TEXT_ATTRS);
    this.value = _paper.text(midX, y + 30, '0000000000000000').attr(DEFAULT_TEXT_ATTRS);
};

Shapes.Register16.prototype.linkPoint =
Shapes.Register8.prototype.linkPoint = function (place) {
    switch (place[0].toLowerCase()) {
    case 't': return new Point(this.x + this.width * 0.5, this.y);
    case 'r': return new Point(this.x + this.width, this.y + this.height * 0.5);
    case 'b': return new Point(this.x + this.width * 0.5, this.y + this.height);
    case 'l': return new Point(this.x, this.y + this.height * 0.5);
    }
    throw 'Illegal place.';
};

Shapes.Alu = function (label, x, y, rotation) {
    this.x = x;
    this.y = y;

    this.shape = _paper.path('M ' + x + ' ' + y + ' l 35 0 l 10 10 l 10 -10 l 35 0 l -30 30 l -30 0 l -30 -30').attr(DEFAULT_SHAPE_ATTRS);
    this.label = _paper.text(x + 40, y + 19, label).attr(DEFAULT_TEXT_ATTRS).attr('font-size', 13);

    if (rotation) {
        this.shape.rotate(rotation);
        this.label.rotate(rotation);
    }
};

Shapes.Alu.prototype.linkPoint = function (place) {
    switch (place) {
    case 'inL': return new Point(this.x + 20, this.y);
    case 'inR': return new Point(this.x + 60, this.y);
    case 'out': return new Point(this.x + 45, this.y + 30);
    }
    throw 'Illegal place.';
};

Shapes.ArrowPath = {
    up:    'm 0 1 l -3 5 l 6 0 l -3 -5',
    right: 'm -1 0 l -5 -3 l 0 6 l 5 -3',
    down:  'm 0 -1 l 3 -5 l -6 0 l 3 5',
    left:  'm 1 0 l 5 3 l 0 -6 l -5 3'
};

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype.path = function () {
    return this.x + ' ' + this.y;
};

})();
