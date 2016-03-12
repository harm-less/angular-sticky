module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: [
				'/*',
				' * <%= pkg.name %>',
				' * <%= pkg.homepage %>\n',
				' * Version: <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
				' * License: <%= pkg.license %>',
				' */'
			].join('\n')
		},
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
				background: true,
				singleRun: false
			}
		},
		connect: {
			serve: {
				options: {
					livereload: true,
					port: 9000,
					open: 'http://localhost:<%= connect.serve.options.port %>/',
					base: 'demo'
				}
			}
		},
		watch: {
			options: {
				livereload: true,
				spawn: false,
				files: [
					'demo/*.css'
				]
			},
			tests: {
				files: ['tests/**/*.js', 'js/*.js'],
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
				dest: 'demo/scripts/src/'
			},
			dist: {
				expand: true,
				cwd: 'js/',
				src: '**',
				dest: 'dist/'
			}
		},
		clean: {
			grunt: [".grunt/assets"],
			dist: ["dist"]
		},
		less: {
			bootstrap: {
				files: {
					'.grunt/assets/bootstrap.css': 'demo/less/bootstrap/bootstrap.less'
				}
			},
			demo: {
				files: {
					'demo/demo.css': 'demo/less/demo.less'
				}
			}
		},
		usebanner: {
			dist: {
				options: {
					banner: '<%= meta.banner %>',
					linebreak: true
				},
				files: {
					src: ['dist/angular-sticky.js']
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
			},
			dist: {
				options: {
					banner: '<%= meta.banner %>'
				},
				files: [{
					expand: true,
					cwd: 'dist/',
					src: '**/*.js',
					dest: 'dist/',
					ext: '.min.js'
				}]
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
						'.grunt/assets/bootstrap.css'
					]
				}
			}
		},
		bump: {
			options: {
				files: [
					'package.json',
					'bower.json'
				],
				pushTo: 'origin',
				commitFiles: ['-a']
			}
		},
		'gh-pages': {
			demo: {
				options: {
					base: 'demo'
				},
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

	// builds the demo app
	grunt.registerTask('buildDemo', [
		'clean:grunt',
		'copy:bootstrap',
		'less:bootstrap',
		'cssmin:bootstrap',
		'copy:srcToDemo',
		'uglify:demo',
		'less:demo',
		'cssmin:demo'
	]);

	grunt.registerTask('build', [
		'clean:dist',
		'copy:dist',
		'uglify:dist',
		'usebanner:dist'
	]);

	// to debug tests during 'grunt serve', open: http://localhost:8880/debug.html
	grunt.registerTask('serve', [
		'buildDemo',
		'karma:dev',
		'connect',
		'watch'
	]);

	// builds and pushes the demo to the gh-pages branch
	grunt.registerTask('github-pages-update', [
		'buildDemo',
		'gh-pages:demo'
	]);

	grunt.registerTask('release', function() {
		var releaseType = grunt.option('releaseType') ? grunt.option('releaseType') : 'patch';
		grunt.task.run('bump-only:' + releaseType);
		grunt.task.run('build');
		grunt.task.run('bump-commit');
	});
};