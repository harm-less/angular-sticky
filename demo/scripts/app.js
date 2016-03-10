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

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				templateUrl: 'views/home.html',
				controller: 'HomeController'
			})
			.state('demo-container', {
				abstract: true,
				templateUrl: 'views/demo.html',
				controller: 'DemoCtrl'
			})
			.state('demo-container.demo', {
				url: '/demo/:name',
				templateUrl: function (stateParams) {
					return 'views/demos/' + stateParams.name + '.html';
				},
				controller: function($rootScope, $stateParams) {
					$rootScope.demoName = $stateParams.name;
				}
			})
			.state('about', {
				url: '/about',
				templateUrl: 'views/about.html',
				controller: 'AboutController'
			});
	})

	.config(['$controllerProvider', function($controllerProvider) {
		$controllerProvider.allowGlobals();
	}])

	.controller('HomeController', function($scope) {

	})

	.controller('DemoCtrl', function($rootScope, $scope, $sce, $stateParams, $savedContent) {
		$scope.hasContent = function(content) {
			return $savedContent[content];
		};

		$rootScope.$watch('demoName', function(newName) {
			$scope.demoName = newName;
		});
		$scope.$on('$stateChangeSuccess', function() {
			console.log($savedContent);
			$scope.content = {};
			angular.forEach($savedContent, function(content, contentName) {
				console.log(content, contentName);
				$scope.content[contentName] = $sce.trustAsHtml(content);
			});
		});
	})

	.controller('AboutController', function($scope) {

	})

	.filter('firstToUpperCase', function(s) {
		return function(str) {
			return s.firstToUpperCase(str);
		};
	})


	.factory("$savedContent", function() {
		return {};
	})
	.directive("saveContent", function($savedContent) {
		return {
			restrict: "A",
			compile: function($element, $attrs) {
				$savedContent[$attrs.saveContent] = $element.html();
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
					if (lang == "html") {
						content = escapeHtml(content);
					}
					content = trimIndent(content);
					var pre = prettyPrintOne(content, lang);
					$element.html(pre);
				}
			}
		}
	});