
var Scrollers = {};

(function () {

var HSCROLLBAR_CODE = '<div class="hscrollbar"></div>';
var VSCROLLBAR_CODE = '<div class="vscrollbar"></div>';

var _scrollers = {};

Scrollers.init = function () {
    // try {
        $('.scrollY').each(function () {
            new Scroller($(this));
        });
    // } catch (e) {
    //    if (e !== 'scroll-error') {
    //        throw e;
    //    }
    // }
};

Scrollers.update = function (id) {
    if (id instanceof jQuery) {
        id = id.attr('id');
    }

    var scroller = _scrollers[id];
    if (scroller) {
        scroller.update();
    } else {
        console.warn('Tried to update nonexistent scroller: ' + id);
    }
};

function initYScroll(index, element) {
    var $container = $(element);
    var $content = getContentDiv($container);


    var $scrollbar = $(VSCROLLBAR_CODE);
    $container.append($scrollbar);


}

function Scroller($container) {
    this.$container = $container;
    this.$content = getContentDiv($container);

    // Start hidden
    this.$vscrollbar = $(VSCROLLBAR_CODE).hide();
    this.$hscrollbar = $(HSCROLLBAR_CODE).hide();

    this.vhidden = true;
    this.hhidden = true;

    this.$container.append(this.$vscrollbar);
    this.$container.append(this.$hscrollbar);

    _scrollers[this.$container.attr('id')] = this;
    _scrollers[this.$content.attr('id')] = this;
}

Scroller.prototype.update = function () {
    if (this.vhidden) {
        if (this.$content.height() > this.$container.height()) {
            this.$vscrollbar.show();
            this.vhidden = false;
        }
    }

    if (!this.vhidden) {

    }
};


function getContentDiv($container) {
    var $content = $('> div', $container);

    if ($content.length !== 1) {
        console.warn('Unable to initialize scrollbar. Content selector returned ' +
                $content.length + ' elements: ' + $content);
        throw 'scroll-error';
    }

    return $content;
}

})();
