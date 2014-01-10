
var Layout = {};

(function () {

var _darkColors = ['#14181B', '#203340', '#47646D'];

Layout.init = function () {
	
};






function initChrMainTabs() {
	$('.chrMainTabs').each(function (index, tabSet) {
		var $tabs = $('div', tabSet);
		var width = 100 / $tabs.length;

		$tabs.each(function (index, tab) {
			var $tab = $(tab);
			$tab.css({
				'width': width + '%',
				'background-color': _darkColors[index % _darkColors.length]
			});

			var text = $tab.html();
			$tab.html('<div>' + text + '</div>');
		});

	});
}

})();