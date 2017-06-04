[![Build Status](https://travis-ci.org/harm-less/angular-sticky.svg?branch=master)](https://travis-ci.org/harm-less/angular-sticky)
[![devDependency Status](https://david-dm.org/harm-less/angular-sticky/dev-status.svg?branch=master)](https://david-dm.org/harm-less/angular-sticky#info=devDependencies)

# Angular Sticky
Pure javascript [AngularJS](http://angularjs.org/) directive to make elements stick when scrolling

# Demo
Do you want to see directives in action? Visit http://harm-less.github.io/angular-sticky

## Installation
Requirements
* AngularJS (requires AngularJS 1.4.x or higher, tested with 1.4.9)
* Supports all major browsers and IE9 and up (lower versions might not be supported)

#### Install with Bower (recommended)
To install Angular Sticky with [Bower](http://bower.io/) use:
```sh
bower install angular-sticky-plugin
```

Or with [npm](https://www.npmjs.com/)
```sh
npm install angular-sticky-plugin
```

#### Manually
Click [here](https://github.com/harm-less/angular-sticky/archive/master.zip) to download the latest version of the plugin. In the ```dist``` folder you'll find the minified and normal JavaScript file. Either one is fine to use, it just depends on your needs.

#### Adding it to your project
As soon as you've got all the files downloaded and included in your page you just need to declare a dependency on the module:
```sh
angular.module('myModule', ['hl.sticky']);
```

# Contributing to the project
We are always looking for quality contributions!

There are several useful Grunt tasks you can run in order to use/change the project:

* ```serve```: Use to demo application in order to develop the scripts from the ```js``` folder.
* ```build```: Build the files from the ```js``` folder to the ```dist``` folder

**Note**: If you make a pull-request, there is no need to build the project as this is done only for a new release.

### Todo
* Configurable z-index (preferably in each stack)
* Media queries based on predefined breakpoints (e.g. min-width: lg-max) so the code is DRYer in combination with Bootstrap or other grid frameworks
* There seems to be a weird bug were an element becoming sticky starts shaking a little
* I strongly suspect that performance can be improved at various parts in the code. For example by caching more.
