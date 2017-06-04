module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	var serveStatic = require('serve-static');
	var modRewrite = require('connect-modrewrite');

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
			options: {
				port: 9000,
				// Change this to '0.0.0.0' to access the server from outside.
				hostname: 'localhost',
				livereload: 35729
			},
			livereload: {
				options: {
					debug: false,
					open: true,
					middleware: function (connect) {
						return [
							modRewrite(['^[^\\.]*$ /index.html [L]']),
							serveStatic('.tmp'),
							connect().use(
								'/bower_components',
								serveStatic('./bower_components')
							),
							connect().use(
								'/js',
								serveStatic('./js')
							),
							serveStatic('demo')
						];
					}
				}
			}
		},
		watch: {
			options: {
				livereload: true,
				spawn: false,
				files: [
					'.tmp/styles/*.css',

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
				dest: '.tmp/fonts/'
			},
			dist: {
				expand: true,
				cwd: 'js/',
				src: '**',
				dest: 'dist/'
			},
			demo: {
				expand: true,
				cwd: 'demo/',
				src: [
					'*.html',
					'views/**/*.html',
					'images/**/*'
				],
				dest: '.tmp/demo/'
			},
			demoBootstrap: {
				expand: true,
				cwd: '.tmp/',
				src: 'fonts/*',
				dest: '.tmp/demo/'
			}
		},
		clean: {
			tmp: ['.tmp/**/*'],
			grunt: ['.grunt/**/*'],
			dist: ['dist']
		},
		less: {
			bootstrap: {
				files: {
					'.tmp/styles/bootstrap.css': 'demo/less/bootstrap/bootstrap.less'
				}
			},
			demo: {
				files: {
					'.tmp/styles/demo.css': 'demo/less/demo.less'
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
		ngAnnotate: {
			demo: {
				files: [{
					expand: true,
					cwd: '.tmp/concat/scripts/',
					src: '*.js',
					dest: '.tmp/concat/scripts/'
				}]
			},
			dist: {
				files: [{
					expand: true,
					cwd: 'dist/',
					src: '*.js',
					dest: 'dist/'
				}]
			}
		},
		useminPrepare: {
			demo: {
				options: {
					flow: {
						html: {
							steps: {
								js: ['concat', 'uglify'],
								css: []
							}
						}
					},
					dest: '.tmp/demo'
				},
				src: ['demo/index.html']
			}
		},
		filerev: {
			demo: {
				src: [
					'.tmp/demo/scripts/*.js',
					'.tmp/demo/styles/*.css'
				]
			}
		},
		usemin: {
			html: '.tmp/demo/index.html',
			css: ['.tmp/demo/styles/*.css'],
			options: {
				assetsDirs: [
					'.tmp/demo'
				]
			}
		},
		cssmin: {
			options: {
				shorthandCompacting: false,
				roundingPrecision: -1
			}
		},
		bump: {
			options: {
				files: [
					'package.json',
					'bower.json'
				],
				updateConfigs: ['pkg'],
				pushTo: 'origin',
				commitFiles: ['-a']
			}
		},
		'npm-publish': {
		},

		'gh-pages': {
			demo: {
				options: {
					base: '.tmp/demo'
				},
				src: [
					'**/*'
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
	grunt.registerTask('prepareDemo', [
		'clean:tmp',
		'clean:grunt',
		'copy:bootstrap',
		'less:bootstrap',
		'less:demo'
	]);

	// builds the demo app
	grunt.registerTask('buildDemo', [
		'prepareDemo',
		'copy:demo',
		'copy:demoBootstrap',
		'useminPrepare:demo',
		'concat:generated',
		'ngAnnotate:demo',
		'cssmin:generated',
		'uglify:generated',
		'filerev:demo',
		'usemin'
	]);

	grunt.registerTask('build', [
		'clean:dist',
		'copy:dist',
		'ngAnnotate:dist',
		'uglify:dist',
		'usebanner:dist'
	]);

	// to debug tests during 'grunt serve', open: http://localhost:8880/debug.html
	grunt.registerTask('serve', [
		'prepareDemo',
		'karma:dev',
		'connect:livereload',
		'watch'
	]);

	// builds and pushes the demo to the gh-pages branch
	grunt.registerTask('github-pages-update', [
		'buildDemo',
		'gh-pages:demo'
	]);

	grunt.registerTask('release', function() {
		var releaseType = grunt.option('release-type') ? grunt.option('release-type') : 'patch';

		grunt.task.run('bump-only:' + releaseType);
		grunt.task.run('build');
		grunt.task.run('bump-commit');
		grunt.task.run('npm-publish');
	});
};