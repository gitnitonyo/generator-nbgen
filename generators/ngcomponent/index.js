/**
 * Generates angular component with state and controller
 */

var path = require('path'),
    _ = require('lodash'),
    chalk = require('chalk'),
    _s = require('underscore.string'),
    BaseGenerator = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');         // eslint-disable-line

class TmvGenerator extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);

        // This makes `name` a required argument.
        this.argument('name', {
            type: String,
            required: true,
            description: 'Module name'
        });

        this.name = this.options.name;
    }
}

module.exports = TmvGenerator

_.assign(TmvGenerator.prototype, {
    initializing() {
        // initialization routine
        this.componentName = _s.camelize(this.name, true)
        this.controllerName = _s.capitalize(this.componentName) + 'Ctrl'
        this.componentElement = _s.dasherize(this.componentName)
        this.componentTitle = _s.humanize(this.componentName)
        this.stateControllerName = _s.capitalize(this.componentName) + 'StateCtrl';

        this.moduleName = this.options.module || CONSTANTS.nbgenAppModuleName
        this.iconClass = this.options.iconClass || 'mdi-package'
    },

    prompting: {
        // functions for prompting parameters to be used in generation of codes
        // checkForNewVersion() {
        //     if (this.abort) return;
        //     this.checkNewerVersion();
        // },

        // ask if want to add menu entry
        askToGenerateState() {
            if (this.abort) return;
            this.askForConfirmation('generateState', 'Generate Router UI state?', true);
        },

        askToAddMenuEntry() {
            if (this.abort || !this.generateState) return;
            this.askForConfirmation('addMenuEntry', 'Add menu entry?', true);
        }
    },

    configuring() {
        if (this.abort) return;

        // save configuration into this.config

        // read config into configOptions for availability into the template
        this.configOptions = _.assign({}, this.defaultConfigOptions(), this.config.getAll());
        _.assign(this, this.configOptions);     // make config available on top level object
    },

    default() {
        if (this.abort) return;

        // any routine which will be executed before writing
    },

    writing: {
        // list of functions for executing template or copying files into the project folder
        writeTemplateFiles() {
            if (this.abort) return;
            var destdir = path.join(CONSTANTS.uiAppDir, this.componentName);
            this.clientDest = destdir;

            this.templateLocation = path.join(destdir, this.componentName + '.html')

            this.template('__ngcomponent.html.ejs', this.templateLocation);
            this.template('__ngcomponent.js.ejs', path.join(destdir, this.componentName + 'Ctrl.js'))
            this.template('__ngcomponentConfig.js.ejs', path.join(destdir, this.componentName + 'Config.js'))
            this.template('__ngcomponent.scss.ejs', path.join(destdir, '_' + this.componentName + '.scss'))
            if (this.generateState) {
                // i18n file
                this.template('__ngcomponent.hjson.ejs', path.join(destdir, 'i18n/en', this.componentName + '.hjson'))
                this.template('__ngcomponentState.html.ejs', path.join(destdir, this.componentName + 'State.html'))
                this.template('__ngcomponentState.js.ejs', path.join(destdir, this.componentName + 'State.js'))
            }
        },

        injectMenuEntry() {
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
        injectFiles() {
            if (this.abort) return;
            this.injectFiles();
        },
    },

    end() {
        if (this.abort) return;
        // provide post generation messages
        this.log(chalk.green("\nAngular component successfully generated.\n"));
        if (this.clientDest) {
            this.log(chalk.green("Files are generated in " + chalk.magenta(this.clientDest)));
        }
    }
})
