/**
 * Template for creating new sub generator
 */

var _ = require('lodash'),
    _s = require('underscore.string'),
    chalk = require('chalk'),
    BaseGenerator = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');         // eslint-disable-line

class TmvGenerator extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);
    }
}

module.exports = TmvGenerator;

_.assign(TmvGenerator.prototype, {
    initializing() {
        // initialization routine
    },

    prompting: {
        // functions for prompting parameters to be used in generation of codes
        // checkForNewVersion() {
        //     if (this.abort) return;
        //     this.checkNewerVersion();
        // },
    },

    configuring() {
        if (this.abort) return;

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
        // add an android platform
        meteorAddAndroid: function() {
            if (this.abort) return;

            var done = this.async();
            this.log('Adding android platform...')
            this.meteorExec(['add-platform', 'android'], (code) => {
                if (code !== 0) {
                    this.warning("Error adding android platform");
                    this.abort = true;
                }
                done()
            })
        },
    },

    end() {
        // provide post generation messages
        if (!this.abort) {
            this.config.set('mobileGenerated', true);
            this.log(chalk.green("\n\nMobile device platforms successfully generated\n"));
        }
    }
})
