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

			function compile(element) {
				var scope = $rootScope.$new();
				var el = angular.element(element);
				body.append(el);
				$compile(el)(scope);
				scope.$digest();

				return el;
			}

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
				$window.pageYOffset = 20;
				expect(stack.totalHeightCurrent('top')).toBe(0);
				$window.pageYOffset = 21;
				expect(stack.totalHeightCurrent('top')).toBe(50);
				$window.pageYOffset = 90;
				expect(stack.totalHeightCurrent('top')).toBe(50);
				$window.pageYOffset = 91;
				expect(stack.totalHeightCurrent('top')).toBe(110);
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