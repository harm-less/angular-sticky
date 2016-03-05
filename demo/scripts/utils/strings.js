'use strict';

angular.module('demo.utils.strings', [])
	.factory('s', function() {
		var $utils = {};
		$utils.textFromHtml = function(str) {
			return str ? String(str).replace(/<[^>]+>/gm, '') : '';
		};
		$utils.firstToUpperCase = function(str) {
			var trimmed = str.trim();
			return trimmed.substr(0, 1).toUpperCase() + trimmed.substr(1);
		};
		$utils.firstToLowerCase = function(str) {
			var trimmed = str.trim();
			return trimmed.substr(0, 1).toLowerCase() + trimmed.substr(1);
		};
		$utils.camelCase = function(str) {
			return str.toLowerCase().replace(/-(.)/g, function(match, group1) {
				return group1.toUpperCase();
			});
		};
		return $utils;
	});