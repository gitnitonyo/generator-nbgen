'use strict';

var chalk = require('chalk'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    path = require('path'),
    BaseGenerator = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants')

class TmvClientGenerator extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);
        
        this.webappDir = CONSTANTS.defaultWebappDir || 'src/webapp';
        this.path = path;
        this.CONSTANTS = CONSTANTS
    }
}

module.exports = TmvClientGenerator

_.assign(TmvClientGenerator.prototype, {
    initializing: {
        // check if meteor is installed
        checkIfMeteor() {
            if (this.abort) return;
            var done = this.async();
            this.isMeteorInstalled((code) => {
                if (code !== 0) {
                    this.abort = true;
                }
                done();
            });
        }
    },

    prompting: {
        checkForNewVersion() {
            if (this.abort) return;
            this.checkNewerVersion();
        },

        askBasename() {
            if (this.abort) return;
            this.askForBasename();
        },

        askToIncludeSocial() {
            if (this.abort) return;
            this.askForConfirmation('includeSocialSignin', 
                'Do you want to include Authentication through social media?',
                true)
        }
    },

    configuring: {
        setBaseApp () {
            if (this.abort) return;
            this.baseName = _.camelCase(this.baseName);
            this.angularAppName = this.angularAppName || (this.baseName + 'App');
            this.title = _s.titleize(_s.humanize(this.baseName))
            this.dasherizedName = _s.dasherize(this.baseName)
            this.config.set('title', this.title)
            this.config.set('angularAppName', this.angularAppName);
            this.config.set('dasherizedName', this.dasherizedName)
        },
    },

    default: function () {
        if (this.abort) return;
    },

    writing: {
        // loads config
        loadConfigOptions() {
            if (this.abort) return;
            this.configOptions = _.assign(this.configOptions, this.config.getAll())
        },

        // copy files
        copyProjectFiles() {
            if (this.abort) return;
            const FILES_TO_COPY=[
                '**',                // all files except files mentioned below
                '!.DS_Store',
                '!node_modules',
                '!.meteor/local',
                '!resources/android',
                '!resources/ios',
                '!.meteor/.id',         // this should be unique for each app
                '!public/assets/i18n',  // generated i18n files
                '!.git',                // exclude .git
                '!.yo-rc.json',         // don't copy the yo config
            ]

            this.copyFiles(this.templatePath('app'), this.destinationPath(), FILES_TO_COPY);
        },

        // change the app name in package.json
        changeAppnameInPackageJson() {
            const file = this.destinationPath('package.json');
            const pkg = this.fs.readJSON(file);
            pkg.name = this.dasherizedName;
            pkg.description = `Baseline code for ${this.baseName} app`
            const pkgStr = JSON.stringify(pkg, null, 2);
            this.fs.write(file, pkgStr);
        },

        // replace id and appname in mobile-config.js
        changeAppInfoInMobileConfig() {
            // strings to be replaced
            let appIdStr = "id: 'com.nubevtech.nbgen-app'";
            let appNameStr = "name: 'nbgen-app'";

            let newAppIdStr = `id: 'com.nubevtech.${this.dasherizedName}'`;
            let newAppNameStr = `name: '${this.dasherizedName}'`;

            const file = this.destinationPath('mobile-config.js');
            let contents = this.fs.read(file);
            contents = contents.replace(appIdStr, newAppIdStr).replace(appNameStr, newAppIdStr);
            this.fs.write(file, contents);
        },

        // replace name of the application
        changeAppNameInConfig() {
            const configFile = 'client/imports/ui/app/nbgenApp/nbgenAppConfig.js';
            const strToReplace = `"nbGenAppBase"`
            const newStr = `"${this.title}"`

            const file = this.destinationPath(configFile);
            let contents = this.fs.read(file);
            contents = contents.replace(strToReplace, newStr);
            this.fs.write(file, contents);
        },

        // social signin
        isSocialSignin() {
            if (this.includeSocialSignin) {
                this.composeWith('nbgen:social', {})
            }
        }
    },

    install: {
        meteorUpdate() {
            if (this.abort) return;
            var done = this.async();
            this.log('Updating packages...')
            this.meteorExec(['update', '--release', '1.8.1', '--all-packages'], (code) => {
                if (code !== 0) {
                    this.warning("Error updating meteor")
                }
                done()
            })
        },

        meteorNpmInstall() {
            if (this.abort) return;
            var done = this.async();
            this.log('Downloading & Installing node packages...')
            this.execCmd('meteor', ['npm', 'install'], {cwd: CONSTANTS.meteorDir}, (code) => {
                if (code !== 0) {
                    this.warning("Error installing node packages");
                    this.abort = true;
                }
                done();
            })
        },

        injectFiles() {
            if (this.abort) return;
            this.injectFiles();
        },
    },
    end() {
        if (this.abort) return;
        this.config.set('appGenerated', true);
        this.log(
            chalk.green("\n\nApplication successfully generated.\n") +
            chalk.green("Please modify email settings in " + chalk.magenta("server/imports/api/email/fixtures.js") + " for email notifications to properly work.\n") +
            chalk.green(chalk.magenta('npm start') + ' to start the application.\n') +
            chalk.green("Initial credentials:\n") +
            chalk.green("super-admin: " + chalk.magenta('superAdmin@nubevtech.com/NubeVision$_') + "\n") +
            chalk.green("normal-user: " + chalk.magenta('normalUser@nubevtech.com/normalUser$_') + "\n")
        );
    }
});
