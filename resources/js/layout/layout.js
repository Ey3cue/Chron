
var Layout = {};

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

    if (URL_PARAMETERS.start) {
        MainTabs.select({ data: URL_PARAMETERS.start });
    }

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


var MainTabs = {
    $tabContainer: null,
    $selectedTab: null,
    tabs: {},
    tabCount: 0
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

MainTabs.select = function (event) {
    var id = event.data;

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