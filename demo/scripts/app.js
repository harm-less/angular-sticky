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
	'demo.utils.dom',
	'demo.directive.scroll-along',

	'hl.sticky'
])

	.config(function($stateProvider, $urlRouterProvider){
		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('root',{
				abstract: true,
				url: '',
				views: {
					'@': {
						templateUrl: 'views/layout.html',
						controller: 'RootController'
					},
					'header@root': {
						templateUrl: 'views/header.html'
					},
					'footer@root':{
						templateUrl: 'views/footer.html'
					}
				}
			})
			.state('root.home', {
				url: '/',
				views: {
					'content@root': {
						templateUrl: 'views/getting-started.html',
						controller: 'HomeController'
					}
				}
			})
			.state('root.api', {
				abstract: true,
				url: '/api',
				views: {
					'content@root': {
						templateUrl: 'views/api/page.html'
					}
				}
			})
			.state('root.api.directive', {
				url: '/directive/:name',
				templateUrl: function (stateParams) {
					return 'views/api/directives/' + stateParams.name + '.html';
				}
			})
			.state('root.api.service', {
				url: '/service/:name',
				templateUrl: function (stateParams) {
					return 'views/api/services/' + stateParams.name + '.html';
				}
			})
			.state('root.demo-container', {
				abstract: true,
				views: {
					'content@root': {
						templateUrl: 'views/demo.html',
						controller: 'DemoCtrl'
					}
				}
			})
			.state('root.demo-container.demo', {
				url: '/demo/:name',
				templateUrl: function (stateParams) {
					return 'views/demos/' + stateParams.name + '.html';
				},
				controller: function($rootScope, $stateParams) {
					$rootScope.demoName = $stateParams.name;
				}
			})
			.state('root.about', {
				url: '/about',
				views: {
					'content@root': {
						templateUrl: 'views/about.html',
						controller: 'AboutController'
					}
				}
			});
	})

	.config(['$controllerProvider', function($controllerProvider) {
		// for the demo, I need to be able to create global methods
		$controllerProvider.allowGlobals();
	}])

	.controller('RootController', function($rootScope, $document) {
		$rootScope.$on('$stateChangeSuccess', function() {
			$document[0].body.scrollTop = $document[0].documentElement.scrollTop = 0;
		});
	})

	.controller('HomeController', function($scope) {
	})

	.controller('DemoCtrl', function($rootScope, $scope, $sce, $timeout, $stateParams, $savedContent) {
		var demoMarkup = ['intro', 'html', 'js', 'css'];

		$scope.content = {};

		$scope.hasContent = function(content) {
			return $scope.content[content];
		};

		$rootScope.$watch('demoName', function(newName) {
			$scope.demoName = newName;
		});
		$scope.$on('$stateChangeStart', function() {
			// reset the content markup elements used for the demos
			angular.forEach(demoMarkup, function(markupContent) {
				$savedContent[markupContent] = null;
			});
		});

		$scope.$on('$stateChangeSuccess', function() {
			$timeout(function() {
				// reload content markup for the new demo
				angular.forEach($savedContent, function(content, contentName) {
					$scope.content[contentName] = $sce.trustAsHtml(content);
				});
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
				var beforeCompile = $element.html();

				return function($scope, $element, $attrs) {

					function apply() {

						var content = $savedContent[$attrs.applyContent];
						if (!content) {
							// use the un-compiled content of the element itself
							content = beforeCompile;
						}
						var lang = $attrs.highlightLang;
						if (lang == "html") {
							content = escapeHtml(content);
						}
						content = trimIndent(content);
						var pre = prettyPrintOne(content, lang);
						$element.html(pre);
					}
					
					if (angular.isDefined($attrs.contentWatch)) {
						$scope.$watch(apply);
					}
					else {
						apply();
					}
				}
			}
		}
	})

	.directive('scrollTo', function ($log, offset) {
		return {
			restrict: 'A',
			priority: 100,
			link: function (scope, element, attrs) {

				if (!angular.isDefined(attrs.scrollTo) && attrs.scrollTo !== '') {
					$log.error('Directive "scroll-to" must have a value. E.g.: scroll-to="element-id"');
				}
				var gotoElement = null;

				$(element).mousedown(function () {
					scope.$apply(function () {
						if (!gotoElement) {
							gotoElement = document.getElementById(attrs.scrollTo);

							if (gotoElement === null) {
								$log.warn('Element with id "' + attrs.scrollTo + '" does not exist');
							}
						}
						offset.scrollToElement(gotoElement);
					});
				});

				scope.$on('$destroy', function() {
					gotoElement = null;
				});
			}
		};
	});