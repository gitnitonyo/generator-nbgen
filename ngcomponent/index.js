/**
 * Generates angular component with state and controller
 */

var util = require('util'),
    yeoman = require('yeoman-generator'),
    path = require('path'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    scriptBase = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');         // eslint-disable-line

var TmvGenerator = yeoman.Base.extend({})

util.inherits(TmvGenerator, scriptBase)

module.exports = TmvGenerator.extend({
    constructor: function() {
        yeoman.Base.apply(this, arguments)

        // This makes `name` a required argument.
        this.argument('name', {
            type: String,
            required: true,
            description: 'Module name'
        });


        this._lodash = _;       // make lodash functions available on templates
        this._s = _s;
    },

    initializing: function() {
        // initialization routine
        this.componentName = _s.camelize(this.name, true)
        this.controllerName = _s.capitalize(this.componentName) + 'Ctrl'
        this.componentElement = _s.dasherize(this.componentName)
        this.componentTitle = _s.humanize(this.componentName)

        this.moduleName = this.options.module || CONSTANTS.nbgenAppModuleName
        this.iconClass = this.options.iconClass || 'mdi-package'
    },

    prompting: {
        // functions for prompting parameters to be used in generation of codes
        // ask if want to add menu entry
        addMenuEntry: function() {
            var done = this.async();
            var prompts = [{
                type: 'confirm',
                name: 'addMenuEntry',
                default: true,
                message: 'Add menu entry?'
            }]

            this.prompt(prompts).then(function(props) {
                this.addMenuEntry = props.addMenuEntry
                done();
            }.bind(this))
        }
    },

    configuring: function() {
        if (this.abort) return;

        // save configuration into this.config

        // read config into configOptions for availability into the template
        this.configOptions = _.assign({}, this.defaultConfigOptions(), this.config.getAll());
        _.assign(this, this.configOptions);     // make config available on top level object
    },

    default: function() {
        if (this.abort) return;

        // any routine which will be executed before writing
    },

    writing: {
        // list of functions for executing template or copying files into the project folder
        writeTemplateFiles: function() {
            if (this.abort) return;
            // i18n file
            this.template('__ngcomponent.hjson', path.join(CONSTANTS.i18nDir, this.moduleName, this.componentName + '.hjson'))

            var destdir = path.join(CONSTANTS.componentsDir, this.moduleName)
            if (this.options['admin-menu']) {
                destdir = path.join(destdir, 'admin')
            }
            destdir = path.join(destdir, this.componentName)

            this.template('__ngcomponent.html', path.join(destdir, this.componentName + '.html'))
            this.template('__ngcomponent.js', path.join(destdir, this.componentName + '.js'))
            this.template('__ngcomponentConfig.js', path.join(destdir, this.componentName + 'Config.js'))
            this.template('__ngcomponent.scss', path.join(destdir, '_' + this.componentName + '.scss'))
            this.template('__ngcomponentState.html', path.join(destdir, this.componentName + 'State.html'))
            this.template('__ngcomponentState.js', path.join(destdir, this.componentName + 'State.js'))
        },

        injectMenuEntry: function() {
            if (this.abort) return;
            if (!this.addMenuEntry) return;
            var menuItemTemplate = [
                "{",
                "    menuId: '_<%= componentName %>',",
                "    label: 'global.menu.<%= componentName %>',",
                "    iconClass: '<%= iconClass %> mdi',",
                "    rolesAllowed: \"\",  // specify roles which can access this",
                "    action: 'sref:<%= componentName %>',",
                "},"
            ].join('\n')
            var menuItemStr = _.template(menuItemTemplate)(this)
            this.rewriteFile({
                file: CONSTANTS.nbgenAppMenuFile,
                needle: "// nbgen: menu entry will be added above; don't delete",
                splicable: menuItemStr.split('\n')
            })

            // put i18n entry into global.hjson
            var hjsonEntry = _.template('<%= componentName %>: "<%= componentTitle %>"')(this)
            this.rewriteFile({
                file: CONSTANTS.nbgenGlobalhjson,
                needle: '_menu_: "Menu items will be put here"',
                splicable: [ hjsonEntry ]
            })
        },
    },

    install: {
        // perform any post installation routine here
    },

    end: function() {
        // provide post generation messages
    }
})
