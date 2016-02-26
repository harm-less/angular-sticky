'use strict';

describe('angular-sticky', function() {

	var $rootScope;
	var $compile;
	var $document;
	var $window;

	var body;
	var bodyNg;

	beforeEach(module('hl-sticky'));
	beforeEach(inject(function(_$rootScope_, _$compile_, _$document_, _$window_) {
		$rootScope = _$rootScope_;
		$compile = _$compile_;
		$document = _$document_;
		$window = _$window_;
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
				expect(stack.totalHeightAt('top', 90)).toBe(50);
				expect(stack.totalHeightAt('top', 91)).toBe(110);
			});

			it('calculate stack height at current position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.totalHeightCurrent('top')).toBe(0);
				scrollTo(20);
				expect(stack.totalHeightCurrent('top')).toBe(0);
				scrollTo(21);
				expect(stack.totalHeightCurrent('top')).toBe(50);
				scrollTo(90);
				expect(stack.totalHeightCurrent('top')).toBe(50);
				scrollTo(91);
				expect(stack.totalHeightCurrent('top')).toBe(110);
			});
		});
	});

	describe('factory:hlStickyElement', function() {

		var templateStickyElementOffsetSmall = '<div style="height: 50px;"></div><div id="sticky" style="height: 30px;"></div>';

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

		function drawAt(position, hlSticky) {
			hlSticky = hlSticky ? hlSticky : sticky;
			scrollTo(position);
			hlSticky.draw();
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
				compileSticky('<div style="height: 50px;"></div><div id="container" style="height: 100px"><div id="sticky" style="height: 20px;"></div></div>', {
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
		});
	});
});