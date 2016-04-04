angular.module('demo.directive.scroll-along', [])

	.directive('hlScrollAlong', function($window) {
		return {
			restrict: 'EA',
			transclude: true,
			replace: true,
			template: '<div class="scroll-along-container"><div class="content" ng-transclude></div></div>',
			link: function(scope, element, attrs) {

				var nativeEl = angular.element(element[0]);
				var container = angular.element(nativeEl.parent())[0];

				angular.element($window).bind('scroll', render);
				angular.element($window).bind('mousemove', render);

				var clientY;
				function render(event) {
					if (angular.isDefined(event.clientY)) {
						clientY = event.clientY;
					}
					var normalised = clientY - _getTopOffset(container);
					nativeEl.css('top', Math.max(0, normalised + window.pageYOffset));
					scope.$apply();
				}

				function _getTopOffset(element) {
					var pixels = 0;
					if (element && element.offsetParent) {
						do {
							pixels += element.offsetTop;
							element = element.offsetParent;
						} while (element);
					}
					return pixels;
				}
			}
		};
	});