/* global module */

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        yuidoc: {
            all: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
		        url: '<%= pkg.homepage %>',
                options: {
		        exclude: 'build,dist,doc',
                    paths: ['./src'],
                    outdir: 'doc/'
                }
            }
        },

        concat: {
            dist: {
                src: [  'src/copyright.js',
                        'src/Label.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },

        jshint: {
            all: ['src/*.js','!src/intro.js','!src/outro.js']
        },
    
	    qunit: {
            all: ['test/*.html']
        },
        
        uglify: {
              options: {
                 banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> Copyright by <%= pkg.author.name %> <%= pkg.author.email %> */\n'
              },
              build: {
                    src: 'dist/<%= pkg.name %>.js',
                    dest: 'dist/<%= pkg.name %>.min.js'
              }
        },
        cssmin:{
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'dist/<%= pkg.name %>.css': [
                        'src/*.css'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('check', ['jshint']);
    grunt.registerTask('test', ['qunit']);
    grunt.registerTask('jenkins', ['jshint', 'qunit']);
    grunt.registerTask('default', ['jshint', 'concat','cssmin', 'uglify']);
};
