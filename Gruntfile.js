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
			}
		},
		connect: {
			options: {
				livereload: true,
				port: 9000,
				open: 'http://localhost:<%= connect.options.port %>/',
				base: 'demo'
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
				files: ['tests/**/*.js'],
				tasks: ['karma:dev:run']
			},
			demoLess: {
				files: ['demo/less/**/*.less'],
				tasks: ['less:demo']
			},
			bootstrapLess: {
				files: ['demo/less/bootstrap/**/*.less'],
				tasks: ['less:bootstrap']
			}
		},
		copy: {
			bootstrap: {
				expand: true,
				cwd: 'bower_components/bootstrap/fonts/',
				src: '**',
				dest: 'demo/fonts/'
			},
			srcToDemo: {
				expand: true,
				cwd: 'js/',
				src: '**',
				dest: 'demo/scripts/'
			}
		},
		clean: {
			build: [".tmp"]
		},
		less: {
			bootstrap: {
				files: {
					'.tmp/bootstrap.css': 'demo/less/bootstrap/bootstrap.less'
				}
			},
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
					'bower_components/angular-ui-router/release/angular-ui-router.js',
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
						'bower_components/google-code-prettify/src/prettify.css'
					]
				}
			},
			bootstrap: {
				files: {
					'demo/bootstrap.min.css': [
						'.tmp/bootstrap.css'
					]
				}
			}
		},
		release: {
			options: {
				beforeBump: [
					'build'
				],
				additionalFiles: ['bower.json'],
				indentation: '\t'
			}
		},
		'gh-pages': {
			demo: {
				base: 'demo',
				src: [
					'*',
					'scripts/**/*',
					'fonts/**/*',
					'views/**/*'
				]
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

	grunt.registerTask('build', [
		'clean:build',
		'copy:bootstrap',
		'less:bootstrap',
		'cssmin:bootstrap',
		'copy:srcToDemo',
		'uglify:demo',
		'less:demo',
		'cssmin:demo'
	]);

	//to debug tests during 'grunt serve', open: http://localhost:8880/debug.html
	grunt.registerTask('serve', [
		'build',
		'karma:dev',
		'connect',
		'watch'
	]);
};