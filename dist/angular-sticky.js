/*
 * angular-sticky-plugin
 * https://github.com/harm-less/angular-sticky

 * Version: 0.4.2 - 2017-11-01
 * License: MIT
 */
'use strict';

angular.module('hl.sticky', [])
	.constant('DefaultStickyStackName', 'default-stack')

	// 1039 should be above all Bootstrap's z-indexes (but just before the modals)
	.constant('DefaultStickyStackZIndex', 1039)

	.factory('mediaQuery', function () {
		return {
			matches: function (query) {
				return (query && (matchMedia('(' + query + ')').matches || matchMedia(query).matches));
			}
		};
	})

	.factory('hlStickyStack', ["$document", "DefaultStickyStackName", function ($document, DefaultStickyStackName) {

		var documentEl = $document[0].documentElement;

		var stacks = {};

		function stickyStack(options) {

			options = options || {};

			var stackName = options.name || DefaultStickyStackName;

			// use existing sticky stack
			if (stacks[stackName]) {
				return stacks[stackName];
			}

			// should be above all Bootstrap's z-indexes (but just before the modals)
			var stickyZIndex = options.zIndex;
			var stack = [];

			var $stack = {};

			$stack.options = options;
			$stack.stackName = stackName;

			$stack.add = function (id, sticky) {
				if (!angular.isString(id) || id === '') {
					id = $stack.length();
				}
				sticky.id = id;
				sticky.zIndex = stickyZIndex;
				stack.push(sticky);

				stickyZIndex -= 1;
				return sticky;
			};
			$stack.get = function (id) {
				for (var i = 0; i < stack.length; i++) {
					if (id == stack[i].id) { // jshint ignore:line
						return stack[i];
					}
				}
				return false;
			};
			$stack.index = function (id) {
				for (var i = 0; i < stack.length; i++) {
					if (id == stack[i].id) { // jshint ignore:line
						return i;
					}
				}
				return -1;
			};
			$stack.range = function (start, end) {
				return stack.slice(start, end);
			};
			$stack.all = function () {
				return stack;
			};
			$stack.keys = function () {
				var ids = [];
				for (var i = 0; i < stack.length; i++) {
					ids.push(stack[i].id);
				}
				return ids;
			};
			$stack.top = function () {
				return stack[stack.length - 1];
			};
			$stack.remove = function (id) {
				for (var i = 0; i < stack.length; i++) {
					if (id == stack[i].id) { // jshint ignore:line
						stickyZIndex += 1;
						return stack.splice(i, 1)[0];
					}
				}
				return false;
			};
			$stack.removeTop = function () {
				stickyZIndex += 1;
				return stack.splice(stack.length - 1, 1)[0];
			};
			$stack.length = function () {
				return stack.length;
			};

			$stack.height = function (anchor) {
				var height = {
					top: 0,
					bottom: 0
				};
				angular.forEach(stack, function(item) {
					height[item.anchor()] += item.computedHeight(anchor);
				});
				return height[anchor];
			};
			$stack.heightAt = function (anchor, at) {
				var atAdjusted = at - 1;
				var stick;
				var computedHeight;
				var height = {
					top: 0,
					bottom: 0
				};
				for (var i = 0; i < stack.length; i++) {
					stick = stack[i];
					// check if the sticky element sticks at the queried position minus 1 pixel if the position is at the same place
					if (stick.sticksAtPosition(anchor, atAdjusted)) {
						var stickyAnchor = stick.anchor();
						computedHeight = stick.computedHeight(anchor, atAdjusted - height[stickyAnchor]);

						// add the height of the sticky element to the total
						height[stickyAnchor] += computedHeight;
					}
				}
				return height[anchor];
			};
			$stack.heightCurrent = function (anchor) {
				return $stack.heightAt(anchor, window.pageYOffset || documentEl.scrollTop);
			};

			stacks[stackName] = $stack;

			return $stack;
		}

		return stickyStack;
	}])

	.factory('hlStickyElement', ["$document", "$log", "hlStickyStack", "throttle", "mediaQuery", function($document, $log, hlStickyStack, throttle, mediaQuery) {
		return function(element, options) {
			options = options || {};

			var stickyLineTop;
			var stickyLineBottom;
			var placeholder;

			var _isSticking = false;

			// elements
			var bodyEl = $document[0].body;
			var nativeEl = element[0];
			var documentEl = $document[0].documentElement;

			// attributes
			var id = options.id || null;
			var stickyMediaQuery = angular.isDefined(options.mediaQuery) ? options.mediaQuery : false;
			var stickyClass = angular.isString(options.stickyClass) && options.stickyClass !== '' ? options.stickyClass : 'is-sticky';
			var usePlaceholder = angular.isDefined(options.usePlaceholder) ? options.usePlaceholder : true;
			var offsetTop = options.offsetTop ? parseInt(options.offsetTop) : 0;
			var offsetBottom = options.offsetBottom ? parseInt(options.offsetBottom) : 0;
			var anchor = typeof options.anchor === 'string' ? options.anchor.toLowerCase().trim() : 'top';
			var container = null;
			var stack = options.stack === false ? null : options.stack || hlStickyStack();

			var event = angular.isFunction(options.event) ? options.event : angular.noop;
			var globalOffset = {
				top: 0,
				bottom: 0
			};

			// initial style
			var initialCSS = {
				style: element.attr('style') || ''
			};

			// Methods
			//
			function stickyLinePositionTop() {
				if (_isSticking) {
					return stickyLineTop;
				}
				stickyLineTop = _getTopOffset(nativeEl) - offsetTop - _stackOffsetTop();
				return stickyLineTop;
			}
			function stickyLinePositionBottom() {
				if (_isSticking) {
					return stickyLineBottom;
				}
				stickyLineBottom = _getBottomOffset(nativeEl) + offsetBottom + _stackOffsetBottom();
				return stickyLineBottom;
			}
			function isEnabled() {
				return (!angular.isDefined(options.enable) || options.enable);
			}
			function isSticky() {
				return (isEnabled() && _isSticking) || options.alwaysSticky;
			}
			function sticksAtPosition(anchor, scrolledDistance) {
				if (!matchesMediaQuery()) {
					return false;
				}
				switch (anchor) {
					case 'top':	{
						return sticksAtPositionTop(scrolledDistance);
					}
					case 'bottom': {
						return sticksAtPositionBottom(scrolledDistance);
					}
					default: {
						$log.error('Unknown anchor "' + anchor + '"');
						break;
					}
				}
				return false;
			}
			function sticksAtPositionTop(scrolledDistance) {
				scrolledDistance = scrolledDistance !== undefined ? scrolledDistance : window.pageYOffset || bodyEl.scrollTop;
				var scrollTop = scrolledDistance - (documentEl.clientTop || 0);
				return scrollTop >= stickyLinePositionTop();
			}
			function sticksAtPositionBottom(scrolledDistance) {
				scrolledDistance = scrolledDistance !== undefined ? scrolledDistance : (window.pageYOffset || bodyEl.scrollTop);
				var scrollBottom = scrolledDistance + window.innerHeight;
				return scrollBottom <= stickyLinePositionBottom();
			}
			function matchesMediaQuery() {
				return stickyMediaQuery === false || mediaQuery.matches(stickyMediaQuery);
			}

			function render() {
				var shouldStick = sticksAtPosition(anchor);

				if (angular.isDefined(options.enable) && !options.enable) {
					shouldStick = false;
				}

				if (angular.isDefined(options.alwaysSticky) && options.alwaysSticky) {
					shouldStick = true;
				}

				// Switch the sticky mode if the element crosses the sticky line
				// don't make the element sticky when it's already sticky
				if (shouldStick && !_isSticking) {
					stickElement();
					event({event: 'stick'});
				}
				// don't unstick the element sticky when it isn't sticky already
				else if (!shouldStick && _isSticking) {
					unstickElement();
					event({event: 'unstick'});
				}

				// stick after care
				if (_isSticking) {
					// update the top offset at an already sticking element
					if (anchor === 'top') {
						element.css('top', (offsetTop + _stackOffset(anchor) - containerBoundsBottom()) + 'px');
					}
					else if (anchor === 'bottom') {
						element.css('bottom', (offsetBottom + _stackOffset(anchor) - containerBoundsTop()) + 'px');
					}
					element.css('width', elementWidth() + 'px');
				}
			}

			function stickElement() {
				_isSticking = true;

				element.addClass(stickyClass);

				// create placeholder to avoid jump
				if (usePlaceholder) {
					placeholder = placeholder || angular.element('<div>');
					placeholder.css('height', elementHeight() + 'px');
					element.after(placeholder);
				}

				var rect = nativeEl.getBoundingClientRect();
				var css = {
					'width': elementWidth() + 'px',
					'position': 'fixed',
					'left': rect.left + 'px',
					'z-index': stack ? stack.get(id).zIndex - (globalOffset.zIndex || 0) : null
				};

				css['margin-' + anchor] = 0;
				element.css(css);
			}
			function unstickElement() {
				_isSticking = false;

				element.removeClass(stickyClass);

				// reset the original css we might have changed when the object was sticky
				element.attr('style', initialCSS.style);

				// if a placeholder was used, remove it from the DOM
				if (placeholder) {
					placeholder.remove();
				}
			}

			function elementWidth() {
				return nativeEl.offsetWidth;
			}
			function elementHeight() {
				return nativeEl.offsetHeight;
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

			function _getBottomOffset (element) {
				return _getTopOffset(element) + element.clientHeight;
			}

			function _stackOffset(anchor) {
				var extraOffset = 0;

				if (anchor === 'top' && globalOffset.top > 0) {
					extraOffset += globalOffset.top;
				}
				if (anchor === 'bottom' && globalOffset.bottom > 0) {
					extraOffset += globalOffset.bottom;
				}
				if (stack) {
					var stickIndex = stack.index(id);
					if (anchor === 'top') {
						if (stickIndex > 0) {
							// @todo the stack range calculation should be diverted to the stack
							stack.range(0, stickIndex).forEach(function (stick) {
								if (stick.isSticky()) {
									extraOffset += stick.computedHeight(anchor);
								}
							});
						}
					}
					if (anchor === 'bottom') {
						if (stickIndex !== stack.length() - 1) {
							// @todo the stack range calculation should be diverted to the stack
							stack.range(stickIndex + 1, stack.length()).forEach(function (stick) {
								if (stick.isSticky()) {
									extraOffset += stick.computedHeight(anchor);
								}
							});
						}
					}
				}
				return extraOffset;
			}
			function _stackOffsetTop() { return _stackOffset('top'); }
			function _stackOffsetBottom() { return _stackOffset('bottom'); }

			function computedHeight(anchor, scrolledDistance) {
				if (anchor === 'top') {
					return Math.max(0, elementHeight() - containerBoundsBottom(scrolledDistance) + offsetTop);
				}
				else if (anchor === 'bottom') {
					return Math.max(0, elementHeight() - containerBoundsTop(scrolledDistance) + offsetBottom);
				}
				return 0;
			}

			// @todo dffgdg
			function containerBoundsTop(scrolledDistance) {
				if (container === null) {
					container = options.container !== undefined ? angular.isString(options.container) ? angular.element(documentEl.querySelector('#' + options.container))[0] : options.container : false;
				}
				if (container) {
					var hasScrollDistance = !(scrolledDistance === null || scrolledDistance === undefined);
					var containerRect = container.getBoundingClientRect();
					var containerBottom = !hasScrollDistance ? containerRect.top - window.innerHeight + elementHeight() : (_getTopOffset(container) + containerRect.height) - scrolledDistance;
					return Math.max(0, containerBottom - (offsetTop + _stackOffset(anchor)));
				}
				return 0;
			}
			function containerBoundsBottom(scrolledDistance) {
				if (container === null) {
					container = options.container !== undefined ? angular.isString(options.container) ? angular.element(documentEl.querySelector('#' + options.container))[0] : options.container : false;
				}
				if (container) {
					var hasScrollDistance = !(scrolledDistance === null || scrolledDistance === undefined);
					var containerRect = container.getBoundingClientRect();
					var containerBottom = !hasScrollDistance ? containerRect.bottom : (_getTopOffset(container) + containerRect.height) - scrolledDistance;
					return Math.max(0, (offsetTop + _stackOffset(anchor) + elementHeight()) - containerBottom);
				}
				return 0;
			}

			var $api = {};

			if (stack) {
				// add element to the sticky stack and save the id
				var stackItem = stack.add(id, $api);
				id = stackItem.id;
			}

			$api.draw = function(drawOptions) {
				drawOptions = drawOptions || {};
				var offset = drawOptions.offset;
				if (offset) {
					// setting global offsets added to the local offsets of the sticky element
					globalOffset.top = offset.top || 0;
					globalOffset.bottom = offset.bottom || 0;
					globalOffset.zIndex = offset.zIndex;
				}

				// for resizing or other purposes that require a forced re-draw, we simply un-stick the element and re-stick it using the render method
				if (drawOptions.force === true) {
					unstickElement();
				}
				render();
			};

			$api.anchor = function() {
				return anchor;
			};

			$api.isSticky = isSticky;
			$api.isEnabled = isEnabled;
			$api.computedHeight = computedHeight;
			$api.sticksAtPosition = sticksAtPosition;

			$api.destroy = function() {
				unstickElement();
				if (stack) {
					stack.remove(id);
				}
			};

			return $api;
		};
	}])

	.constant('DefaultStickyStackName', 'default-stack')

	.provider('hlStickyElementCollection', function() {

		var $$count = 0;

		var $stickyElement = {
			collections: {},
			defaults: {
				checkDelay: 250
			},
			elementsDefaults: {

			},
			$get: ["$rootScope", "$window", "$document", "$log", "DefaultStickyStackName", "hlStickyElement", "hlStickyStack", "throttle", function($rootScope, $window, $document, $log, DefaultStickyStackName, hlStickyElement, hlStickyStack, throttle) {

				var windowEl = angular.element($window);

				var unbindViewContentLoaded;
				var unbindIncludeContentLoaded;
				var throttledResize;

				function init() {
					$$count++;

					// make sure we can initialize it only once
					if ($$count > 1) {
						return;
					}

					// bind events
					throttledResize = throttle(resize, $stickyElement.defaults.checkDelay, {leading: false});
					windowEl.on('resize', throttledResize);
					windowEl.on('scroll', drawEvent);

					unbindViewContentLoaded = $rootScope.$on('$viewContentLoaded', throttledResize);
					unbindIncludeContentLoaded = $rootScope.$on('$includeContentLoaded', throttledResize);
					throttledResize();
				}

				function destroy() {
					// check internal references counter
					$$count--;
					if ($$count > 0) {
						return;
					}

					// unbind events
					windowEl.off('resize', throttledResize);
					windowEl.off('scroll', drawEvent);
					unbindViewContentLoaded();
					unbindIncludeContentLoaded();
				}

				function drawEvent() {
					draw();
				}
				function resize() {
					draw({force: true});
				}
				function draw(drawOptions) {
					angular.forEach($stickyElement.collections, function(collection) {
						collection.draw(drawOptions);
					});
				}

				function stickyElementFactory(options) {

					if (!options || !angular.isObject(options)) {
						$log.warn('Must supply an options object');
						options = {};
					}
					options = angular.extend({}, $stickyElement.elementsDefaults, options);

					var collectionName = options.name || DefaultStickyStackName;
					var zIndex = parseInt(options.zIndex, 10);

					// use existing element collection
					if ($stickyElement.collections[collectionName]) {
						return $stickyElement.collections[collectionName];
					}

					var stickyStackFactory = hlStickyStack({
						name: collectionName,
						zIndex: zIndex
					});

					var trackedElements = [];

					var $sticky = {};

					$sticky.addElement = function (element, stickyOptions) {
						stickyOptions = stickyOptions || {};
						stickyOptions.stack = stickyStackFactory;
						var sticky = hlStickyElement(element, stickyOptions);
						trackedElements.push({
							stickyElement: sticky,
							element: element
						});

						return sticky;
					};

					$sticky.removeElement = function(element) {

						var toDelete;
						for (var i = trackedElements.length; i--;) {
							if ((angular.isString(element) && '#' + trackedElements[i].element.id === element) || trackedElements[i].element === element) {
								toDelete = i;
								break;
							}
						}
						var deletedElement = trackedElements.splice(toDelete, 1)[0];
						if (deletedElement) {
							deletedElement.stickyElement.destroy();
						}

						return deletedElement;
					};

					$sticky.draw = function(drawOptions) {
						var _drawOptions = {};
						if (options.parent) {
							var parentStack = hlStickyStack({
								name: options.parent
							});
							_drawOptions.offset = {
								top: parentStack.heightCurrent('top'),
								zIndex: parentStack.length()
							};
						}
						angular.extend(_drawOptions, drawOptions || {});
						angular.forEach(trackedElements, function(element) {
							element.stickyElement.draw(_drawOptions);
						});
					};

					$sticky.destroy = function() {
						angular.forEach(angular.copy(trackedElements), function(element) {
							$sticky.removeElement(element);
						});
						delete $stickyElement.collections[collectionName];
						destroy();
					};

					$sticky.trackedElements = function() {
						return trackedElements;
					};

					// use new element collection
					$stickyElement.collections[collectionName] = $sticky;
					init();

					return $sticky;
				}
				return stickyElementFactory;
			}]
		};
		return $stickyElement;
	})

	.directive('hlSticky', ["$log", "$window", "$document", "DefaultStickyStackZIndex", "hlStickyElementCollection", function($log, $window, $document, DefaultStickyStackZIndex, hlStickyElementCollection) {
		return {
			restrict: 'A',
			scope: {
				container: '@',
				anchor: '@',
				stickyClass: '@',
				mediaQuery: '@',
				collection: '@',
				collectionParent: '@',
				event: '&',
				enable: '=',
				alwaysSticky: '='
			},
			link: function($scope, $element, $attrs) {
				$element.addClass('hl-sticky');

				var stickyElementCollection = hlStickyElementCollection({
					name: $scope.collection,
					parent: $scope.collectionParent,
					zIndex: $attrs.zIndex || DefaultStickyStackZIndex
				});
				var options = {
					id: $attrs.hlSticky,
					event: function(event) {
						$scope.event({
							event: event
						})
					}
				};
				angular.forEach(['anchor', 'container', 'stickyClass', 'mediaQuery', 'enable', 'alwaysSticky'], function(option) {
					if (angular.isDefined($scope[option])) {
						options[option] = $scope[option];
					}
				});
				angular.forEach(['usePlaceholder', 'offsetTop', 'offsetBottom'], function(option) {
					if (angular.isDefined($attrs[option])) {
						options[option] = $scope.$parent.$eval($attrs[option]);
					}
				});
				stickyElementCollection.addElement($element, options);

				// listeners
				$scope.$watch('enable', function (newValue, oldValue) {
					if (newValue !== oldValue) {
						options.enable = $scope.enable;
						stickyElementCollection.draw({force: true});
					}
				});
				$scope.$watch('alwaysSticky', function (newValue, oldValue) {
					if (newValue !== oldValue) {
						options.alwaysSticky = $scope.alwaysSticky;
						stickyElementCollection.draw({force: true});
					}
				});
				$scope.$on('$destroy', function onDestroy() {
					stickyElementCollection.removeElement($element);
					if (!stickyElementCollection.trackedElements().length) {
						stickyElementCollection.destroy();
					}
				});
			}
		};
	}])

	.factory('throttle', ["$timeout", function($timeout) {
		return function(func, wait, options) {
			var timeout = null;
			options = options || {};
			return function() {
				var that = this;
				var args = arguments;

				if (!timeout) {
					if (options.leading !== false) {
						func.apply(that, args);
					}
					timeout = $timeout(function later() {
						timeout = null;
						if (options.trailing !== false) {
							func.apply(that, args);
						}
					}, wait, false);
				}
			};
		};
	}]);
