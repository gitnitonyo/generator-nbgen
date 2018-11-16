'use strict';

var util = require('util'),
    yeoman = require('yeoman-generator'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    pluralize = require('pluralize'),
    prompts = require('./prompts'),
    path = require('path'),
    chalk = require('chalk'),
    stringifyObject = require('stringify-object'),
    scriptBase = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');

var TmvCollectionGenerator = yeoman.Base.extend({});

util.inherits(TmvCollectionGenerator, scriptBase);

module.exports = TmvCollectionGenerator.extend({
    constructor: function () {
        scriptBase.apply(this, arguments);

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
    },
    initializing: function () {
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

        this.iconClass = this.options.iconClass || 'mdi-package'
    },
    prompting: {
        // checkForNewVersion: function() {
        //    if (this.abort) return;
        //    this.checkNewerVersion();
        // },
        askIfServer: function() {
            if (this.abort) return;
            this.askForConfirmation('regenerateServer', 'Do you want to regenerate server files?', false)
        },
        // would add audit log capability
        askIfAudit: function() {
            if (this.abort) return;
            if (this.regenerateServer !== false) {
                this.askForConfirmation('generateAuditLog', 'Do you want to include audit logs on collection operation?', true);
            }
        },
        askIfPublic: function() {
            if (this.abort) return;
            if (this.regenerateServer !== false) {
                this.askForConfirmation('isPublic', 'Will the documents be publicly available?', false)
            }
        },
        askToGenerateUI: function() {
            if (this.abort) return;
            this.askForConfirmation('generateUI', `Generate UI for ${this.collection.name}?`,
                !(this.collection.options && this.collection.options.generateUI))
        },
        askForFields: function() {
            if (this.abort) return;
            if (this.generateUI) {
                prompts.askForFields.call(this);
            }
        },
        askIfMenuEntry: function() {
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
    configuring: function () {
        if (this.abort) return;
        this.collection.options.serverGenerated = true
        this.collection.options.generateUI = this.generateUI || this.collection.options.generateUI
        this.collection.options.isPublic = this.isPublic || this.collection.options.isPublic
        this.collection.fields = this.fields;
        this.collections[this.collectionName] = this.collection;
        this.config.set('collections', this.collections);
    },
    default: function () {

    },
    writing: {
        writeServerFiles: function() {
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

            files.forEach(function(filename) {
                this.template(`server/__${filename}`, path.join(this.serverDest, filename))
            }.bind(this))

            this.serverIsGenerated = true;

            // inject import statement into the server's entry point
            /* no need the gulp process automatically handles this
            var needle = "// nbgen: imports for collections will be placed above; don't delete"
            this.rewriteFile({
                file: CONSTANTS.nbgenServerEntryPoint,
                needle: needle,
                splicable: [`import './imports/api/${this.collectionName}';`]
            })
            */
        },

        determineFieldInputType: function() {
            if (this.abort) return;
            if (!this.generateUI) return;

            // map the fieldType to fieldInputType
            this.fields.forEach((field) => {
                var fieldType = field.fieldType
                if (fieldType !== 'String') {
                    if (/(Long|Integer|Float|Double|BigDecimal)/.test(fieldType)) {
                        field.fieldInputType = 'number';
                    } else if (/Boolean/.test(fieldType)) {
                        field.fieldInputType = 'checkbox';
                    } else if (/Date/.test(fieldType)) {
                        field.fieldInputType = 'date';
                    }
                }
            })
        },

        generateListLayout: function() {
            if (this.abort) return;
            if (!this.generateUI) return;

            var listLayout = [ ]
            for (var i = 0; i < this.fields.length; i++) {
                if (i > 5) break;   // list layout is limited to 6 fields
                var fieldObj = {
                    fieldName: this.fields[i].fieldName,
                    value: "{{ " + this.fields[i].fieldName +
                        (this.fields[i].fieldInputType === 'data' ? ' | date: \'MM/dd/yyyy\'' : '') +
                        " }}"
                }
                if (this.fields[i].fieldType === 'String') {
                    fieldObj.searchField = [ this.fields[i].fieldName ];
                }
                listLayout.push(fieldObj);
            }
            this.listLayoutString = stringifyObject(listLayout, {indent: Array(5).join(' ')})
                .replace(/\n/g, '\n' + Array(9).join(' '));
        },

        generateFormLayout: function() {
            if (this.abort) return;
            if (!this.generateUI) return;

            var fields = _.cloneDeep(this.fields);
            // remove the fieldType field, it's not needed in the front-end
            fields.forEach((field) => {
                field.fieldType = undefined;
                // remove fields which are undefined
                _.each(field, (f, k) => {
                    if (f === undefined) {
                        delete field[k];
                    }
                })
            })
            this.fieldsString = stringifyObject(fields, {indent: Array(5).join(' ')})
                .replace(/\n/g, '\n' + Array(17).join(' '));
        },

        writeClientFiles: function() {
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
            this.template('client/__collection.js', path.join(targetDir, this.collectionName + 'Collection.js'))

            // configuration js file
            this.template('client/__collectionConfig.js', path.join(targetDir, this.collectionName + 'Config.js'))

            // setup js file
            this.template('client/__collectionSetup.js', path.join(targetDir, this.collectionName + 'Setup.js'))

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

        injectMenuEntry: function() {
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
            var hjsonEntry = _.template('<%= collectionName %>: "<%= _s.humanize(collection.name) %>"')(this)
            this.rewriteFile({
                file: CONSTANTS.nbgenGlobalhjson,
                needle: '_menu_: "Menu items will be put here"',
                splicable: [ hjsonEntry ]
            })
        },
    },
    install: {
        injectFiles: function() {
            if (this.abort) return;
            this.injectFiles();
        },
    },
    end: function () {
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
