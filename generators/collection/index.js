'use strict';

var _ = require('lodash'),
    _s = require('underscore.string'),
    pluralize = require('pluralize'),
    prompts = require('./prompts'),
    path = require('path'),
    chalk = require('chalk'),
    stringifyObject = require('stringify-object'),
    BaseGenerator = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants')

class TmvCollectionGenerator extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);

        this.configOptions = _.assign({}, this.defaultConfigOptions(), this.config.getAll());
        _.assign(this, this.configOptions);

        // This makes `name` a required argument.
        this.argument('name', {
            type: String,
            required: true,
            description: 'Collection name'
        });

        this._s = _s;
        this._lodash = _;
        this.name = this.options.name;
    }
}

module.exports = TmvCollectionGenerator;

_.assign(TmvCollectionGenerator.prototype, {
    initializing () {
        if (this.abort) return;
        this.collectionName = _.camelCase(this.name);
        this.collections = this.collections || { };
        this.collection = this.collections[this.collectionName] || { };
        if (_.isEmpty(this.collection)) {
            this.collection.baseName = this.collectionName;
            this.collection.name = this.collectionNameCapitalized = _s.capitalize(this.collectionName);
            this.collection.documentName = pluralize(this.collectionName, 1);
            this.collection.documentNameCapitalized = _s.capitalize(this.collection.documentName);
            this.collection.componentName = `nbgen${this.collectionNameCapitalized}`
            this.collection.componentNameDashed = _s.dasherize(this.collection.componentName)
        }
        this.fields = this.collection.fields || [ ];

        if (!this.collection.options) this.collection.options = { }
        if (this.options['admin-menu'] !== undefined) {
            this.adminMenu = (this.options['admin-menu'] == true)
            this.collection.options.adminMenu = this.adminMenu
        } else {
            this.adminMenu = (this.collection.options.adminMenu == true)
        }

        this.iconClass = this.collection.options.iconClass || this.options.iconClass || 'mdi-package'
    },
    
    prompting: {
        // checkForNewVersion: function() {
        //    if (this.abort) return;
        //    this.checkNewerVersion();
        // },

        askIfServer() {
            if (this.abort) return;
            let prompt = 'Do you want to generate server files?'
            if (this.collection.options.regenerateServer !== undefined) {
                prompt = 'Do you want to regenerate server files?';
            }
            this.askForConfirmation('regenerateServer', prompt, false)
        },

        // would add audit log capability
        askIfAudit() {
            if (this.abort) return;
            if (this.regenerateServer !== false) {
                this.askForConfirmation('generateAuditLog', 'Do you want to include audit logs on collection operation?', true);
            }
        },

        askIfPublic() {
            if (this.abort) return;
            if (this.regenerateServer !== false) {
                this.askForConfirmation('isPublic', 'Will the documents be publicly available?', false)
            }
        },

        askToGenerateUI() {
            if (this.abort) return;
            this.askForConfirmation('generateUI', `Generate UI for ${this.collection.name}?`,
                !(this.collection.options && this.collection.options.generateUI))
        },
        
        askForFields() {
            if (this.abort) return;
            if (this.generateUI) {
                prompts.askForFields.call(this);
            }
        },

        askIfMenuEntry() {
            if (this.abort) return;
            if (this.generateUI) {
                this.askForConfirmation('addMenuEntry', 'Add menu entry?', false)
            }
        },

        askIfGenerateToolbar: function() {
            if (this.abort) return;
            if (this.generateUI) {
                this.askForConfirmation('generateToolbar', 'Generate Custom Action Toolbar', false);
            }
        }
    },

    configuring() {
        if (this.abort) return;
        this.collection.options.serverGenerated = true
        this.collection.options.generateUI = this.generateUI || this.collection.options.generateUI
        this.collection.options.isPublic = this.isPublic || this.collection.options.isPublic
        this.collection.fields = this.fields;
        this.collections[this.collectionName] = this.collection;
        this.config.set('collections', this.collections);
    },

    default() {
        if (this.abort) return;
    },

    writing: {
        writeServerFiles() {
            if (this.abort) return;
            if (this.regenerateServer === false) return;     // no server regeneration

            var files = [
                'permissions.js',
                'publish.js',
                'methods.js',
                'fixtures.js',
            ]

            // write the server files
            this.serverDest = path.join(CONSTANTS.defaultServerDir, 'imports/api', this.collectionName)
            this.template('server/__collection.js', path.join(this.serverDest, 'index.js'))

            files.forEach((filename) => {
                this.template(`server/__${filename}`, path.join(this.serverDest, filename))
            })

            this.serverIsGenerated = true;
        },

        generateListLayout() {
            if (this.abort) return;
            if (!this.generateUI) return;

            var listLayout = [ ]
            for (var i = 0; i < this.fields.length; i++) {
                if (i > 5) break;   // list layout is limited to 6 fields
                let { fieldInputType } = this.fields[i];
                let fieldObj = _.extend({}, this.fields[i])
                if (/date|time|datetime/.test(fieldInputType)) {
                    // use the display format specified in the input
                    let displayFormat = this.fields[i].displayFormat || 'MM/DD/YYYY';
                    fieldObj.value = `{{ ${this.fields[i].fieldName} | moment: 'format': '${displayFormat}'}}`
                    delete fieldObj.displayFormat;      // not needed anymore
                }

                if (/string|email/.test(fieldInputType)) {
                    fieldObj.searchField = [fieldObj.fieldName];
                }
                listLayout.push(fieldObj);
            }
            this.listLayoutString = stringifyObject(listLayout, {indent: Array(5).join(' ')})
                .replace(/\n/g, '\n' + Array(9).join(' '));
        },

        generateFormLayout() {
            if (this.abort) return;
            if (!this.generateUI) return;

            const formLayoutObj = { };
            // TODO: allow form groups looping
            formLayoutObj.formGroups = [];
            const formGroup = { cssClass: 'form-group-border' }
            formGroup.fields = this.fields;

            this.formLayoutString = stringifyObject(formLayoutObj, {indent: Array(5).join(' ')})
                .replace(/\n/g, '\n' + Array(17).join(' '));
        },

        writeClientFiles() {
            if (this.abort) return;
            if (!this.generateUI) return;

            var targetDir = path.join(CONSTANTS.uiAppDir, this.collectionName);
            this.clientDest = targetDir;
            var i18nDir = CONSTANTS.i18nDir;

            this.componentsImportDir = path.relative(targetDir, CONSTANTS.componentsDir);
            this.commonImportDir = path.relative(targetDir, CONSTANTS.commonDir);
            this.entryPointImportDir = path.relative(targetDir, CONSTANTS.clientDir);

            // i18n
            this.template('client/__collection.hjson', path.join(i18nDir, this.collectionName + '.hjson'))

            // collection controller js file
            this.template('client/__collection.js', path.join(targetDir, 'collection.js'))

            // configuration js file
            this.template('client/__collectionConfig.js', path.join(targetDir, 'config.js'))

            // listLayout js file
            this.template('client/__listLayout.js', path.join(targetDir, 'listLayout.js'))

            // formSchema js file
            this.template('client/__formSchema.js', path.join(targetDir, 'formSchema.js'))

            // setup js file
            this.template('client/__collectionSetup.js', path.join(targetDir, 'setup.js'))

            // collection-specific styles
            this.template('client/___collection.scss', path.join(targetDir, '_' + this.collectionName + '.scss'))

            // main entry point for this module
            this.template('client/__index.js', path.join(targetDir, 'index.js'));

            // action toolbar templates
            if (this.generateToolbar === true) {
                this.template('client/__actionToolbarFormView.html', path.join(targetDir, 'actionToolbarFormView.html'));
                this.template('client/__actionToolbarListView.html', path.join(targetDir, 'actionToolbarListView.html'));
            }

            this.clientIsGenerated = true;
        },

        injectMenuEntry() {
            if (this.abort) return;
            if (!this.addMenuEntry) return;
            var menuItemTemplate = [
                "{",
                "    menuId: '_<%= collectionName %>',",
                "    label: 'global.menu.<%= collectionName %>',",
                "    iconClass: '<%= iconClass %> mdi',",
                "    rolesAllowed: [ appRoles.NORMAL_USER ],  // specify roles which can access this",
                "    action: 'sref:<%= collectionName %>',",
                "},"
            ].join('\n')
            var menuItemStr = _.template(menuItemTemplate)(this)
            this.rewriteFile({
                file: CONSTANTS.nbgenAppMenuFile,
                needle: "// nbgen: menu entry will be added above; don't delete",
                splicable: menuItemStr.split('\n')
            })

            // put i18n entry into global.hjson
            var hjsonEntry = _.template('<%= collectionName %>: "<%= _s.titleize(_s.humanize(collection.name)) %>"')(this)
            this.rewriteFile({
                file: CONSTANTS.nbgenGlobalhjson,
                needle: '_menu_: "Menu items will be put here"',
                splicable: [ hjsonEntry ]
            })
        },
    },

    install: {
        injectFiles() {
            if (this.abort) return;
            this.injectFiles();
        },
    },

    end() {
        if (this.abort) return;
        this.log(chalk.green("\nCodes for managing Collection successfully generated.\n"));
        if (this.collectionTargetDir) {
            this.log(chalk.green("Collection js generated in " + chalk.magenta(this.collectionTargetDir) + "\n"));
        }
        if (this.serverDest) {
            this.log(chalk.green("Server files generated in " + chalk.magenta(this.serverDest) + "\n"));
        }
        if (this.clientDest) {
            this.log(chalk.green("Client files generated in " + chalk.magenta(this.clientDest) + "\n"));
        }
        this.log(chalk.green("You may customize these files if necessary.\n"));
    }
});
