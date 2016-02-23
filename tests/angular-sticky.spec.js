'use strict';

describe('treeControl', function() {

	var $rootScope;
	var $compile;

	beforeEach(module('hl-sticky'));
	beforeEach(inject(function(_$rootScope_, _$compile_) {
		$rootScope = _$rootScope_;
		$compile = _$compile_;

	}));

	it('should render only first level of the tree thanks to ng-if', function () {
		var scope = $rootScope.$new();
		var element = angular.element('<div hl-sticky></div>');
		var compiled = $compile(element)(scope);

		expect(angular.element(compiled).hasClass('hl-sticky')).toBe(true);
	});
});