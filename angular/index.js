'use strict';

var util = require('util'),
    yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    _ = require('lodash'),
    path = require('path'),
    scriptBase = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');

var TmvAngularGenerator = yeoman.Base.extend({});

util.inherits(TmvAngularGenerator, scriptBase);

module.exports = TmvAngularGenerator.extend({
    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.configOptions = _.assign({}, this.defaultConfigOptions(), this.config.getAll());
        _.assign(this, this.configOptions);
        this._s = _;
    },
    initializing: {
        getArtifactGroup: function () {
            this.webappDir = CONSTANTS.defaultWebappDir;
            this.serverDir = CONSTANTS.defaultServerDir;
            this.angularAppName = this.angularAppName || (this.baseName + 'App');

            // get argument for the artifact group
            this.artifactGroup = this.args.toString() || '';
            if (this.artifactGroup.length === 0) {
                this.log(chalk.yellow("No artifact grouping is provided. Artifacts will be written on the app level folder"));
            }
            this.artifactGroup = _.upperFirst(this.artifactGroup);
            this._artifactGroup = _.camelCase(this.artifactGroup);
        },
        getCommandOptions: function() {
            // check if we need to generate state file
            this._generateState = this.options['state'];
            // if state is provided then controller is automatically generated
            this._generateController = this.options['controller'] || this._generateState;
            this._generateService = this.options['service'];
            this._generateDirective = this.options['directive'];

            // at least one of the options is specified
            this._hasOptions = !!(this._generateState || this._generateController ||
                this._generateService || this._generateDirective);
        }
    },
    prompting: function () {
        if (this.abort) return;
        if (this._generateState != undefined && this._generateService != undefined) return;
        var _this = this;
        var done = this.async();

        var prompts = [
            {
                type: 'confirm',
                name: 'generateState',
                default: true,
                message: 'Generate state?',
                when: function(response) {
                    return _this._generateState == undefined && !_this._hasOptions;
                }
            },
            {
                type: 'input',
                name: 'stateName',
                message: 'Enter state name:',
                validate: function (input) {
                    if (/^([a-zA-Z0-9_]*)$/.test(input)) return true;
                    return 'State name cannot contain special characters or a blank space, using the default name instead';
                },
                default: _this.artifactGroup,
                when: function(response) {
                    return _this._generateState == true || response.generateState == true;
                }
            },
            {
                type: 'confirm',
                name: 'generateController',
                default: true,
                message: 'Generate controller?',
                when: function(response) {
                    return _this._generateController == undefined && !_this._hasOptions;
                }
            },
            {
                type: 'input',
                name: 'controllerName',
                message: 'Enter controller name (\'Controller\' will be appended):',
                validate: function (input) {
                    if (/^([a-zA-Z0-9_]*)$/.test(input)) return true;
                    return 'Controller name cannot contain special characters or a blank space, using the default name instead';
                },
                default: function(response) {
                    if (typeof _this._generateState == 'string') {
                        return _.upperFirst(_this.generateState);
                    } else if (response.stateName) {
                        return _.upperFirst(response.stateName);
                    } else {
                        return _this.artifactGroup;
                    }
                },
                when: function(response) {
                    return _this._generateController == true || response.generateController == true;
                }
            },
            {
                type: 'confirm',
                name: 'generateService',
                default: false,
                message: 'Generate service?',
                when: function(response) {
                    return _this._generateService == undefined && !_this._hasOptions;
                }
            },
            {
                type: 'input',
                name: 'serviceName',
                message: 'Enter service name (\'Service\' will be appended):',
                validate: function (input) {
                    if (/^([a-zA-Z0-9_]*)$/.test(input)) return true;
                    return 'Service name cannot contain special characters or a blank space, using the default name instead';
                },
                default: _this.artifactGroup,
                when: function(response) {
                    return _this._generateService == true || response.generateService == true;
                }
            },
            {
                type: 'input',
                name: 'serviceUrl',
                message: 'Enter service URL. Providing a blank will create a blank service:',
                validate: function(input) {
                    if (/^([a-zA-Z0-9_\/]*)$/.test(input)) return true;
                    return 'Service url cannot contain special characters or a blank space, using the default name instead';
                },
                default: _this.options['serviceUrl'] || '',
                when: function(response) {
                    return !_this.options['serviceUrl'] && (_this._generateService || response.generateService == true);
                }
            },
            {
                type: 'confirm',
                name: 'generateDirective',
                default: false,
                message: 'Generate directive?',
                when: function(response) {
                    return _this._generateDirective == undefined && !_this._hasOptions;
                }
            },
            {
                type: 'input',
                name: 'directiveName',
                message: 'Enter directive name:',
                validate: function (input) {
                    if (/^([a-zA-Z0-9_]*)$/.test(input)) return true;
                    return 'Service name cannot contain special characters or a blank space, using the default name instead';
                },
                default: _this.artifactGroup,
                when: function(response) {
                    return _this._generateDirective == true || response.generateDirective == true;
                }
            },
            {
                type: 'confirm',
                name: 'includeDirectiveTemplate',
                message: 'Do you want to include a template for the directive',
                when: function(response) {
                    return _this._generateDirective == true || response.generateDirective == true;
                },
                default: true
            }
        ];

        this.prompt(prompts).then(function(props) {
            _this.stateName = props.stateName;
            _this.controllerName = props.controllerName;
            _this.serviceName = props.serviceName;
            _this.serviceUrl = props.serviceUrl;
            _this.directiveName = props.directiveName;
            _this.includeDirectiveTemplate = props.includeDirectiveTemplate
            done();
        });
    },
    configuring: {
        finalizeNames: function () {
            if (this.abort) return;
            var _this = this;

            _this.stateName = _this._generateState == undefined ? _this.stateName :
                (typeof _this._generateState == 'string' ? _this._generateState : (
                    _this._generateState === true ? _this.artifactGroup : undefined));

            _this.controllerName = _this._generateController == undefined ? _this.controllerName :
                (typeof _this._generateController == 'string' ? _this._generateController : (
                    _this._generateController === true ? _this.artifactGroup : undefined));

            _this.serviceName = _this._generateService == undefined ? _this.serviceName :
                (typeof _this._generateService == 'string' ? _this._generateService : (
                    _this._generateService === true ? _this.artifactGroup : undefined));

            _this.serviceUrl = _this.serviceUrl || _this.options['serviceUrl'];

            _this.directiveName = _this._generateDirective == undefined ? _this.directiveName :
                (typeof _this._generateDirective == 'string' ? _this._generateDirective : (
                    _this._generateDirective === true ? _this.artifactGroup : undefined));

            if (_this.stateName) _this.stateName = _.upperFirst(_this.stateName);
            if (_this.controllerName) _this.controllerName = _.upperFirst(_this.controllerName);
            if (_this.serviceName) _this.serviceName = _.upperFirst(_this.serviceName);
            if (_this.serviceName) _this.serviceName = _.upperFirst(_this.serviceName);
        }
    },
    default: function () {

    },
    writing: {
        writeClientFiles: function () {
            if (this.abort) return;
            var _this = this;
            var webappDir = _this.webappDir + '/';
            var i18ndir = 'src/i18n/en';

            if (_this.stateName) {
                // generate state

                // convenient access of camelize
                _this._stateName = _.camelCase(_this.stateName);

                var stateFilename = 'app/' + _this._artifactGroup + '/' +
                    _this._stateName + '.state.js';
                _this.template(webappDir + '_state.js',
                    webappDir + stateFilename, this, {});

                // i18n
                _this.template(i18ndir + '/_artifact.hjson',
                    i18ndir + '/' + _this._artifactGroup + '/' +
                    _this._stateName + '.hjson', this, {});

                // write the view for this state
                var templateLocation = 'src/views/app/' + _this._artifactGroup +
                    '/' + _this._stateName + '.html';
                _this.templateLocation = templateLocation;
                _this.template('src/views/_artifact.html',
                    _this.templateLocation, this, {});
            }

            if (_this.controllerName) {

                // convenient access of the camelize controller name
                _this._controllerName = _.camelCase(_this.controllerName);

                // generate controller
                _this.template(webappDir + '/_controller.js',
                    webappDir + 'app/' + _this._artifactGroup + '/' +
                    _this._controllerName + '.controller.js');
            }

            if (_this.serviceName) {
                // generate a service file
                _this._serviceName = _.camelCase(_this.serviceName);
                _this.template(webappDir + '/_service.js',
                    webappDir + 'app/' + _this._artifactGroup + '/' +
                    _this._serviceName + '.service.js');
            }

            if (_this.directiveName) {
                // generate a service file
                _this._directiveName = _.camelCase(_this.directiveName, true);
                _this.template(webappDir + '/_directive.js',
                    webappDir + 'app/' + _this._artifactGroup + '/' +
                    _this._directiveName + '.directive.js');
            }
        }
    },
    install: {
        injectDependencies: this._injectDependencies
    },
    end: function () {

    }
});
