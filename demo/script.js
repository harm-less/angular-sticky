angular.module('demo', ['hl-sticky'])

	.controller('DemoCtrl', function($scope) {
		$scope.stickySidebars = [
			{
				name: 'First'
			},
			{
				name: 'Second'
			},
			{
				name: 'Third'
			}
		];
	});