'use strict';

var util = require('util'),
    yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    _ = require('lodash'),
    fs = require('fs-extra'),
    path = require('path'),
    scriptBase = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');

var TmvClientGenerator = yeoman.Base.extend({});

util.inherits(TmvClientGenerator, scriptBase);

module.exports = TmvClientGenerator.extend({
    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.configOptions = _.assign({}, this.defaultConfigOptions(), this.config.getAll());
        _.assign(this, this.configOptions);
        this.webappDir = CONSTANTS.defaultWebappDir || 'src/webapp';
        this.path = path;
        this.CONSTANTS = CONSTANTS
        this.lodash = _;
    },
    initializing: function () {

    },
    prompting: function () {
        this.askForBasename();
    },
    configuring: {
        setBaseApp: function () {
            this.angularAppName = this.angularAppName || (this.baseName + 'App');
            this.title = _.startCase(this.baseName)
            this.config.set('title', this.title)
            this.config.set('angularAppName', this.angularAppName);
        },

        // check if meteor is installed
        checkIfMeteor: function() {
            if (this.abort) return;
            var done = this.async();
            this.isMeteorInstalled(function(code) {
                if (code !== 0) {
                    this.abort = true;
                }
                done();
            }.bind(this));
        },

        createMeteorProject: function() {
            if (this.abort) return;
            var done = this.async();
            this.log('Generating project...');
            fs.mkdirsSync(CONSTANTS.meteorDir);
            this.meteorExec(['create', '.'], function(code) {
                if (code !== 0) {
                    this.warning("Unable to generate meteor project");
                    this.abort = true;
                }
                done();
            }.bind(this))
        },

        removeMeteorPackages: function() {
            if (this.abort) return;
            var packagesToBeRemoved = [
                'autopublish',
                'insecure',
                'blaze-html-templates',
                'ecmascript',
                'standard-minifier-css',    // use fourseven:scss
            ];

            var done = this.async();
            this.meteorExec(['remove'].concat(packagesToBeRemoved), function(code) {
                if (code !== 0) {
                    this.warning('Error removing meteor packages');
                    this.abort = true;
                } else {
                    done();
                }
            }.bind(this))
        },

        // add used packages
        addMeteorPackages: function() {
            if (this.abort) return;
            var packagesToBeAdded = [
                'pbastowski:angular-babel',
                'check',
                'email',
                'http',
                'accounts-password',
                'accounts-facebook',
                'accounts-twitter',
                'service-configuration',
                'accounts-google',
                'urigo:static-templates',
                'tmeasday:publish-counts',
                'fourseven:scss',
                'seba:minifiers-autoprefixer',
                'alanning:roles',
                'mizzao:timesync',
                'mizzao:user-status',
                'jcbernack:reactive-aggregate',
            ];

            var done = this.async();
            this.log("Downloading packages...")
            this.meteorExec(['add'].concat(packagesToBeAdded), function(code) {
                if (code !== 0) {
                    this.warning('Error adding meteor packages');
                    this.abort = true;
                } else {
                    done()
                }
            }.bind(this))
        },

        cleanupProjectDir: function() {
            // remove directories and files which will be replaced
            var filesToRemove = [
                'package.json',
                '.gitignore',
                'client',
                'server',
                'private',
                'public',
                'imports',
            ]

            filesToRemove.forEach(function(file) {
                fs.removeSync(path.join(CONSTANTS.meteorDir, file))
            }.bind(this))
        }
    },
    default: function () {

    },
    writing: {
        // loads config
        loadConfigOptions() {
            this.configOptions = _.assign(this.configOptions, this.config.getAll())
        },

        writeClientFiles() {
            if (this.abort) return;
            var dirsToBeCopied = [
                'client',
                'imports',
                'private',
                'public',
                'server',
            ]
            var filesToBeCopied = [
                '__package.json',
                '__.gulpfile.js',
                '__.editorconfig',
                '__.gitignore',
                '__.eslintrc.json',
                '__.eslintignore',
            ]

            this.log("Copying files...")

            dirsToBeCopied.forEach(function(dir) {
                this.copyTemplateDir(path.join(CONSTANTS.meteorDir, dir))
            }.bind(this))

            filesToBeCopied.forEach(function(filename) {
                var src, dest
                if (_.startsWith(filename, '__')) {
                    src = path.join(CONSTANTS.meteorDir, filename)
                    dest = path.join(CONSTANTS.meteorDir, filename.substr(2))
                    this.template(src, dest, this)
                } else {
                    src = dest = path.join(CONSTANTS.meteorDir, filename)
                    this.fs.copy(this.templatePath(src), this.destinationPath(dest));
                }
            }.bind(this))
        },
    },
    install: {
        meteorUpdate: function() {
            var done = this.async();
            this.log('Updating packages...')
            this.meteorExec(['update', '--all-packages'], function(code) {
                if (code !== 0) {
                    this.warning("Error updating meteor")
                }
                done()
            }.bind(this))
        },
        meteorNpmInstall: function() {
            var done = this.async();
            this.log('Downloading & Installing node packages...')
            this.execCmd('meteor', ['npm', 'install'], {cwd: CONSTANTS.meteorDir}, function(code) {
                if (code !== 0) {
                    this.warning("Error installing node packages");
                    this.abort = true;
                }
                done();
            }.bind(this))
        },
        // add android platform
        /*
        meteorAddAndroid: function() {
            var done = this.async();
            this.log('Adding android platform...')
            this.meteorExec(['add-platform', 'android'], function(code) {
                if (code !== 0) {
                    this.warning("Error adding android platform")
                }
                done()
            }.bind(this))
        },
        */

        injectFiles: function() {
            this.injectFiles();
        },
    },
    end: function () {
        if (!this.abort) {
            this.config.set('appGenerated', true);
            this.log(chalk.green("\n\nApplication successfully generated\n"));
        }
    }
});
