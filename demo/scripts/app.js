var entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};
function escapeHtml(string) {
	return String(string).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
	});
}
var nonSpace = /\S/;
function trimIndent(content) {
	var lines = content.split("\n");
	var begin = 0;
	var end = lines.length-1;
	while ((nonSpace.exec(lines[begin]) == null) && (begin < lines.length))
		begin = begin + 1;
	while ((nonSpace.exec(lines[end]) == null) && end >= begin)
		end = end - 1;
	var ident = nonSpace.exec(lines[begin]).index;
	var formatted = "";
	for (var i = begin; i <= end; i++) {
		formatted = formatted + lines[i].slice(ident-1) + ((i < end)?"\n":"");
	}
	return formatted.replaceAll('\t', '&nbsp;&nbsp;');
}

String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};




var demo = angular.module('demo', [
	'ui.router',
	'ui.bootstrap',

	'demo.utils.strings',

	'hl-sticky'
])

	.config(function($stateProvider, $urlRouterProvider){

		$urlRouterProvider.otherwise("/");

		$stateProvider
			.state('demo', {
				url: '/demo/:name',
				templateUrl: function (stateParams) {
					return '/demo/demos/' + stateParams.name + '.html';
				}
			});
	})

	.config(['$controllerProvider', function($controllerProvider) {
		$controllerProvider.allowGlobals();
	}])


	.factory("$savedContent", function() {
		return [];
	})
	.directive("saveContent", function($savedContent) {
		return {
			restrict: "A",
			compile: function($element, $attrs) {
				var content = $element.html();
				$savedContent[$attrs.saveContent] = content;
			}
		}
	})
	.directive("applyContent", function($savedContent) {
		return {
			restrict: "EAC",
			compile: function($element, $attrs) {
				return function($scope, $element, $attrs) {
					var content = $savedContent[$attrs.applyContent];
					var lang = $attrs.highlightLang;
					if (lang == "html")
						content = escapeHtml(content);
					content = trimIndent(content);
					var pre = prettyPrintOne(content, lang);
					$element.html(pre);
				}
			}
		}
	});