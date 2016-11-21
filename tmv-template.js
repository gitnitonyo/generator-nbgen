/**
 * Template for creating new sub generator
 */

var util = require('util'),
    yeoman = require('yeoman-generator'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    chalk = require('chalk'),
    scriptBase = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');         // eslint-disable-line

var TmvGenerator = yeoman.Base.extend({})

util.inherits(TmvGenerator, scriptBase)

module.exports = TmvGenerator.extend({
    constructor: function() {
        scriptBase.apply(this, arguments)

        this._lodash = _;       // make lodash functions available on templates
        this._s = _s;
    },

    initializing: function() {
        // initialization routine
    },

    prompting: {
        // functions for prompting parameters to be used in generation of codes
        checkForNewerVersion: function() {
            if (this.abort) return;
            this.checkNewerVersion();
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
    },

    install: {
        // perform any post installation routine here
    },

    end: function() {
        // provide post generation messages
        this.log(chalk.green("Files successfully generated."));
    }
})
