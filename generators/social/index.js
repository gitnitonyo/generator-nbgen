let BaseGenerator = require('../tmv-generator-base')
    CONSTANTS = require('../tmv-constants')
    _ = require('lodash')
    _s = require('underscore.string')

class TmvGenerator extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);
    }
}

module.exports = TmvGenerator;

_.assign(TmvGenerator.prototype, {
    initializing: {
        // check if there's a base application present
        checkApp() {
            if (!this.configOptions.baseName) throw new Error("No base application found.")
        },

        checkIfAlreadyGenerated() {
            if (this.configOptions.socialSignin === true) throw new Error("Already generated.")
        }
    },

    prompting: {

    },

    configuring: {

    },

    default: {

    },

    writing: {
        writeClientFiles() {
            const sourceDir = this.templatePath('client/nbgenSocial'),
                  targetDir = this.destinationPath('client/imports/ui/components/nbgenSocial')

            this.copyFiles(sourceDir, targetDir);
        },

        injectHtmlCodes() {
            const needle = `<!--:nbgen:social-login-->`;
            let strToInject = this.fs.read(this.templatePath('client/_social.html.ejs'));
            strToInject = _.template(strToInject)(this);
            const targetFile = 'client/imports/ui/app/nbgenApp/nbgenLogin/nbgenLogin.html';
            this.rewriteFile({
                file: targetFile,
                needle,
                splicable: strToInject.split('\n')
            })
        },

        injectMenuEntry() {
            const needle = `/*:nbgen:social:service-configurations*/`;
            let strToInject = this.fs.read(this.templatePath('client/_menuEntry.ejs'));
            strToInject = _.template(strToInject)(this);
            const targetFile = 'client/imports/ui/app/nbgenApp/nbgenAppMenu.js';
            this.rewriteFile({
                file: targetFile,
                needle,
                splicable: strToInject.split(`\n`)
            })
        },

        injectModuleDeclarations() {
            const injectInfo = [{
                needle: `/*:nbgen:component:imports*/`,
                file: 'client/imports/ui/components/nbgenComponents/index.js',
                splicable: [`import nbgenSocial from '../nbgenSocial'`,]
            }, {
                needle: `/*:nbgen:component:modules*/`,
                file: 'client/imports/ui/components/nbgenComponents/index.js',
                splicable: [`nbgenSocial,`,]
            }, {
                needle: `/*:nbgen:component:exports*/`,
                file: 'client/imports/ui/components/nbgenComponents/index.js',
                splicable: [`nbgenSocial,`,]
            }]

            injectInfo.forEach(i => {
                this.rewriteFile(i);
            })
        },

        writeServerFiles() {
            const sourceDir = this.templatePath('server/serviceConfigurations'),
                  targetDir = this.destinationPath('server/imports/api/serviceConfigurations')
            
            this.copyFiles(sourceDir, targetDir);
        }
    },

    install: {
        installMeterAccountAccounts() {
            if (this.abort) return;
            let done = this.async();
            this.log('Adding social accounts modules to Meteor packages...');
            this.meteorExec(['add', 'accounts-google', 'accounts-facebook', 'accounts-twitter'], code => {
                if (code !== 0) {
                    this.log.warning('Error adding accounts module')
                }
                done();
            })
        },

        saveConfig() {
            this.config.set('socialSignin', true)
        }
    },

    end: {
        successMessage() {
            this.log(chalk.green('Authentication through social media enabled.'));
        }
    }
})