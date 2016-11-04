/**
 * For generating angular module
 */

var util = require('util'),
    yeoman = require('yeoman-generator'),
    _ = require('lodash'),
    path = require('path'),
    scriptBase = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');         // eslint-disable-line

var TmvNgModuleGenerator = yeoman.Base.extend({})

util.inherits(TmvNgModuleGenerator, scriptBase)

module.exports = TmvNgModuleGenerator.extend({
    constructor: function() {
        yeoman.Base.apply(this, arguments)

        // This makes `name` a required argument.
        this.argument('name', {
            type: String,
            required: true,
            description: 'Module name'
        });

        this._lodash = _;       // make lodash functions available on templates
    },

    initializing: function() {
        // initialization routine
        this.moduleName = _.camelCase(this.name)
        this.componentsDir = CONSTANTS.componentsDir
    },

    prompting: {
        // functions for prompting parameters to be used in generation of codes
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
        writeTemplates: function() {
            if (this.abort) return;

            this.template('__ngmodule.js', path.join(CONSTANTS.componentsDir, this.moduleName, this.moduleName + '.js'), this)
            this.template('__index.js', path.join(CONSTANTS.componentsDir, this.moduleName, 'index.js'), this)
        },

        // inject the module name into nb
        injectModuleIntoApp: function() {
            var importNeedle = '// nbgen: module imports will be placed above; don\'t delete'
            var injectNeedle = '// nbgen: modules will be injected above; don\'t delete'

            this.rewriteFile({
                file: CONSTANTS.mainModuleFile,
                needle: importNeedle,
                splicable: [`import ${this.moduleName} from './imports/ui/components/${this.moduleName}'`]
            })

            this.rewriteFile({
                file: CONSTANTS.mainModuleFile,
                needle: injectNeedle,
                splicable: [`${this.moduleName},`]
            })
        }
    },

    install: {
        // perform any post installation routine here
    },

    end: function() {
        // provide post generation messages
    }
})
