"use strict";

var chalk = require('chalk'),
    _ = require('lodash'),
    _s = require('underscore.string');

module.exports = {
    askForFields,
};

function askForFields() {
    if (this.abort) return;
    var done = this.async();
    askForField.call(this, done);
}

/**
 * ask question for a field creation
 */
function askForField(cb) {
    this.log(chalk.green('\nGenerating field #' + (this.fields.length + 1) + '\n'));
    var prompts = [
        {
            type: 'input',
            name: 'fieldName',
            validate: function (input) {
                if (!(/^([a-zA-Z0-9_]*)$/.test(input))) {
                    return 'Your field name cannot contain special characters';
                }
                // check if fieldName is already used in the current collection
                var field = _.find(this.fields, function(fld) {
                    return _.toLower(input) == _.toLower(fld.fieldName);
                });
                if (field) {
                    this.warning("\n`" + input + "` is already defined. Will overwite the existing field definition.")
                }
                return true;
            }.bind(this),
            message: 'What is the name of the field (Blank to finish)?'
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0;
            },
            type: 'list',
            name: 'fieldType',
            message: 'What is the type of your field?',
            choices: [
                {
                    value: 'String',
                    name: 'String'
                },
                {
                    value: 'Integer',
                    name: 'Integer'
                },
                {
                    value: 'Long',
                    name: 'Long'
                },
                {
                    value: 'Float',
                    name: 'Float'
                },
                {
                    value: 'Double',
                    name: 'Double'
                },
                {
                    value: 'BigDecimal',
                    name: 'BigDecimal'
                },
                {
                    value: 'DateTime',
                    name: 'DateTime'
                },
                {
                    value: 'Date',
                    name: 'Date',
                },
                {
                    value: 'Boolean',
                    name: 'Boolean'
                },
                /*
                {
                    value: 'Object',
                    name: 'Object'
                }
                */
            ],
            default: 0
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldType == 'String';
            },
            type: 'checkbox',
            name: 'fieldValidateRules',
            message: 'Which validation rules do you want to add?',
            choices: [
                {
                    name: 'Required',
                    value: 'required'
                },
                {
                    name: 'Minimum length',
                    value: 'minlength'
                },
                {
                    name: 'Maximum length',
                    value: 'maxlength'
                },
                {
                    name: 'Regular expression pattern',
                    value: 'pattern'
                }
            ],
            default: 0
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    (response.fieldType === 'Integer' ||
                    response.fieldType === 'Long' ||
                    response.fieldType === 'Float' ||
                    response.fieldType === 'Double' ||
                    response.fieldType === 'BigDecimal');
            },
            type: 'checkbox',
            name: 'fieldValidateRules',
            message: 'Which validation rules do you want to add?',
            choices: [
                {
                    name: 'Required',
                    value: 'required'
                },
                {
                    name: 'Minimum',
                    value: 'min'
                },
                {
                    name: 'Maximum',
                    value: 'max'
                }
            ],
            default: 0
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    (response.fieldType === 'LocalDate' ||
                    response.fieldType === 'DateTime' ||
                    response.fieldType === 'Boolean');
            },
            type: 'checkbox',
            name: 'fieldValidateRules',
            message: 'Which validation rules do you want to add?',
            choices: [
                {
                    name: 'Required',
                    value: 'required'
                }
            ],
            default: 0
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldValidateRules &&
                    response.fieldValidateRules.indexOf('minlength') !== -1;
            },
            type: 'input',
            name: 'fieldValidateRulesMinlength',
            validate: function (input) {
                if (this.isNumber(input)) return true;
                return 'Minimum length must be a positive number';
            }.bind(this),
            message: 'What is the minimum length of your field?',
            default: 0
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldValidateRules && response.fieldValidateRules.indexOf('maxlength') !== -1;
            },
            type: 'input',
            name: 'fieldValidateRulesMaxlength',
            validate: function (input) {
                if (this.isNumber(input)) return true;
                return 'Maximum length must be a positive number';
            }.bind(this),
            message: 'What is the maximum length of your field?',
            default: 20
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldValidateRules &&
                    response.fieldValidateRules.indexOf('min') !== -1 &&
                    (response.fieldType === 'Integer' ||
                    response.fieldType === 'Long');
            },
            type: 'input',
            name: 'fieldValidateRulesMin',
            message: 'What is the minimum of your field?',
            validate: function (input) {
                if (this.isSignedNumber(input)) return true;
                return 'Minimum must be a number';
            }.bind(this),
            default: 0
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldValidateRules &&
                    response.fieldValidateRules.indexOf('max') !== -1 &&
                    (response.fieldType === 'Integer' ||
                    response.fieldType === 'Long');
            },
            type: 'input',
            name: 'fieldValidateRulesMax',
            message: 'What is the maximum of your field?',
            validate: function (input) {
                if (this.isSignedNumber(input)) return true;
                return 'Maximum must be a number';
            }.bind(this),
            default: 100
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldValidateRules &&
                    response.fieldValidateRules.indexOf('min') !== -1 &&
                    (response.fieldType === 'Float' ||
                    response.fieldType === 'Double' ||
                    response.fieldType === 'BigDecimal');
            },
            type: 'input',
            name: 'fieldValidateRulesMin',
            message: 'What is the minimum of your field?',
            validate: function (input) {
                if (this.isSignedDecimalNumber(input, true)) return true;
                return 'Minimum must be a decimal number';
            }.bind(this),
            default: 0
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldValidateRules &&
                    response.fieldValidateRules.indexOf('max') !== -1 &&
                    (response.fieldType === 'Float' ||
                    response.fieldType === 'Double' ||
                    response.fieldType === 'BigDecimal');
            },
            type: 'input',
            name: 'fieldValidateRulesMax',
            message: 'What is the maximum of your field?',
            validate: function (input) {
                if (this.isSignedDecimalNumber(input, true)) return true;
                return 'Maximum must be a decimal number';
            }.bind(this),
            default: 100
        },
        {
            when: function (response) {
                return response.fieldName && response.fieldName.length > 0 &&
                    response.fieldValidateRules &&
                    response.fieldValidateRules.indexOf('pattern') !== -1;
            },
            type: 'input',
            name: 'fieldValidateRulesPattern',
            message: 'What is the regular expression pattern you want to apply on your field?',
            default: '^[a-zA-Z0-9]*$'
        }
    ];

    this.prompt(prompts).then(function (props) {
        if (props.fieldName && props.fieldName.length > 0) {
            var field = {
                fieldName: props.fieldName,
                fieldType: props.fieldType,
                fieldValidateRulesRequired: (props.fieldValidateRules && props.fieldValidateRules.indexOf('required') !== -1) ? true : undefined,
                fieldValidateRulesMinlength: props.fieldValidateRulesMinlength,
                fieldValidateRulesMaxlength: props.fieldValidateRulesMaxlength,
                fieldValidateRulesPattern: props.fieldValidateRulesPattern,
                fieldValidateRulesPatternJava: props.fieldValidateRulesPattern ? props.fieldValidateRulesPattern.replace(/\\/g, '\\\\') : props.fieldValidateRulesPattern,
                fieldValidateRulesMin: props.fieldValidateRulesMin,
                fieldValidateRulesMax: props.fieldValidateRulesMax,
                fieldValidateRulesMinbytes: props.fieldValidateRulesMinbytes,
                fieldValidateRulesMaxbytes: props.fieldValidateRulesMaxbytes
            }

            // check if fieldname specified already exists
            var fieldIdx = _.findIndex(this.fields, (value) => {
                return value.fieldName === field.fieldName;
            })
            if (fieldIdx >= 0) {
                this.fields[fieldIdx] = field;
            } else {
                this.fields.push(field);
            }

            askForField.call(this, cb);
        }  else {
            cb();
        }
    }.bind(this));
}
