
'use strict';

var util = require('util'),
    yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    _ = require('lodash'),
    path = require('path'),
    glob = require('glob'),
    CONSTANTS = require('./tmv-constants'),
    shelljs = require('shelljs'),
    exec = require('child_process').exec;

module.exports = Generator;

function Generator() {
    yeoman.Base.apply(this, arguments);
    this.env.options.appPath = this.config.get('appPath') || CONSTANTS.defaultWebappDir;
    this._s = _;
}

util.inherits(Generator, yeoman.Base);

// set default configuration
Generator.prototype.defaultConfigOptions = function() {
    var defaultValues = {
        nbgPrefix: 'nbgen',
        enableTranslation: true,
        nativeLanguage: 'en',
        languages: ['en'],
        serverType: 'meteor'
    };

    var result = {};

    _.forOwn(defaultValues, function(value, key) {
        result[key] = this.config.get(key) || value;
        this.config.set(key, result[key]);
    }.bind(this));

    return result;
};

Generator.prototype.warning = function() {
    var fullStr = Array.prototype.slice.call(arguments).join(' ');
    this.log(chalk.red(fullStr));
};

// execute a command using shelljs
Generator.prototype.execCmd = function(cmd, args, options, cb) {
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
};

// execute meteor
Generator.prototype.meteorExec = function(args, options, cb) {
    cb = arguments[arguments.length - 1];
    if (!options || arguments.length < 3) options = { };
    options.cwd = CONSTANTS.meteorDir;
    this.execCmd(CONSTANTS.meteorCmd, args, options, cb);
};

// check if meteor is installed
Generator.prototype.isMeteorInstalled = function(cb) {
    this.execCmd(CONSTANTS.meteorCmd, '--version', function(code) {
        if (code !== 0) {
            this.warning('meteor is not installed. Please install meteor first.');
        }
        cb && cb(code);
    }.bind(this))
};

Generator.prototype.getDefaultAppName = function () {
    return _.camelCase(path.basename(process.cwd()));
};

// ask for baseName
Generator.prototype.askForBasename = function() {
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
};

// write common files
Generator.prototype.writeCommonFiles = function() {
    this.copy('gitignore', '.gitignore');
    this.copy('gitattributes', '.gitattributes');
    this.copy('editorconfig', '.editorconfig');
    this.copy('jshintrc', '.jshintrc');
    this.copy('travis.yml', 'travis.yml');
};

/**
 ** A function to copy a directory from template path to the destination parh
 */
Generator.prototype.copyOrTemplateDir = function(sourceDir, justCopy, extraContext) {
    var sourcePath = this.sourceRoot() + '/' + sourceDir;
    var files = glob.sync('**', {nodir: true, cwd: sourcePath});
    justCopy = justCopy || false;

    files.forEach(function(file) {
        var baseFileName = path.basename(file);
        var src, dest;
        src = sourceDir + '/' + file;
        if (!justCopy && baseFileName.startsWith('_')) {
            // apply template
            dest = sourceDir + '/' + path.dirname(file) + '/' + baseFileName.substr(1);    // remove the leading '_'
            this.template(src, dest, this, extraContext || {});
        } else {
            // just copy
            dest = sourceDir + '/' + file;
            this.copy(src, dest);
        }
    }.bind(this));
};

/**
 ** A function to copy a directory from template path to the destination parh
 */
Generator.prototype.copyTemplateDir = function(sourceDir, filePattern, extraContext) {
    var sourcePath = this.sourceRoot() + '/' + sourceDir;
    filePattern = filePattern || '**';
    var files = glob.sync(filePattern, {nodir: true, cwd: sourcePath});

    files.forEach(function(file) {
        var baseFileName = path.basename(file);
        var src, dest;
        src = path.join(sourceDir, file);
        if (path.extname(baseFileName) === '.ejs' || _.startsWith(baseFileName, '__')) {
            // needs to be templated
            if (_.startsWith(baseFileName, '__')) {
                dest = path.join(sourceDir, path.dirname(file), baseFileName.substr(2))
            } else {
                dest = path.join(sourceDir, path.dirname(file), path.basename(baseFileName, '.ejs'))
            }
            this.template(src, dest, this, extraContext || {})
        } else {
            dest = path.join(sourceDir, file);
            this.fs.copy(this.templatePath(src), this.destinationPath(dest));
        }
    }.bind(this));
};


Generator.prototype._injectDependencies = function() {
    var done = this.async();
    this.execCmd('grunt', ['build-dev'], function(code) {
        if (code !== 0) {
            this.abort = true;
            this.warning("Unable to inject front-end dependencies");
        }
        done();
    }.bind(this))
};

Generator.prototype.rewrite = function rewrite(args) {
    // construct a regular expression for the text to be injected
    var reStr = '';
    args.splicable.forEach(function(line) {
        reStr += '\\s*' + _.escapeRegExp(line) + '\\s*\\n'
    })
    var re = new RegExp(reStr)

    if (re.test(args.haystack)) {
        return args.haystack;
    }

    var lines = args.haystack.split('\n');

    var otherwiseLineIndex = 0;
    lines.forEach(function(line, i) {
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

    lines.splice(otherwiseLineIndex, 0, args.splicable.map(function(line) {
        return spaceStr + line;
    })
        .join('\n'));

    return lines.join('\n');
};

Generator.prototype.rewriteFile = function rewriteFile(args) {
    args.path = args.path || process.cwd();
    var fullPath = path.join(args.path, args.file);

    args.haystack = this.fs.read(fullPath);
    var body = this.rewrite(args);

    this.fs.write(fullPath, body);
};

Generator.prototype.isNumber = function (input) {
    if (isNaN(this.filterNumber(input))) {
        return false;
    }
    return true;
};

Generator.prototype.isSignedNumber = function (input) {
    if (isNaN(this.filterNumber(input, true))) {
        return false;
    }
    return true;
};

Generator.prototype.isSignedDecimalNumber = function (input) {
    if (isNaN(this.filterNumber(input, true, true))) {
        return false;
    }
    return true;
};

Generator.prototype.filterNumber = function (input, isSigned, isDecimal) {
    var signed = isSigned ? '(\\-|\\+)?' : '';
    var decimal = isDecimal ? '(\\.[0-9]+)?' : '';
    var regex = new RegExp('^' + signed + '([0-9]+' + decimal + ')$');

    if (regex.test(input)) return Number(input);

    return NaN;
};

Generator.prototype.askForConfirmation = function(propertyName, promptMessage, defaultValue) {
    if (this.abort) return
    if (defaultValue === undefined) defaultValue = true
    var done = this.async()
    var prompts = [{
        type: 'confirm',
        name: propertyName,
        message: promptMessage,
        default: defaultValue
    }]

    this.prompt(prompts).then(function(props) {
        this[propertyName] = props[propertyName]
        done()
    }.bind(this))
}

Generator.prototype.injectFiles = function() {
    if (this.abort) return;
    var done = this.async();
    this.log('Injecting files...');
    this.execCmd('npm', ['run', 'gulp', '--', 'pre-dev'], function(code) {
        if (code !== 0) {
            this.warning('Unable to inject server files.')
            this.abort = true;
        }
        done();
    })
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

// _.classify uses _.titleize which lowercase the string,
// so if the user chooses a proper ClassName it will not rename properly
function classify(string) {
    string = string.replace(/[\W_](\w)/g, function (match) { return ' ' + match[1].toUpperCase(); }).replace(/\s/g, '');
    return string.charAt(0).toUpperCase() + string.slice(1);
}
