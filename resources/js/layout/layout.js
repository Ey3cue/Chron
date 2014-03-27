
var Layout = {};
var MainTabs = {};

(function () {


var _darkColors = ['#14181B', '#203340', '#47646D'];

Layout.init = function () {
    MainContents.init();
    MainContents.add(COMPILER_ID);
    MainContents.add(OS_ID);
    MainContents.add(CPU_ID);

    MainTabs.init();
    MainTabs.add('ChronOS.LL', 'The Compiler', COMPILER_ID);
    MainTabs.add('ChronOS', 'The Operating System', OS_ID);
    MainTabs.add('ChronIS.CPU', 'The Processor', CPU_ID);

    Layout.initScrollers();
    Layout.initTooltips();
    Layout.initCheckboxes();

    __resizeFunctions.windowScroll = function () {
        $('html').css('overflow-y', ($(window).height() > MIN_WINDOW_SIZE ? 'hidden' : 'scroll'));
    };

    $('body').css('opacity', 1);
};

Layout.initScrollers = function () {
    $('.scrollX').perfectScrollbar({
        suppressScrollY: true,
        wheelSpeed: 30
    });
    $('.scrollY').perfectScrollbar({
        suppressScrollX: true,
        wheelSpeed: 30
    });
    $('.scroll').perfectScrollbar({
        wheelSpeed: 30
    });
};

Layout.initTooltips = function () {
    $('[tooltip]').each(function (index, element) {
        var $element = $(element);
        $element.append('<div class="tooltip">' + $element.attr('tooltip') + '</div>');
    });
};

Layout.initCheckboxes = function () {
    $('div.checkboxText').each(function (index, element) {
        var $element = $(element);
        var id = $element.attr('id');
        var checked = $element.attr('checked') || '';
        var value = $element.attr('value');
        $element.removeAttr('id checked value')
                .append('<input type="checkbox" id="' + id + '" name="' + id + '" ' + checked + '>' +
                        '<label for="' + id + '">' + value + '</label>');
    });

    $('div.checkboxImage').each(function (index, element) {
        var $element = $(element);
        var id = $element.attr('id');
        var checked = $element.attr('checked') || '';
        var value = $element.attr('value');
        var buttonClass = $element.attr('buttonClass');
        $element.removeAttr('id checked value buttonClass')
                .append('<input type="checkbox" id="' + id + '" name="' + id + '" ' + checked + '>' +
                        '<label for="' + id + '" class="' + buttonClass + '"></label>');
    });
};


MainTabs = {
    $tabContainer: null,
    $selectedTab: null,
    tabs: {},
    tabCount: 0,
    activeId: null
};

MainTabs.init = function () {
    MainTabs.$tabContainer = $('<div class="chrMainTabs"></div>');
    $('body').append(MainTabs.$tabContainer[0]);
};

MainTabs.add = function (title, description, id) {
    var $tab = $(
        '<div class="chrMainTab">' +
            '<div class="chrMainTabTitleContainer">' +
                '<div class="chrMainTabTitle">' + title + '</div>' +
                '<div class="chrMainTabSeparator"></div>' +
                '<div class="chrMainTabDescription">' + description + '</div>' +
            '</div>' +
        '</div>'
    );

    $tab.click(id, MainTabs.select);

    $tab.addClass(MainTabs.tabCount === 0 ? 'chrMainTabLeft' : (MainTabs.tabCount === 1 ? 'chrMainTabMiddle' : 'chrMainTabRight'));

    MainTabs.$tabContainer.append($tab);
    MainTabs.tabs[id] = $tab;
    MainTabs.tabCount++;
};

MainTabs.triggerSelect = function (id) {
    if (MainTabs.tabs[id]) {
        MainTabs.tabs[id].trigger('click');
    }
};

MainTabs.select = function (event) {
    var id = event.data;
    MainTabs.activeId = id;

    // Check if already selected
    if (MainTabs.$selectedTab === MainTabs.tabs[id] || !MainTabs.tabs[id]) {
        return;
    }

    if (MainTabs.$selectedTab) {
        MainTabs.$selectedTab.removeClass('chrMainTabActive');
        MainContents.$selectedContainer.removeClass('contentContainerVisible');
    } else {
        MainTabs.$tabContainer.addClass('chrMainTabsCollapsed');
    }

    MainTabs.$selectedTab = MainTabs.tabs[id];
    MainTabs.$selectedTab.addClass('chrMainTabActive');
    MainContents.$selectedContainer = MainContents.containers[id];
    MainContents.$selectedContainer.addClass('contentContainerVisible');

    if (!MainTabs.$selectedTab.hasClass('chrMainTabMiddle')) {
        if (MainTabs.$selectedTab.hasClass('chrMainTabLeft')) {
            $('.chrMainTabMiddle').addClass('chrMainTabLeft').removeClass('chrMainTabMiddle');
            MainTabs.$selectedTab.addClass('chrMainTabMiddle').removeClass('chrMainTabLeft');
        } else /* .chrMainTabRight */ {
            $('.chrMainTabMiddle').addClass('chrMainTabRight').removeClass('chrMainTabMiddle');
            MainTabs.$selectedTab.addClass('chrMainTabMiddle').removeClass('chrMainTabRight');
        }
    }

    if (id === 'os') {
        OS.Control.activate();
    }
};


var MainContents = {
    $selectedContainer: null,
    containers: {}
};

MainContents.init = function () {

};

MainContents.add = function (id) {
    var $contentContainer = $(
        '<div class="contentContainer">' +
            '<div id="' + id + '" class="mainContent"></div>' +
        '</div>'
    );

    MainContents.containers[id] = $contentContainer;

    $('#' + id, $contentContainer).html($('#' + id).html());
    $('#' + id).remove();
    $('body').append($contentContainer);
};

})();
