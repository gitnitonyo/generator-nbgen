
'use strict';

var Generator = require('yeoman-generator'),
    chalk = require('chalk'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    path = require('path'),
    fg = require('fast-glob'),
    CONSTANTS = require('./tmv-constants'),
    packagejs = require('../package.json'),
    semver = require('semver'),
    shelljs = require('shelljs');

/**
 * Base Generator class to be extended by main and sub generators
 */
class BaseGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.configOptions = _.extend({}, this.defaultConfigOptions(), this.config.getAll());
        _.assign(this, this.configOptions);
        this._lodash = _;
        this._s = _s;
    }

    /**
     * Provides default options for the generator
     */
    defaultConfigOptions() {
        var defaultValues = {
            nbgPrefix: 'nbgen',
            enableTranslation: true,
            nativeLanguage: 'en',
            languages: ['en'],
            serverType: 'meteor'
        };

        return defaultValues;
    }

    /**
     * Display warning message
     */
    warning() {
        var fullStr = Array.prototype.slice.call(arguments).join(' ');
        this.log(chalk.red(fullStr));   
    }

    /**
     * Execute specified command using shelljs
     * @param {*} cmd command to execute
     * @param {*} args array of parameters
     * @param {*} options default options {async: true, silent: true}, consult shelljs for available options
     * @param {*} cb callback
     */
    execCmd(cmd, args, options, cb) {
        cb = arguments[arguments.length - 1];
        if (arguments.length < 4) {
            options = { };
        }
        if (_.isNil(options.async)) { //eslint-disable-line
            options.async = true;
        }

        if (_.isNil(options.silent)) { // eslint-disable-line
            options.silent = true;
        }
        if (!Array.isArray(args)) { // eslint-disable-line
            args = [args];
        }
        var commandStr = cmd + ' ' + args.join(' ');
        shelljs.exec(commandStr, options, cb);
    }

    /**
     * Executes meteor commands
     * @param {*} args array of arguments to be passed
     * @param {*} options shelljs options
     * @param {*} cb callback
     */
    meteorExec(args, options, cb) {
        cb = arguments[arguments.length - 1];
        if (!options || arguments.length < 3) options = { };
        options.cwd = CONSTANTS.meteorDir;
        this.execCmd(CONSTANTS.meteorCmd, args, options, cb);
    }

    /**
     * Check if meteor is installed
     * @param {*} cb  callback
     */
    isMeteorInstalled(cb) {
        this.execCmd(CONSTANTS.meteorCmd, '--version', (code) => {
            if (code !== 0) {
                this.warning('meteor is not installed. Please install meteor first.');
            }
            cb && cb(code);
        })
    }

    /**
     * Returns a default application name based on current directory name
     */
    getDefaultAppName() {
        return _.camelCase(path.basename(process.cwd()));
    }

    /**
     * Prompt user for application base name
     */
    askForBasename() {
        if (this.abort) return;
        if (this.baseName) return;     // baseName already set
        var _this = this;
        var done = this.async();
        var prompts = [
            {
                type: 'input',
                name: 'baseName',
                validate: function (input) {
                    if (/^([a-zA-Z0-9_]*)$/.test(input)) return true;
                    return 'Your application name cannot contain special characters or a blank space, using the default name instead';
                },
                message: 'Please enter the application name:',
                default() {
                    return _this.getDefaultAppName();
                }
            }
        ];

        this.prompt(prompts).then((response) => {
            this.configOptions.baseName = this.baseName = response.baseName;
            this.config.set('baseName', this.baseName);
            done();
        })
    }

    template(source, target, context) {
        context = context || this;
        this.fs.copyTpl(this.templatePath(source), this.destinationPath(target), context);
    }

    rewrite(args) {
        // construct a regular expression for the text to be injected
        var reStr = '';
        args.splicable.forEach((line) => {
            reStr += '\\s*' + _.escapeRegExp(line) + '\\s*\\n'
        })
        var re = new RegExp(reStr)

        if (re.test(args.haystack)) {
            return args.haystack;
        }

        var lines = args.haystack.split('\n');

        var otherwiseLineIndex = 0;
        lines.forEach((line, i) => {
            if (line.indexOf(args.needle) !== -1) {
                otherwiseLineIndex = i;
            }
        });

        var spaces = 0;
        while (lines[otherwiseLineIndex].charAt(spaces) === ' ') {
            spaces += 1;
        }

        var spaceStr = '';
        while ((spaces -= 1) >= 0) {
            spaceStr += ' ';
        }

        lines.splice(otherwiseLineIndex, 0, args.splicable.map((line) => {
            return spaceStr + line;
        }).join('\n'));

        return lines.join('\n');
    }

    rewriteFile(args) {
        args.path = args.path || process.cwd();
        var fullPath = path.join(args.path, args.file);

        args.haystack = this.fs.read(fullPath);
        var body = this.rewrite(args);

        this.fs.write(fullPath, body);
    }

    isNumber(input) {
        if (isNaN(this.filterNumber(input))) {
            return false;
        }
        return true;
    }

    isSignedNumber(input) {
        if (isNaN(this.filterNumber(input, true))) {
            return false;
        }
        return true;
    }

    isSignedDecimalNumber(input) {
        if (isNaN(this.filterNumber(input, true, true))) {
            return false;
        }
        return true;
    }

    filterNumber(input, isSigned, isDecimal) {
        var signed = isSigned ? '(\\-|\\+)?' : '';
        var decimal = isDecimal ? '(\\.[0-9]+)?' : '';
        var regex = new RegExp('^' + signed + '([0-9]+' + decimal + ')$');

        if (regex.test(input)) return Number(input);

        return NaN;
    }

    askForConfirmation(propertyName, promptMessage, defaultValue) {
        if (this.abort) return
        if (defaultValue === undefined) defaultValue = true
        var done = this.async()
        var prompts = [{
            type: 'confirm',
            name: propertyName,
            message: promptMessage,
            default: defaultValue
        }]

        this.prompt(prompts).then((props) => {
            this[propertyName] = props[propertyName]
            done()
        })
    }

    injectFiles() {
        if (this.abort) return;
        var done = this.async();
        this.log('Injecting files...');
        this.execCmd('meteor npm', ['run', 'gulp', '--', 'pre-dev'], function(code) {
            if (code !== 0) {
                this.warning('Unable to inject server files.')
                this.abort = true;
            }
            done();
        })
    }

    checkNewerVersion() {
        if (this.abort) return;
        var done = this.async();
        this.log('Checking for newer version...');
        // check for newer version from npm registry
        var name = this.config.name;

        try {
            shelljs.exec('npm show ' + name + ' version', {silent: true}, (code, stdout, stderr) => {
                if (!stderr && semver.lt(packagejs.version, stdout)) {
                    this.log(
                        chalk.yellow(' ______________________________________________________________________________\n\n') +
                        chalk.yellow('  nbgen update available: ') + chalk.green.bold(stdout.replace('\n','')) + chalk.gray(' (current: ' + packagejs.version + ')') + '\n' +
                        chalk.yellow('  Run ' + chalk.magenta('npm install -g ' + name ) + ' to update.\n') +
                        chalk.yellow(' ______________________________________________________________________________\n')
                    );
                    var prompts = [{
                        type: 'confirm',
                        name: 'continueWithoutUpdate',
                        message: 'There is a newer version available. Would you like to continue?',
                        default: false,
                    }]

                    this.prompt(prompts).then((props) => {
                        if (!props.continueWithoutUpdate) {
                            this.abort = true;
                        }
                        done();
                    })
                } else {
                    done();
                }
            })
        }
        catch(err) {
            // no need stop processing if checking of version fails
            done();
        }
    }

    /**
     * Copy files
     */
    copyFiles(sourceDir, targetDir, pattern, options) {
        options = options || { };
        pattern = pattern || '**';
        options.cwd = sourceDir;
        options.dot = true;
        
        const files = fg.sync(pattern, options);
        files.forEach(file => {
            this.fs.copy(path.resolve(sourceDir, file), path.resolve(targetDir, file));
        })
    }
}

module.exports = BaseGenerator;
