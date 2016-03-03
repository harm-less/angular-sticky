module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		karma: {
			options: {
				configFile: 'karma.conf.js',
				browsers: ['Chrome']
			},
			ci: {
				singleRun: true,
				preprocessors: {'js/*': 'coverage'},
				reporters: ['progress', 'coverage'],
				coverageReporter: {type: 'lcov'}
			},
			ci_travis: {
				singleRun: true,
				preprocessors: {'js/*': 'coverage'},
				reporters: ['progress', 'coverage'],
				coverageReporter: {type: 'lcov'},
				browsers: ['Chrome_travis_ci']
			},
			dev: {
				background: true
			},
			angular3: {
				background: true,
				options: {
					files: [
						'bower_components/jquery/jquery.js',
						'demo/angular.1.3.12.js',
						'demo/angular-mocks.1.3.12.js',
						'angular-tree-control.js',
						'tests/**/*.js'
					]
				}
			}
		},
		connect: {
			options: {
				livereload: true,
				port: 9000,
				open: 'http://localhost:<%= connect.options.port %>/index.html'
			},
			server: {
			}
		},
		watch: {
			options: {
				livereload: true,
				files: [
					'js/*.js'
				]
			},
			tests: {
				files: ['tests/**/*.js', '{demo,css,images}/*.*'],
				tasks: ['karma:dev:run']
			},
			angular3: {
				files: ['tests/**/*.js', '{demo,css,images}/*.*'],
				tasks: ['karma:angular3:run']
			},
			demoLess: {
				files: ['demo/less/**/*.less'],
				tasks: ['less:demo']
			}
		},
		less: {
			demo: {
				files: {
					'demo/demo.css': 'demo/less/demo.less'
				}
			}
		},
		uglify: {
			options: {
				compress: {
					warnings: false
				},
				mangle: true
			},
			demo: {
				src: [
					'bower_components/jquery/jquery.js',
					'bower_components/angular/angular.js',
					'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
					'bower_components/google-code-prettify/src/prettify.js'
				],
				dest: 'demo/vendor.min.js'
			}
		},
		cssmin: {
			options: {
				shorthandCompacting: false,
				roundingPrecision: -1
			},
			demo: {
				files: {
					'demo/vendor.min.css': [
						'bower_components/bootstrap/dist/css/bootstrap.css',
						'bower_components/google-code-prettify/src/prettify.css'
					]
				}
			}
		},
		release: {
			options: {
				additionalFiles: ['bower.json']
			}
		}
	});

	//run tests only once (continuous integration mode)
//  grunt.registerTask('test', ['karma:ci']);
	grunt.registerTask('test', function() {
		console.log("running on environment: ", process.env.TREE_CI_ENV);
		if (process.env.TREE_CI_ENV == 'travis') {
			grunt.task.run(['karma:ci_travis']);
		}
		else {
			grunt.task.run(['karma:ci']);
		}
	});

	//to debug tests during 'grunt serve', open: http://localhost:8880/debug.html
	grunt.registerTask('serve', ['karma:dev', 'connect', 'watch']);
	grunt.registerTask('angular3', ['karma:angular3', 'watch:angular3']);
};