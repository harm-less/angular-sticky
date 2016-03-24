'use strict';

angular.module('demo.utils.dom', ['hl.sticky', 'smoothScroll'])

	.service('offset', function ($document, hlStickyStack, smoothScroll) {

		var docEl = angular.element($document)[0];

		this.getElement = function(element) {
			return angular.isString(element) ? docEl.getElementById(element) : element;
		};

		this.top = function(element) {
			var pixels = 0;

			element = this.getElement(element);
			if (element && element.offsetParent) {
				do {
					pixels += element.offsetTop;
					element = element.offsetParent;
				} while (element);
			}
			else {
				return null;
			}
			return pixels;
		};

		this.totalStickyStackHeightAtElement = function (element) {
			return hlStickyStack().heightAt('top', this.top(element));
		};

		this.scrollToElement = function(element) {
			element = this.getElement(element);
			var options = {
				offset: this.totalStickyStackHeightAtElement(element)
			};
			smoothScroll(element, options);

			return options;
		};
	});