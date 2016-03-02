'use strict';

describe('angular-sticky', function() {

	var $rootScope;
	var $compile;
	var $document;
	var $window;
	var $log;

	var body;
	var bodyNg;

	var hlStickyElementCollectionProvider;

	beforeEach(module('hl-sticky'));
	beforeEach(module(function (_hlStickyElementCollectionProvider_) {
		hlStickyElementCollectionProvider = _hlStickyElementCollectionProvider_;
	}));
	beforeEach(inject(function(_$rootScope_, _$compile_, _$document_, _$window_, _$log_) {
		$rootScope = _$rootScope_;
		$compile = _$compile_;
		$document = _$document_;
		$window = _$window_;
		$log = _$log_;
	}));

	beforeEach(function() {
		bodyNg = angular.element($document)[0];
		body = $document.find('body').eq(0);
		body.css({
			'margin-top': 0,
			'padding-top': 0
		});
	});

	afterEach(function() {
		// cleanup the body so it can be used without any trouble in any subsequent test
		body.html('');
	});

	beforeEach(function () {
		jasmine.addMatchers({
			toBeSticky: function () {
				return {
					compare: function (stickyElement, expected) {
						var result = {
							pass: stickyElement.hasClass('is-sticky')
						};
						if (result.pass) {
							result.message = 'Expected element to be sticky';
						}
						else {
							result.message = 'Expected element to be sticky but it isn\'t';
						}
						return result;
					}
				};
			},
			toBeInTheViewport: function () {
				return {
					compare: function (stickyElement, expected) {
						var boundingBox = stickyElement[0].getBoundingClientRect();
						var isInViewport = (boundingBox.top + boundingBox.height) > 0;

						var result = {
							pass: isInViewport
						};
						if (result.pass) {
							result.message = 'Expected element to be in the viewport';
						}
						else {
							result.message = 'Expected element to be in the viewport, but it isn\'t';
						}
						return result;
					}
				};
			}
		})
	});

	// create a scroll event that can be picked up by Chromium in Travis CI
	var scrollEvent = document.createEvent('CustomEvent');
	scrollEvent.initCustomEvent('scroll', false, false, null);

	/**
	 * Allows you to scroll the viewport to a certain position in pixels
	 * @param pixels number The amount of pixels you'd like the viewport to scroll
	 */
	function scrollTo(pixels) {
		var expectedLeft = 0;
		var expectedTop = pixels;

		$window.document.body.style.minHeight = '9000px';
		$window.document.body.style.minWidth = '9000px';
		$window.scrollTo(expectedLeft, expectedTop);
		$window.dispatchEvent(scrollEvent);
	}

	/**
	 * Compiles a HTML string into a DOM element by adding it to the body
	 * @param element string HTML string
	 * @param scope Supply a scope if you want
	 * @returns {IAugmentedJQuery|*}
	 */
	function compile(element, scope) {
		scope = scope ? scope : $rootScope.$new();
		var el = angular.element(element);
		body.append(el);
		$compile(el)(scope);
		scope.$digest();

		return el;
	}

	function objectSize(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	}

	var templateStickyElementOffsetSmall = '<div style="height: 50px;"></div><div id="sticky" style="height: 30px;"></div>';
	var templateStickyElementWithContainer = '<div style="height: 50px;"></div><div id="container" style="height: 100px"><div id="sticky" style="height: 20px;"></div></div>';
	var templateMultipleStickyElements = '<div><div id="before" style="height: 20px;">Before all the sticky bars</div><div id="sticky" style="height: 50px;">Sticky bar 1</div><div id="between" style="height: 20px;">Between all the sticky bars</div><div id="sticky2" style="height: 60px;">Sticky bar 2</div><div id="underneath">Underneath all the sticky bars</div></div>';

	describe('factory:hlStickyStack', function() {

		var hlStickyStack;

		beforeEach(inject(function(_hlStickyStack_) {
			hlStickyStack = _hlStickyStack_;
		}));

		it('passes the simplest directive usage', function () {
			var stack = hlStickyStack();
			expect(angular.isObject(stack)).toBeTruthy(true);
		});

		it('returns the same stack instance with the same name', function () {
			var stack1 = hlStickyStack();
			var stack2 = hlStickyStack();
			expect(stack1).toEqual(stack2);
		});

		it('can add to the stack and get them back', function () {
			var stack = hlStickyStack();

			var result = {
				id: 'test',
				hello: 'world',
				zIndex: 1039
			};
			expect(stack.add('test', {
				hello: 'world'
			})).toEqual(result);
			expect(stack.all()).toEqual([result]);

			expect(stack.get('test')).toEqual(result);
			expect(stack.get('unknown')).toBeFalsy();
		});

		it('returns from the stack by index', function () {
			var stack = hlStickyStack();
			stack.add('test1', {});
			stack.add('test2', {});
			expect(stack.index('test1')).toBe(0);
			expect(stack.index('test2')).toBe(1);

			stack.remove('test1');
			expect(stack.index('test2')).toBe(0);

			expect(stack.index('unknown')).toBe(-1);
		});

		it('returns from the stack in the range', function () {
			var stack = hlStickyStack();
			stack.add('test1', {});
			stack.add('test2', {});
			stack.add('test3', {});
			stack.add('test4', {});
			expect(stack.range(1,3)).toEqual([
				{
					id: 'test2',
					zIndex: 1038
				},
				{
					id: 'test3',
					zIndex: 1037
				}
			]);
		});

		it('returns all keys from a stack', function () {
			var stack = hlStickyStack();
			stack.add('test1', {});
			stack.add('test2', {});
			expect(stack.keys()).toEqual(['test1', 'test2']);
		});

		it('returns top item from a stack', function () {
			var stack = hlStickyStack();
			stack.add('test1', {});
			stack.add('test2', {});
			expect(stack.top()).toEqual({
				id: 'test2',
				zIndex: 1038
			});
		});

		it('returns top item from a stack', function () {
			var stack = hlStickyStack();
			stack.add('test1', {});
			stack.add('test2', {});
			expect(stack.remove('test1')).toEqual({
				id: 'test1',
				zIndex: 1039
			});
			expect(stack.all()).toEqual([
				{
					id: 'test2',
					zIndex: 1038
				}
			]);

			// remove unknown item
			expect(stack.remove('unknown')).toBeFalsy();

			// add another item and make sure the z-index has been upped by one again
			expect(stack.add('test3', {})).toEqual({
				id: 'test3',
				zIndex: 1038
			});
		});

		it('removes top item from a stack', function () {
			var stack = hlStickyStack();
			stack.add('test1', {});
			stack.add('test2', {});
			expect(stack.removeTop()).toEqual({
				id: 'test2',
				zIndex: 1038
			});
			expect(stack.all()).toEqual([
				{
					id: 'test1',
					zIndex: 1039
				}
			]);
		});

		it('gets the amount of items from a stack', function () {
			var stack = hlStickyStack();
			stack.add('test1', {});
			stack.add('test2', {});
			expect(stack.length()).toBe(2);

			stack.remove('test1');
			expect(stack.length()).toBe(1);
		});

		describe('calculate stack heights', function() {

			var el;
			beforeEach(function () {
				el = compile('<div><div id="before" style="height: 20px;">Before all the sticky bars</div><div hl-sticky style="height: 50px;">Sticky bar 1</div><div id="between" style="height: 20px;">Between all the sticky bars</div><div hl-sticky style="height: 60px;">Sticky bar 2</div><div id="underneath">Underneath all the sticky bars</div></div>');
			});

			it('calculate stack height at a certain position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.height('top')).toBe(110);
			});

			it('calculate stack height at a certain position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.totalHeightAt('top', 0)).toBe(0);
				expect(stack.totalHeightAt('top', 20)).toBe(0);
				expect(stack.totalHeightAt('top', 21)).toBe(50);
				expect(stack.totalHeightAt('top', 40)).toBe(50);
				expect(stack.totalHeightAt('top', 41)).toBe(110);
			});

			it('calculate stack height at current position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.totalHeightCurrent('top')).toBe(0);
				scrollTo(20);
				expect(stack.totalHeightCurrent('top')).toBe(0);
				scrollTo(21);
				expect(stack.totalHeightCurrent('top')).toBe(50);
				scrollTo(40);
				expect(stack.totalHeightCurrent('top')).toBe(50);
				scrollTo(41);
				expect(stack.totalHeightCurrent('top')).toBe(110);
			});
		});
	});

	describe('factory:hlStickyElement', function() {

		var hlStickyElement;

		var element;
		var stickyElement;
		var sticky;

		beforeEach(inject(function (_hlStickyElement_) {
			hlStickyElement = _hlStickyElement_;
		}));

		function compileSticky(html, options) {
			element = compile('<div>' + html + '</div>');
			stickyElement = element.find('#sticky');
			sticky = hlStickyElement(stickyElement, options);
		}

		function drawAt(position, hlSticky, drawOptions) {
			hlSticky = hlSticky ? hlSticky : sticky;
			scrollTo(position);
			hlSticky.draw(drawOptions);
		}

		describe('sticky top', function() {
			it('should return a hlStickyElement instance and make it sticky', function() {
				compileSticky(templateStickyElementOffsetSmall);

				var originalStyle = stickyElement.attr('style');

				// just before it get sticky
				drawAt(49);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement.next().length).toBe(0);
				expect(stickyElement).not.toBeSticky();

				// just at the point it gets sticky
				drawAt(50);
				expect(stickyElement.attr('style')).toEqual('height: 30px; width: 9000px; position: fixed; left: 8px; z-index: 1039; margin-top: 0px; top: 0px;');
				expect(stickyElement.next()[0].outerHTML).toBe('<div style="height: 30px;"></div>');
				expect(stickyElement).toBeSticky();

				// and back to un-sticky again
				drawAt(49);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement.next().length).toBe(0);
				expect(stickyElement).not.toBeSticky();
			});

			it('should make it sticky with an unknown anchor', function() {
				var error = spyOn($log, 'error');
				compileSticky(templateStickyElementOffsetSmall, {
					anchor: 'unknown'
				});
				drawAt(1);
				expect(error).toHaveBeenCalledTimes(1);
			});

			it('should make it sticky with offset', function() {
				compileSticky(templateStickyElementOffsetSmall, {
					offsetTop: 30
				});

				drawAt(19);
				expect(stickyElement).not.toBeSticky();

				drawAt(20);
				expect(stickyElement).toBeSticky();
			});

			it('should not have a placeholder', function() {
				compileSticky(templateStickyElementOffsetSmall, {
					usePlaceholder: false
				});

				drawAt(50);
				expect(stickyElement.next().length).toBe(0);

				// and back to un-sticky again
				drawAt(49);
				expect(stickyElement.next().length).toBe(0);
			});

			it('should make it sticky with custom sticky class', function() {
				compileSticky(templateStickyElementOffsetSmall, {
					stickyClass: 'custom-sticky-class'
				});

				drawAt(49);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeFalsy();

				drawAt(50);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeTruthy();
			});
			it('should make it sticky with empty custom sticky class', function() {
				compileSticky(templateStickyElementOffsetSmall, {
					stickyClass: null
				});

				drawAt(50);
				expect(stickyElement.hasClass('is-sticky')).toBeTruthy();
			});

			it('should stick within container', function() {
				compileSticky(templateStickyElementWithContainer, {
					container: 'container'
				});

				// just before the container begins it should not be sticky
				drawAt(49);
				expect(stickyElement).not.toBeSticky();

				// just when the container begins it become sticky
				drawAt(50);
				expect(stickyElement).toBeSticky();

				// just before the container ends it should be sticky and in the viewport
				drawAt(149);
				expect(stickyElement).toBeSticky();
				expect(stickyElement).toBeInTheViewport();

				// just when the container is not longer in the viewport, so shouldn't the sticky element
				drawAt(150);
				expect(stickyElement).not.toBeInTheViewport();
			});

			it('should stick within container given as an element', function() {
				compileSticky(templateStickyElementWithContainer, {
					container: element.find('#container')[0]
				});

				// just before the container begins it should not be sticky
				drawAt(150);
				expect(stickyElement).not.toBeInTheViewport();
			});

			it('should stick with global offset', function() {
				compileSticky(templateStickyElementWithContainer);

				var drawOptions = {
					offset: {
						top: 30
					}
				};

				drawAt(19, null, drawOptions);
				expect(stickyElement).not.toBeSticky();

				drawAt(20, null, drawOptions);
				expect(stickyElement).toBeSticky();
			});

			it('should stick with global offset when forced redraw is requested', function() {
				compileSticky(templateStickyElementWithContainer);

				var drawOptions = {
					offset: {
						top: 30
					}
				};

				drawAt(20, null, drawOptions);
				expect(stickyElement).toBeSticky();

				// it was already sticky, so a redraw cannot be done because of caching
				drawOptions.offset.top = null;
				drawOptions.force = true;
				drawAt(49, null, drawOptions);
				expect(stickyElement).not.toBeSticky();

				drawAt(50, null);
				expect(stickyElement).toBeSticky();
			});

			it('should handle multiple sticky elements in a stack', function() {
				compileSticky(templateMultipleStickyElements);

				var stickyElement2 = element.find('#sticky2');
				var sticky2 = hlStickyElement(stickyElement2);

				drawAt(39);
				drawAt(39, sticky2);
				expect(stickyElement).toBeSticky();
				expect(stickyElement2).not.toBeSticky();

				drawAt(40);
				drawAt(40, sticky2);
				expect(stickyElement).toBeSticky();
				expect(stickyElement2).toBeSticky();
			});
		});
	});

	describe('provider:hlStickyElementCollection', function() {

		var $timeout;

		var hlStickyElementCollection;
		var DefaultStickyStackName;

		beforeEach(inject(function (_$timeout_, _hlStickyElementCollection_, _DefaultStickyStackName_) {
			$timeout = _$timeout_;

			hlStickyElementCollection = _hlStickyElementCollection_;
			DefaultStickyStackName = _DefaultStickyStackName_;
		}));

		it('creates a new instance of hlStickyElementCollection()', function() {
			var element = compile(templateStickyElementOffsetSmall);

			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName]).toBeUndefined();

			var collection = hlStickyElementCollection();
			var trackedElements = hlStickyElementCollectionProvider.collections[DefaultStickyStackName].trackedElements();
			expect(trackedElements.length).toBe(0);

			collection.addElement(element);
			expect(trackedElements.length).toBe(1);

			collection.removeElement(element);
			expect(trackedElements.length).toBe(0);

			collection.addElement(element);
			expect(trackedElements.length).toBe(1);

			collection.removeElement('sticky');
			expect(trackedElements.length).toBe(0);
		});

		it('creates a new instance of hlStickyElementCollection() and reuse it', function() {
			var element = compile(templateStickyElementOffsetSmall);

			var collection = hlStickyElementCollection();
			var trackedElements = hlStickyElementCollectionProvider.collections[DefaultStickyStackName].trackedElements();

			collection.addElement(element);
			expect(trackedElements.length).toBe(1);

			hlStickyElementCollection().addElement(element);
		});

		it('creates multiple instances of hlStickyElementCollection()', function() {
			var collection1 = hlStickyElementCollection({
				name: 'instance1'
			});
			var collection2 = hlStickyElementCollection({
				name: 'instance2'
			});
			expect(objectSize(hlStickyElementCollectionProvider.collections)).toBe(2);

			collection1.destroy();
			collection2.destroy();
			expect(objectSize(hlStickyElementCollectionProvider.collections)).toBe(0);
		});

		it('destroys an instance of hlStickyElementCollection()', function() {
			var element = compile(templateStickyElementOffsetSmall);

			var collection = hlStickyElementCollection();
			collection.addElement(element);
			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName].trackedElements().length).toBe(1);

			collection.destroy();
			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName].trackedElements().length).toBe(1);

			collection.removeElement(element);
			collection.destroy();
			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName]).toBeUndefined();

			// force the destruction
			collection = hlStickyElementCollection();
			collection.addElement(element);
			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName].trackedElements().length).toBe(1);

			collection.destroy(true);
			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName]).toBeUndefined();
		});

		it('triggers a resize event so the collection gets rendered', function() {
			var element = compile('<div>' + templateStickyElementOffsetSmall + '</div>');
			var stickyElement = element.find('#sticky');

			var collection = hlStickyElementCollection();
			collection.addElement(stickyElement);

			window.dispatchEvent(new Event('resize'));
			$timeout.flush();

			scrollTo(49);
			expect(stickyElement).not.toBeSticky();

			scrollTo(50);
			expect(stickyElement).toBeSticky();
		});

		it('triggers a resize event with a collection parent', function() {
			var element = compile('<div>' + templateMultipleStickyElements + '</div>');
			var stickyElement = element.find('#sticky');
			var stickyElement2 = element.find('#sticky2');

			var parentName = 'parent';

			var collection1 = hlStickyElementCollection({
				name: parentName
			});
			collection1.addElement(stickyElement);

			var collection2 = hlStickyElementCollection({
				name: 'child',
				parent: parentName
			});
			collection2.addElement(stickyElement2);

			window.dispatchEvent(new Event('resize'));
			$timeout.flush();

			scrollTo(39);
			expect(stickyElement).toBeSticky();
			expect(stickyElement2).not.toBeSticky();

			scrollTo(40);
			expect(stickyElement).toBeSticky();
			expect(stickyElement2).toBeSticky();
		});
	});

	describe('directive:hlSticky', function() {

		var scope;

		beforeEach(function() {
			scope = $rootScope.$new();
		});

		function compile(element) {
			return angular.element($compile(element)(scope));
		}

		it('passes the simplest directive usage', function () {
			var element = compile('<div hl-sticky></div>');
			expect(element.hasClass('hl-sticky')).toBe(true);

			scope.$destroy();
			expect(objectSize(hlStickyElementCollectionProvider.collections)).toBe(0);
		});
	});
});