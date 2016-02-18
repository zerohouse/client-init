module.exports = function (grunt) {

    // 프로세스 시간 측정
    require('time-grunt')(grunt);

    // Load Npm process 자동화
    require('jit-grunt')(grunt, {
        useminPrepare: 'grunt-usemin',
        ngtemplates: 'grunt-angular-templates',
        cdnify: 'grunt-google-cdn',
        configureProxies: 'grunt-connect-proxy'
    });

    var config = {
        app: 'app',
        dist: 'dist',
        ngModule: 'app'
    };

    grunt.initConfig({
        config: config,

        watch: {
            bower: {
                files: ['bower.json'],
                tasks: ['wiredep']
            },
            js: {
                files: ['<%= config.app %>/{,*/}*.js'],
                tasks: ['newer:jshint:all', 'includeSource'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            jsTest: {
                files: ['test/spec/{,*/}*.js'],
                tasks: ['newer:jshint:test', 'karma']
            },
            less: {
                files: [
                    '<%= config.app %>/**/*.less'
                ],
                tasks: ['less', 'includeSource'],
                options: {
                    interrupt: true
                }
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= config.app %>/{,*/}*.html',
                    '<%= config.app %>/{,*/}*.js',
                    '<%= config.app %>/{,*/}*.css'
                ]
            }
        },

        // 서버 설정
        connect: {
            options: {
                port: 9000,
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                proxies: [
                    /* 소켓 사용할때
                     {
                     context: ['/socket'],
                     host: '127.0.0.1',
                     port: 8081,
                     ws: true
                     },
                     */
                    {
                        context: ['/api'],
                        host: '127.0.0.1',
                        port: 8080
                    }
                ],
                options: {
                    open: true,
                    middleware: function (connect) {
                        return [
                            require('grunt-connect-proxy/lib/utils').proxyRequest,
                            require('connect-modrewrite')(['!\\.html|\\.js|\\.ico|\\.svg|\\.css|\\.png|\\.gif|\\.jpg|\\.woff|\\.woff2|\\.ttf$ /index.html [L]']),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(config.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    port: 9001,
                    middleware: function (connect) {
                        return [
                            connect.static('test'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(config.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= config.dist %>'
                }
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= config.app %>/{,*/}*.js'
                ]
            },
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= config.dist %>/{,*/}*',
                        '!<%= config.dist %>/.git{,*/}*'
                    ]
                }]
            },
            server: '.tmp',
            template: '<%= config.app %>/template.js'
        },

        // Bower Dependency Index 파일에 넣기
        wiredep: {
            app: {
                src: ['<%= config.app %>/index.html'],
                ignorePath: /\.\.\//,
                fileTypes: {
                    html: {
                        block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
                        detect: {
                            js: /<script.*src=['"]([^'"]+)/gi,
                            css: /<link.*href=['"]([^'"]+)/gi
                        },
                        replace: {
                            js: '<script src="/{{filePath}}"></script>',
                            css: '<link rel="stylesheet" href="/{{filePath}}" />'
                        }
                    }
                }
            },
            test: {
                devDependencies: true,
                src: '<%= karma.unit.configFile %>',
                ignorePath: /\.\.\//,
                fileTypes: {
                    js: {
                        block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
                        detect: {
                            js: /'(.*\.js)'/gi
                        },
                        replace: {
                            js: '\'{{filePath}}\','
                        }
                    }
                }
            }
        },

        // Less 컴파일
        less: {
            src: {
                expand: true,
                src: "<%= config.app %>/**/*.less",
                ext: ".css"
            }
        },

        // Html 블락에 있는 내용 읽어서 다른 작업 수행함.
        useminPrepare: {
            html: '<%= config.app %>/index.html',
            options: {
                dest: '<%= config.dist %>',
                flow: {
                    html: {
                        steps: {
                            js: ['concat'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // ECMA 6 -> 5로 컴파일
        babel: {
            options: {
                presets: ['es2015']
            },
            dist: {
                files: {
                    'dist/scripts/scripts.js': 'dist/scripts/scripts.js'
                }
            }
        },

        uglify: {
            dist: {
                files: {
                    'dist/scripts/scripts.js': 'dist/scripts/scripts.js',
                    'dist/scripts/vendor.js': 'dist/scripts/vendor.js'
                }
            }
        },

        usemin: {
            html: ['<%= config.dist %>/{,*/}*.html'],
            css: ['<%= config.dist %>/{,*/}*.css'],
            js: ['<%= config.dist %>/{,*/}*.js'],
            options: {
                // cdn 된 것들은 유지하고 치환함.
                blockReplacements: {
                    js: (block) => {
                        var scripts = [];
                        block.src.forEach((src)=> {
                            if (src.startsWith("//"))
                                scripts.push(getScript(src));
                        });
                        scripts.push(getScript(block.dest));
                        return scripts.join(require('os').EOL);

                        function getScript(input) {
                            return '<script src="' + input + '"></script>';
                        }
                    }
                }
            }
        },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>/resources',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= config.dist %>/resources'
                }]
            }
        },

        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>/resources',
                    src: '{,*/}*.svg',
                    dest: '<%= config.dist %>/resources'
                }]
            }
        },

        // 소스파일들 변경시 index.html에 의존성 관계 주입함
        includeSource: {
            options: {
                basePath: '<%= config.app %>',
                baseUrl: '/'
            },
            templates: {
                html: {
                    js: '<script src="{filePath}"></script>',
                    css: '<link rel="stylesheet" type="text/css" href="{filePath}" />'
                }
            },
            myTarget: {
                files: {
                    'app/index.html': 'app/index.html'
                }
            }
        },

        // Html들 변환해서 캐시에 넣음
        ngtemplates: {
            dist: {
                options: {
                    prefix: '/',
                    module: '<%= config.ngModule %>'
                },
                cwd: '<%= config.app %>',
                src: ['**/*.html', '!index.html'],
                dest: '<%= config.app %>/template.js'
            }
        },

        // ngInject치환함.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'dist',
                    src: '**/*.js',
                    dest: 'dist'
                }]
            }
        },

        // CDN에 있는 내용으로 변환
        cdnify: {
            options: {
                cdn: require('next-cdn')
            },
            app: {
                html: ['<%= config.app %>/*.html']
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.app %>',
                    dest: '<%= config.dist %>',
                    src: [
                        'resources/**/*.*',
                        'index.html'
                    ]
                }]
            }
        },

        concurrent: {
            server: [
                'less'
            ],
            test: [
                'less'
            ],
            dist: [
                'less',
                'imagemin',
                'svgmin'
            ]
        },

        // 테스트 설정
        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                singleRun: true
            }
        }
    });


    grunt.registerTask('serve', 'Compile then start a connect web server', (target)=> {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'includeSource',
            'clean:server',
            'wiredep',
            'concurrent:server',
            'configureProxies:livereload',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('test', [
        'clean:server',
        'wiredep',
        'concurrent:test',
        'connect:test',
        'karma'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'jshint:all',
        'wiredep',
        'cdnify',
        'ngtemplates',
        'includeSource',
        'useminPrepare',
        'concurrent:dist',
        'concat',
        'copy:dist',
        'babel',
        'ngAnnotate',
        'cssmin',
        'usemin',
        'uglify',
        'clean:template'
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'test',
        'build'
    ]);
};
