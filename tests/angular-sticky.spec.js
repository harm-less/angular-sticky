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

	beforeAll(function() {
		window.angular.element(document.head).prepend('<style type="text/css">@charset "UTF-8";.custom-sticky-class {height: 40px !important;}</style>');
	});

	beforeEach(module('hl.sticky'));
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

						// bottom:  && boundingBox.bottom - boundingBox.height <= window.innerHeight

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

	function createBottomSticky(html, extraOffset) {
		return '<div style="height: ' + (window.innerHeight + (angular.isNumber(extraOffset) ? extraOffset : 50)) + 'px;"></div>' + html;
	}

	var templateStickyElementOffsetSmall = '<div style="height: 50px;"></div><div id="sticky" style="height: 30px;"></div>';
	var templateStickyElementOffsetSmallWithoutStyle = '<div style="height: 50px;"></div><div id="sticky"></div>';
	var templateStickyElementWithContainer = '<div style="height: 50px;"></div><div id="container" style="height: 100px"><div id="sticky" style="height: 20px;"></div></div>';
	var templateMultipleStickyElements = '<div><div id="before" style="height: 20px;">Before all the sticky bars</div><div id="sticky" style="height: 50px;">Sticky bar 1</div><div id="between" style="height: 20px;">Between all the sticky bars</div><div id="sticky2" style="height: 60px;">Sticky bar 2</div><div id="underneath">Underneath all the sticky bars</div></div>';

	var templateStickyElementBottomOffsetSmall = createBottomSticky('<div id="sticky" style="height: 30px;"></div>');
	var templateStickyElementBottomOffsetSmallWithoutStyle = createBottomSticky('<div id="sticky"></div>');
	var templateStickyElementBottomWithContainer = createBottomSticky('<div style="height: 3000px;"><div id="container"><div style="height: 100px;"></div><div id="sticky" style="height: 30px;"></div></div></div>');
	var templateMultipleStickyElementsBottom = createBottomSticky('<div><div style="height: 3000px;"></div><div id="before" style="height: 20px;">Before all the sticky bars</div><div id="sticky" style="height: 50px;">Sticky bar 1</div><div id="between" style="height: 20px;">Between all the sticky bars</div><div id="sticky2" style="height: 60px;">Sticky bar 2</div><div id="underneath">Underneath all the sticky bars</div></div>');

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

		describe('calculate stack heights when using sticky element anchored to the top', function() {

			var el;
			beforeEach(function () {
				el = compile('<div><div id="before" style="height: 20px;">Before all the sticky bars</div><div hl-sticky style="height: 50px;">Sticky bar 1</div><div id="between" style="height: 20px;">Between all the sticky bars</div><div hl-sticky style="height: 60px;">Sticky bar 2</div><div id="underneath">Underneath all the sticky bars</div></div>');

				scrollTo(0);
			});

			it('calculate stack height at a certain position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.height('top')).toBe(110);
			});

			xit('calculate stack height at a certain position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.heightAt('top', 0)).toBe(0);
				expect(stack.heightAt('top', 20)).toBe(0);
				expect(stack.heightAt('top', 21)).toBe(50);
				expect(stack.heightAt('top', 40)).toBe(50);
				expect(stack.heightAt('top', 41)).toBe(110);
			});

			it('calculate stack height at current position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.heightCurrent('top')).toBe(0);
				scrollTo(20);
				expect(stack.heightCurrent('top')).toBe(0);
				scrollTo(21);
				expect(stack.heightCurrent('top')).toBe(50);
				scrollTo(40);
				expect(stack.heightCurrent('top')).toBe(50);
				scrollTo(41);
				expect(stack.heightCurrent('top')).toBe(110);
			});
		});

		describe('calculate stack heights when using sticky element anchored to the bottom', function() {

			var el;
			beforeEach(function () {
				el = compile(createBottomSticky('<div><div id="before" style="height: 20px;">Before all the sticky bars</div><div hl-sticky anchor="bottom" style="height: 50px;">Sticky bar 1</div><div id="between" style="height: 20px;">Between all the sticky bars</div><div hl-sticky anchor="bottom" style="height: 60px;">Sticky bar 2</div><div id="underneath" style="20px;">Underneath all the sticky bars</div></div>', 0));

				scrollTo(0);
			});

			it('calculate stack height at a certain position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.height('bottom')).toBe(110);
			});

			xit('calculate stack height at a certain position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.heightAt('bottom', 0)).toBe(110);
				expect(stack.heightAt('bottom', 129)).toBe(110);
				expect(stack.heightAt('bottom', 130)).toBe(60);
				expect(stack.heightAt('bottom', 149)).toBe(60);
				expect(stack.heightAt('bottom', 150)).toBe(0);
			});

			xit('calculate stack height at current position', function() {
				var stack = hlStickyStack();
				expect(stack.length()).toBe(2);
				expect(stack.heightCurrent('bottom')).toBe(110);
				scrollTo(129);
				expect(stack.heightCurrent('bottom')).toBe(110);
				scrollTo(130);
				expect(stack.heightCurrent('bottom')).toBe(60);
				scrollTo(149);
				expect(stack.heightCurrent('bottom')).toBe(60);
				scrollTo(150);
				expect(stack.heightCurrent('bottom')).toBe(0);
			});
		});
	});

	describe('factory:hlStickyElement', function() {

		var hlStickyElement;

		var element;
		var sticky;

		var stickyElement;
		var hlStickyStack;
		var mediaQuery;

		beforeEach(inject(function (_hlStickyElement_, _hlStickyStack_, _mediaQuery_) {
			hlStickyElement = _hlStickyElement_;
			hlStickyStack = _hlStickyStack_;
			mediaQuery = _mediaQuery_;
		}));

		function compileSticky(html, options) {
			element = compile('<div>' + html + '</div>');
			stickyElement = angular.element(element[0].querySelector('#sticky'));
			sticky = hlStickyElement(stickyElement, options);
		}

		function compileStickyBottom(html, options) {
			compileSticky(html, angular.extend(options || {}, {
				anchor: 'bottom'
			}));
		}

		function drawAt(position, hlSticky, drawOptions) {
			hlSticky = hlSticky ? hlSticky : sticky;
			scrollTo(position);
			hlSticky.draw(drawOptions);
		}

		function drawAtBottom(position, hlSticky, drawOptions) {
			// 30 is the height of each bottom anchored sticky element
			drawAt(position + 30, hlSticky, drawOptions);
		}

		describe('sticky top', function() {
			it('should return a hlStickyElement instance and make it sticky', function() {
				compileSticky(templateStickyElementOffsetSmall);

				var originalStyle = stickyElement.attr('style');

				// just before it get sticky
				drawAt(49);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement).not.toBeSticky();
				// shouldn't have any notion of a place holder
				expect(stickyElement.next().length).toBe(0);

				// just at the point it gets sticky
				drawAt(50);
				expect(stickyElement.attr('style')).toEqual('height: 30px; width: 9000px; position: fixed; left: 8px; z-index: 1039; margin-top: 0px; top: 0px;');
				expect(stickyElement.next()[0].outerHTML).toBe('<div style="height: 30px;"></div>');
				expect(stickyElement).toBeSticky();

				var placeHolder = stickyElement.next();
				// place holder should now be findable
				expect(placeHolder).not.toBeFalsy();
				placeHolder.attr('id', 'placeHolder');

				// and back to un-sticky again
				drawAt(49);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement.next().length).toBe(0);
				expect(angular.element(element)[0].querySelector('#placeHolder')).toBeNull();
				expect(stickyElement).not.toBeSticky();
			});

			it('should fire all events properly', function() {
				var lastEvent;
				var options = {
					event: function (event) {
						lastEvent = event.event;
					}
				};
				var eventSpy = spyOn(options, 'event').and.callThrough();
				compileSticky(templateStickyElementOffsetSmall, options);

				// just before it get sticky
				drawAt(49);
				expect(stickyElement).not.toBeSticky();
				expect(lastEvent).toBeUndefined();

				// just at the point it gets sticky
				drawAt(50);
				expect(stickyElement).toBeSticky();
				expect(eventSpy).toHaveBeenCalled();
				expect(lastEvent).toBe('stick');

				// just at the point it gets sticky
				drawAt(49);
				expect(stickyElement).not.toBeSticky();
				expect(lastEvent).toBe('unstick');
			});

			it('should destroy a hlStickyElement properly', function() {
				compileSticky(templateStickyElementOffsetSmall, {
					stickyClass: 'custom-sticky-class'
				});

				var originalStyle = stickyElement.attr('style');

				drawAt(50);
				expect(stickyElement.next().length).toBe(1);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeTruthy();

				sticky.destroy();
				// place holder is removed
				expect(stickyElement.next().length).toBe(0);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeFalsy();
			});

			it('should make it sticky without a style', function() {
				compileSticky(templateStickyElementOffsetSmallWithoutStyle);

				drawAt(50);
				expect(stickyElement).toBeSticky();

				drawAt(49);
				expect(stickyElement).not.toBeSticky();
				expect(stickyElement.attr('style')).toBe('');
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

			it('should not use a stack', function() {
				compileSticky(templateStickyElementOffsetSmall, {
					stack: false
				});

				var stack = hlStickyStack();
				expect(stack.length()).toBe(0);

				drawAt(49);
				expect(stickyElement).not.toBeSticky();

				drawAt(50);
				expect(stickyElement).toBeSticky();

				sticky.destroy();
			});

			it('should not pass the media query check', function() {
				spyOn(mediaQuery, 'matches').and.returnValue(false);
				compileSticky(templateStickyElementOffsetSmall, {
					mediaQuery: 'some-media-query'
				});

				var stack = hlStickyStack();
				expect(stack.heightAt('top', 1000)).toBe(0);
			});

			it('should pass the media query check', function() {
				spyOn(mediaQuery, 'matches').and.returnValue(true);
				compileSticky(templateStickyElementOffsetSmall, {
					mediaQuery: 'some-media-query'
				});

				var stack = hlStickyStack();
				expect(stack.heightAt('top', 1000)).toBe(30);
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

			it('should have a placeholder which has adapted to a variable sticky element height', function() {
				compileSticky(templateStickyElementOffsetSmall, {
					stickyClass: 'custom-sticky-class'
				});

				drawAt(50);
				var placeHolder = stickyElement.next();
				expect(placeHolder[0].offsetHeight).toBe(40);
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

			it('should stick with global offset', function() {
				compileSticky(templateStickyElementOffsetSmall);

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
				compileSticky(templateStickyElementOffsetSmall);

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

				var stickyElement2 = angular.element(element[0].querySelector('#sticky2'));
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

			it('should not be sticky with enable option set to false', function() {
				compileSticky(templateStickyElementOffsetSmallWithoutStyle, {
					enable: false
				});

				drawAt(50);
				expect(stickyElement).not.toBeSticky();
			});

			it('should be sticky with enable option set to true', function() {
				compileSticky(templateStickyElementOffsetSmallWithoutStyle, {
					enable: true
				});

				drawAt(50);
				expect(stickyElement).toBeSticky();
			});

			it('should handle multiple sticky elements with different values for the option parameter', function() {
				var options1 = { enable: true };
				var options2 = { enable: true };
				compileSticky(templateMultipleStickyElements, null, [options1, options2]);

				var stickyElement1 = angular.element(element[0].querySelector('#sticky1'));
				var sticky1 = hlStickyElement(stickyElement1, options1);

				var stickyElement2 = angular.element(element[0].querySelector('#sticky2'));
				var sticky2 = hlStickyElement(stickyElement2, options2);

				drawAt(40);
				drawAt(40, sticky2);
				expect(stickyElement).toBeSticky();
				expect(stickyElement2).toBeSticky();

				options2.enable = false;
				drawAt(40, sticky2);
				expect(stickyElement2).not.toBeSticky();

				options1.enable = false;
				drawAt(40, sticky1);
				expect(stickyElement1).not.toBeSticky();

				options2.enable = true;
				drawAt(40, sticky2);
				expect(stickyElement2).toBeSticky();
			});

			it('should make it sticky with alwaysSticky option set to true', function() {
				compileSticky(templateStickyElementOffsetSmallWithoutStyle, {
					alwaysSticky: true
				});

				drawAt(49);
				expect(stickyElement).toBeSticky();
			});
			
		});

		describe('sticky bottom', function() {

			it('should return a hlStickyElement instance and make it sticky', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					anchor: 'bottom'
				});

				var originalStyle = stickyElement.attr('style');

				// just before it get sticky
				drawAtBottom(51);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement).not.toBeSticky();
				// shouldn't have any notion of a place holder
				expect(stickyElement.next().length).toBe(0);

				// just at the point it gets sticky
				drawAtBottom(50);
				expect(stickyElement.attr('style')).toEqual('height: 30px; width: 9000px; position: fixed; left: 8px; z-index: 1039; margin-bottom: 0px; bottom: 0px;');
				expect(stickyElement.next()[0].outerHTML).toBe('<div style="height: 30px;"></div>');
				expect(stickyElement).toBeSticky();

				var placeHolder = stickyElement.next();
				// place holder should now be findable
				expect(placeHolder).not.toBeFalsy();
				placeHolder.attr('id', 'placeHolder');

				// and back to un-sticky again
				drawAtBottom(51);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement.next().length).toBe(0);
				expect(element[0].querySelector('#placeHolder')).toBeNull();
				expect(stickyElement).not.toBeSticky();
			});

			it('should fire all events properly', function() {
				var lastEvent;
				var options = {
					anchor: 'bottom',
					event: function (event) {
						lastEvent = event.event;
					}
				};
				var eventSpy = spyOn(options, 'event').and.callThrough();
				compileStickyBottom(templateStickyElementBottomOffsetSmall, options);

				// just before it get sticky
				drawAtBottom(51);
				expect(stickyElement).not.toBeSticky();
				expect(lastEvent).toBeUndefined();

				// just at the point it gets sticky
				drawAtBottom(50);
				expect(stickyElement).toBeSticky();
				expect(eventSpy).toHaveBeenCalled();
				expect(lastEvent).toBe('stick');

				// just at the point it gets sticky
				drawAtBottom(51);
				expect(stickyElement).not.toBeSticky();
				expect(lastEvent).toBe('unstick');
			});

			it('should destroy a hlStickyElement properly', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					stickyClass: 'custom-sticky-class'
				});

				var originalStyle = stickyElement.attr('style');

				drawAtBottom(50);
				expect(stickyElement.next().length).toBe(1);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeTruthy();

				sticky.destroy();
				// place holder is removed
				expect(stickyElement.next().length).toBe(0);
				expect(stickyElement.attr('style')).toEqual(originalStyle);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeFalsy();
			});

			it('should make it sticky with a style', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmallWithoutStyle);

				// correct for the missing 30 pixels
				drawAtBottom(20);
				expect(stickyElement).toBeSticky();

				// correct for the missing 30 pixels
				drawAtBottom(21);
				expect(stickyElement).not.toBeSticky();
				expect(stickyElement.attr('style')).toBe('');
			});

			it('should make it sticky with offset', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					offsetBottom: 30
				});

				drawAtBottom(81);
				expect(stickyElement).not.toBeSticky();

				drawAtBottom(80);
				expect(stickyElement).toBeSticky();
			});

			it('should not use a stack', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					stack: false
				});

				var stack = hlStickyStack();
				expect(stack.length()).toBe(0);

				drawAtBottom(51);
				expect(stickyElement).not.toBeSticky();

				drawAtBottom(50);
				expect(stickyElement).toBeSticky();

				sticky.destroy();
			});

			xit('should not pass the media query check', function() {
				spyOn(mediaQuery, 'matches').and.returnValue(false);
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					mediaQuery: 'some-media-query'
				});

				var stack = hlStickyStack();
				expect(stack.heightAt('bottom', 2000)).toBe(0);
			});

			xit('should pass the media query check', function() {
				spyOn(mediaQuery, 'matches').and.returnValue(true);
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					mediaQuery: 'some-media-query'
				});

				var stack = hlStickyStack();
				expect(stack.heightAt('bottom', 1000)).toBe(30);
			});

			it('should not have a placeholder', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					usePlaceholder: false
				});

				drawAtBottom(51);
				expect(stickyElement.next().length).toBe(0);

				// and back to un-sticky again
				drawAtBottom(50);
				expect(stickyElement.next().length).toBe(0);
			});

			it('should make it sticky with custom sticky class', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					stickyClass: 'custom-sticky-class'
				});

				drawAtBottom(51);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeFalsy();

				drawAtBottom(50);
				expect(stickyElement.hasClass('custom-sticky-class')).toBeTruthy();
			});
			xit('should make it sticky with empty custom sticky class', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall, {
					stickyClass: null
				});

				drawAtBottom(50);
				expect(stickyElement.hasClass('is-sticky')).toBeTruthy();
			});

			xit('should stick within container', function() {
				compileStickyBottom(templateStickyElementBottomWithContainer, {
					container: 'container'
				});

				// just before the container begins it should not be sticky
				drawAtBottom(151);
				expect(stickyElement).not.toBeSticky();

				// just when the container begins it become sticky
				drawAtBottom(150);
				expect(stickyElement).toBeSticky();

				// just before the container ends it should be sticky and in the viewport
				drawAtBottom(3);
				expect(stickyElement).toBeSticky();
				expect(stickyElement).toBeInTheViewport();

				// just when the container is not longer in the viewport, so shouldn't the sticky element
				drawAtBottom(2);
				expect(stickyElement).not.toBeInTheViewport();
			});

			it('should stick with global offset', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall);

				var drawOptions = {
					offset: {
						bottom: 30
					}
				};

				drawAtBottom(81, null, drawOptions);
				expect(stickyElement).not.toBeSticky();

				drawAtBottom(80, null, drawOptions);
				expect(stickyElement).toBeSticky();
			});

			it('should stick with global offset when forced redraw is requested', function() {
				compileStickyBottom(templateStickyElementBottomOffsetSmall);

				var drawOptions = {
					offset: {
						bottom: 30
					}
				};

				drawAtBottom(20, null, drawOptions);
				expect(stickyElement).toBeSticky();

				// it was already sticky, so a redraw cannot be done because of caching
				drawOptions.offset.bottom = null;
				drawOptions.force = true;
				drawAtBottom(51, null, drawOptions);
				expect(stickyElement).not.toBeSticky();

				drawAtBottom(50, null);
				expect(stickyElement).toBeSticky();
			});

			xit('should handle multiple sticky elements in a stack', function() {
				compileStickyBottom(templateMultipleStickyElementsBottom);

				var stickyElement2 = element.find('#sticky2');
				var sticky2 = hlStickyElement(stickyElement2, {
					anchor: 'bottom'
				});

				drawAtBottom(3121);
				drawAtBottom(3121, sticky2);
				expect(stickyElement).toBeSticky();
				expect(stickyElement2).not.toBeSticky();

				drawAtBottom(40);
				drawAtBottom(40, sticky2);
				expect(stickyElement).toBeSticky();
				expect(stickyElement2).toBeSticky();
			});
		});

		describe('miscellaneous', function() {
			it('should make it sticky with an unknown anchor', function() {
				var error = spyOn($log, 'error');
				compileSticky(templateStickyElementOffsetSmall, {
					anchor: 'unknown'
				});
				drawAt(1);
				expect(error).toHaveBeenCalledTimes(1);
			});

			it('should stick within container given as an element', function() {
				element = compile('<div>' + templateStickyElementWithContainer + '</div>');
				stickyElement = angular.element(element[0].querySelector('#sticky'));
				sticky = hlStickyElement(stickyElement, {
					container: element[0].querySelector('#container')
				});

				// just before the container begins it should not be sticky
				drawAt(150);
				expect(stickyElement).not.toBeInTheViewport();
			});
		});
	});

	describe('provider:hlStickyElementCollection', function() {

		var $timeout;

		var hlStickyElementCollection;
		var DefaultStickyStackName;

		var hlStickyStack;

		beforeEach(inject(function (_$timeout_, _hlStickyElementCollection_, _DefaultStickyStackName_, _hlStickyStack_) {
			$timeout = _$timeout_;

			hlStickyElementCollection = _hlStickyElementCollection_;
			DefaultStickyStackName = _DefaultStickyStackName_;

			hlStickyStack = _hlStickyStack_;
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

			var stack = hlStickyStack();
			var collection = hlStickyElementCollection();
			collection.addElement(element);
			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName].trackedElements().length).toBe(1);
			expect(stack.length()).toBe(1);

			collection.destroy();
			expect(hlStickyElementCollectionProvider.collections[DefaultStickyStackName]).toBeUndefined();
			expect(stack.length()).toBe(0);
		});

		it('triggers a resize event so the collection gets rendered', function() {
			var element = compile('<div>' + templateStickyElementOffsetSmall + '</div>');
			var stickyElement = angular.element(element[0].querySelector('#sticky'));

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
			var stickyElement = angular.element(element[0].querySelector('#sticky'));
			var stickyElement2 = angular.element(element[0].querySelector('#sticky2'));

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

			scrollTo(39);
			expect(stickyElement).toBeSticky();
			expect(stickyElement2).not.toBeSticky();

			scrollTo(19);
			expect(stickyElement).not.toBeSticky();
			expect(stickyElement2).not.toBeSticky();
		});
	});

	describe('directive:hlSticky', function() {

		var scope;

		beforeEach(function() {
			scope = $rootScope.$new();
		});

		function compileDirective(element) {
			var compiledElement = compile('<div>' + element + '</div>', scope);
			var sticky = angular.element(compiledElement[0].getElementsByClassName('hl-sticky'));

			return {
				element: compiledElement,
				sticky: sticky
			};
		}

		it('passes the simplest directive usage', function () {
			compileDirective('<div hl-sticky></div>');

			scope.$destroy();
			expect(objectSize(hlStickyElementCollectionProvider.collections)).toBe(0);
		});

		describe('directive options', function() {

			function defaultOptionCompile() {
				var compiled = compileDirective('<div hl-sticky></div>');
				scrollTo(1);
				return compiled;
			}

			function optionCompile(variable, value) {
				var compiled = compileDirective('<div hl-sticky ' + variable + '="' + value + '"></div>');
				scrollTo(1);
				return compiled;
			}

			describe('stickyClass', function () {

				function tryStickyClass(value, findQuery) {
					var compiled = angular.isDefined(value) ? optionCompile('sticky-class', value) : defaultOptionCompile();
					findQuery = angular.isDefined(findQuery) ? findQuery : value;
					var stickyClass = value ? compiled.element[0].getElementsByClassName(findQuery) : {};
					return angular.extend(compiled, {
						stickyClass: stickyClass
					});
				}

				it('hardcoded class', function () {
					var attempt = tryStickyClass('custom-class');
					expect(attempt.stickyClass.length).toBe(1);
				});
				it('evaluated variable', function () {
					scope.customClass = 'custom-class';
					var attempt = tryStickyClass('{{customClass}}', 'custom-class');
					expect(attempt.stickyClass.length).toBe(1);
				});
			});

			describe('usePlaceholder', function () {

				function tryUsePlaceholder(value) {
					var compiled = angular.isDefined(value) ? optionCompile('use-placeholder', value) : defaultOptionCompile();
					var placeHolder = compiled.sticky.next();
					return angular.extend(compiled, {
						placeholder: placeHolder
					});
				}

				it('defaults to true', function () {
					var attempt = tryUsePlaceholder();
					expect(attempt.placeholder.length).toBe(1);
				});

				it('hardcoded true', function () {
					var attempt = tryUsePlaceholder('true');
					expect(attempt.placeholder.length).toBe(1);
				});
				it('hardcoded false', function () {
					var attempt = tryUsePlaceholder('false');
					expect(attempt.placeholder.length).toBe(0);
				});
				it('evaluated variable', function () {
					var attempt = tryUsePlaceholder('{{false}}');
					expect(attempt.placeholder.length).toBe(0);
				});
				it('evaluated scope variable', function () {
					scope.usePlaceholder = false;
					var attempt = tryUsePlaceholder('{{usePlaceholder}}');
					expect(attempt.placeholder.length).toBe(0);
				});
			});

			describe('anchor', function () {

				function scrollToBottom(position) {
					scrollTo(position + 50);
				}

				it('defaults to "top"', function() {
					var compiled = compileDirective('<div style="height: 20px;"></div><div hl-sticky></div>');
					var stickyElement = compiled.sticky;

					// just before it becomes sticky
					scrollTo(19);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(20);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('should stick to the top', function() {
					var compiled = compileDirective('<div style="height: 20px;"></div><div hl-sticky anchor="top"></div>');
					var stickyElement = compiled.sticky;

					// just before it becomes sticky
					scrollTo(19);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(20);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('should be able to handle scope evaluated values', function() {
					scope.anchor = 'bottom';
					var compiled = compileDirective(createBottomSticky('<div hl-sticky anchor="{{anchor}}">'));
					var stickyElement = compiled.sticky;

					// just before it becomes sticky
					scrollToBottom(1);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollToBottom(0);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('should stick to the bottom', function() {
					var compiled = compileDirective(createBottomSticky('<div hl-sticky anchor="bottom">'));
					var stickyElement = compiled.sticky;

					// just before it becomes sticky
					scrollToBottom(1);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollToBottom(0);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});
			});

			describe('offsetTop', function () {

				function tryOffsetTop(value) {
					return compileDirective(angular.isDefined(value) ? '<div style="height: 50px;"></div><div hl-sticky offset-top="' + value + '"></div>' : '<div style="height: 50px;"></div><div hl-sticky></div>');
				}

				it('defaults to no offset', function () {
					var attempt = tryOffsetTop();
					var stickyElement = attempt.sticky;

					// just before it becomes sticky
					scrollTo(49);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(50);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('hardcoded offset', function () {
					var attempt = tryOffsetTop('10');
					var stickyElement = attempt.sticky;

					// just before it becomes sticky
					scrollTo(39);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(40);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('should evaluate scope variable', function () {
					scope.offsetTop = 20;
					var attempt = tryOffsetTop('{{offsetTop}}');
					var stickyElement = attempt.sticky;

					// just before it becomes sticky
					scrollTo(29);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(30);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});
			});

			describe('offsetBottom', function () {

				function tryOffsetBottom(value) {
					return compileDirective(createBottomSticky(angular.isDefined(value) ? '<div style="height: 50px;"></div><div hl-sticky anchor="bottom" offset-bottom="' + value + '"></div>' : '<div style="height: 50px;"></div><div hl-sticky anchor="bottom"></div>'));
				}

				function scrollToBottom(position) {
					scrollTo(position + 50);
				}

				it('default to no offset', function() {
					var compiled = tryOffsetBottom();
					var stickyElement = compiled.sticky;

					// just before it becomes sticky
					scrollToBottom(51);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollToBottom(50);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('hardcoded offset', function() {
					var compiled = tryOffsetBottom('20');
					var stickyElement = compiled.sticky;

					// just before it becomes sticky
					scrollToBottom(71);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollToBottom(70);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('hardcoded offset', function() {
					scope.offsetBottom = 30;
					var compiled = tryOffsetBottom('{{offsetBottom}}');
					var stickyElement = compiled.sticky;

					// just before it becomes sticky
					scrollToBottom(81);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollToBottom(80);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});
			});

			describe('container', function () {

				function tryContainer(value) {
					var compiled = compileDirective('<div style="height: 50px;"></div><div id="container" style="height: 100px"><div hl-sticky container="' + value + '" style="height: 20px;"></div></div>');
					var container = compiled.element.find('#container');
					return angular.extend(compiled, {
						container: container
					});
				}

				function tryContainerValue(value) {
					var compiled = tryContainer(value);
					var stickyElement = compiled.sticky;

					// just before the container begins it should not be sticky
					scrollTo(49);
					scope.$digest();
					expect(stickyElement).not.toBeSticky();

					// just when the container begins it become sticky
					scrollTo(50);
					scope.$digest();
					expect(stickyElement).toBeSticky();

					// just before the container ends it should be sticky and in the viewport
					scrollTo(149);
					scope.$digest();
					expect(stickyElement).toBeSticky();
					expect(stickyElement).toBeInTheViewport();

					// just when the container is not longer in the viewport, so shouldn't the sticky element
					scrollTo(150);
					scope.$digest();
					expect(stickyElement).not.toBeInTheViewport();
				}

				it('hardcoded container', function () {
					tryContainerValue('container');
				});

				it('scope evaluated container', function () {
					scope.container = 'container';
					tryContainerValue('{{container}}');
				});
			});

			describe('event', function () {

				function tryEvent(value) {
					return compileDirective('<div style="height: 50px;"></div><div hl-sticky event="' + value + '"></div>')
				}

				it('default implementation', function () {
					var lastEvent;
					scope.stickyEvent = function (event) {
						lastEvent = event.event;
					};
					var eventSpy = spyOn(scope, 'stickyEvent').and.callThrough();

					var attempt = tryEvent('stickyEvent(event)');
					var stickyElement = attempt.sticky;

					// just before it get sticky
					scrollTo(49);
					scope.$digest();
					expect(stickyElement).not.toBeSticky();
					expect(lastEvent).toBeUndefined();

					// just at the point it gets sticky
					scrollTo(50);
					scope.$digest();
					expect(stickyElement).toBeSticky();
					expect(eventSpy).toHaveBeenCalled();
					expect(lastEvent).toBe('stick');

					// just at the point it gets sticky
					scrollTo(49);
					scope.$digest();
					expect(stickyElement).not.toBeSticky();
					expect(lastEvent).toBe('unstick');
				});
			});

			describe('collection', function () {

				var hlStickyElementCollection;

				beforeEach(inject(function(_hlStickyElementCollection_) {
					hlStickyElementCollection = _hlStickyElementCollection_;
				}));

				function tryCollection(value, collectionName) {
					var hasCollection = angular.isDefined(value);
					var compiled = hasCollection ? optionCompile('collection', value) : defaultOptionCompile();
					var collection = hlStickyElementCollection(hasCollection ? {name: collectionName || value} : null);
					return angular.extend(compiled, {
						collection: collection
					});
				}

				it('defaults to default collection', function () {
					var attempt = tryCollection();
					expect(attempt.collection.trackedElements().length).toBe(1);
				});

				it('hardcoded value', function () {
					var attempt = tryCollection('differentCollection');
					expect(attempt.collection.trackedElements().length).toBe(1);
				});

				it('scope evaluated value', function () {
					scope.differentCollection = 'differentCollection';
					var attempt = tryCollection('{{differentCollection}}', 'differentCollection');
					expect(attempt.collection.trackedElements().length).toBe(1);
				});
			});

			describe('collectionParent', function () {

				var hlStickyElementCollection;
				var firstStickyElement;

				function _collection(collectionName, collectionParent) {
					collectionParent = collectionParent || '';
					var compiled = compileDirective('<div style="height: 50px;"></div><div hl-sticky collection="' + collectionName + '" collection-parent="' + collectionParent + '" style="height: 20px;"></div>');
					var collection = hlStickyElementCollection({name: collectionName});
					return angular.extend(compiled, {
						collection: collection
					});
				}

				function tryCollectionParent(value) {
					return _collection('second', value);
				}

				beforeEach(inject(function(_hlStickyElementCollection_) {
					hlStickyElementCollection = _hlStickyElementCollection_;

					firstStickyElement = _collection('first');
				}));

				it('defaults to no parent', function () {
					var attempt = tryCollectionParent();
					var stickyElement = attempt.sticky;
					expect(firstStickyElement.collection.trackedElements().length).toBe(1);
					expect(attempt.collection.trackedElements().length).toBe(1);

					// just before it becomes sticky
					scrollTo(99);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(120);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('hardcoded value', function () {
					var attempt = tryCollectionParent('first');
					var stickyElement = attempt.sticky;
					expect(firstStickyElement.collection.trackedElements().length).toBe(1);
					expect(attempt.collection.trackedElements().length).toBe(1);

					// just before it becomes sticky
					scrollTo(79);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(100);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});

				it('evaluated scope value', function () {
					scope.collectionParent = 'first';
					var attempt = tryCollectionParent('{{collectionParent}}');
					var stickyElement = attempt.sticky;
					expect(firstStickyElement.collection.trackedElements().length).toBe(1);
					expect(attempt.collection.trackedElements().length).toBe(1);

					// just before it becomes sticky
					scrollTo(79);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					// just at the point it gets sticky
					scrollTo(100);
					scope.$digest();
					expect(stickyElement).toBeSticky();
				});
			});

			describe('enable', function () {

				it('should enable sticky behavior on startup if true', function () {
					var compiled = optionCompile('enable', true);

					expect(compiled.sticky).toBeSticky();
				});

				it('should disable sticky behavior on startup if false', function () {
					var compiled = optionCompile('enable', false);

					expect(compiled.sticky).not.toBeSticky();
				});

				it('should disable stickyness while being sticky', function () {
					var compiled = optionCompile('enable', true);

					expect(compiled.sticky).toBeSticky();

					compiled.sticky.isolateScope().enable = false;
					compiled.sticky.isolateScope().$digest();

					expect(compiled.sticky).not.toBeSticky();
				});

				it('should enable stickyness while not being sticky', function () {
					var compiled = optionCompile('enable', false);

					expect(compiled.sticky).not.toBeSticky();

					compiled.sticky.isolateScope().enable = true;
					compiled.sticky.isolateScope().$digest();

					expect(compiled.sticky).toBeSticky();
				});
			});

			describe('alwaysSticky', function () {

				it('should overwrite stickyness behavior', function () {
					var compiled = optionCompile('alwaysSticky', true);

					expect(compiled.sticky).toBeSticky();
				});

				it('should overwrite sticky behavior regardless of element position',  function () {
					var compiled = compileDirective(createBottomSticky('<div style="height: 50px;"></div><div hl-sticky anchor="bottom" offset-bottom="30"></div>'));
					var stickyElement = compiled.sticky;

					scrollTo(81 + 50);
					scope.$digest();

					expect(stickyElement).not.toBeSticky();

					compiled.sticky.isolateScope().alwaysSticky = true;
					compiled.sticky.isolateScope().$digest();

					expect(stickyElement).toBeSticky();
				});
			});
		});
	});
});