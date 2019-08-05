"use strict";

var chalk = require('chalk'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    stringifyObject = require('stringify-object'),
    moment = require('moment')

const BASE_VALIDATION_CHOICES = [
    {
        value: 'required',
        name: 'Required'
    },
];

const STRING_VALIDATION_CHOICES = BASE_VALIDATION_CHOICES.concat([
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
])

const TYPE_OF_FIELDS = [
    {
        value: "text",
        name: "String",
        validationChoices: STRING_VALIDATION_CHOICES.concat([]),
    },
    {
        value: "number",
        name: "Number",
        validationChoices: BASE_VALIDATION_CHOICES.concat([
            {
                name: 'Minimum',
                value: 'min'
            },
            {
                name: 'Maximum',
                value: 'max'
            }
        ]),
        decimalPlaces: 0,
    },
    {
        value: "checkbox",
        name: "Boolean",
        validationChoices: BASE_VALIDATION_CHOICES.concat([])
    },
    {
        value: "date",
        name: "Date",
        validationChoices: BASE_VALIDATION_CHOICES.concat([]),
        displayFormat: 'MM/DD/YYYY'
    },
    {
        value: "time",
        name: "Time",
        validationChoices: BASE_VALIDATION_CHOICES.concat([]),
        displayFormat: 'HH:mm A'
    },
    {
        value: "datetime",
        name: "Date / Time",
        validationChoices: BASE_VALIDATION_CHOICES.concat([]),
        displayFormat: 'MM/DD/YYYY HH:mm A'
    },
    {
        value: 'email',
        name: 'Email',
        validationChoices: STRING_VALIDATION_CHOICES.concat([]),
    },
    // {
    //     value: 'object',
    //     name: 'Object',
    // }
]

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
function askForField(cb, parentField) {
    parentField = parentField || this;
    const parentFieldName = parentField.fieldName || parentField.baseName;

    this.log(chalk.green(`\nGenerating field # ${this.fields.length + 1} for ${parentFieldName}\n`));

    var prompts = [
        // ask for field name
        {
            type: 'input',
            name: 'fieldName',
            validate(input) {
                if (!(/^([a-zA-Z0-9_]*)$/.test(input))) {
                    return 'Your field name cannot contain special characters';
                }
                // check if fieldName is already used in the current collection
                var field = _.find(this.fields, function(fld) {
                    const prefixed = parentField.fieldName ? `${parentField.fieldName}.${input}` : input;
                    return _.toLower(prefixed) == _.toLower(fld.fieldName);
                });
                if (field) {
                    this.warning("\n`" + input + "` is already defined. Will overwite the existing field definition.")
                }
                return true;
            },
            message: 'What is the name of the field (Blank to finish)?'
        },

        // ask for the type of field
        {
            when(response) {
                if (_.isEmpty(response.fieldName)) return false;    // skip if fieldname is blank
                return true;
            },
            type: 'list',
            name: 'fieldInputType',
            message: 'What is the type of your field?',
            choices: TYPE_OF_FIELDS,
            default: 0
        },
        {
            when(response) {
                // look for the validation choices
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                const fieldTypeInfo = _.find(TYPE_OF_FIELDS, (t) => t.value === response.fieldInputType);
                response._fieldTypeInfo = fieldTypeInfo;

                return fieldTypeInfo && fieldTypeInfo.validationChoices;
            },
            type: 'checkbox',
            name: '_fieldValidateRules',
            message: 'Which validation rules do you want to add?',
            choices: r => r._fieldTypeInfo.validationChoices,
            default: 0
        },

        // input based on type of input
        {
            // if it's a number
            when(response) {
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                return !_.isEmpty(response.fieldName) &&
                       response.fieldInputType === 'number'
            },
            type: 'input',
            name: 'decimalPlaces',
            message: 'Number of decimal places to display',
            validate(input) {
                let numInput = Number(input);
                return _.isFinite(numInput) && _.isInteger(numInput) && numInput >= 0 && numInput <= 6;
            },
            default: 0
        },

        {
            // if it's a date or time
            when(response) {
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                return !_.isEmpty(response.fieldName) &&
                    (response.fieldInputType === 'date' ||
                     response.fieldInputType === 'time' ||
                     response.fieldInputType === 'datetime')
            },
            type: 'input',
            name: 'displayFormat',
            message: 'Format to use for display',
            validate(input) {
                let sampleFormat = moment().format(input);
                console.log(`'${sampleFormat}' '${input}'`)
                if (sampleFormat === input) {
                    return 'Invalid format'
                }
                return true; 
            },
            default(response) {
                return response._fieldTypeInfo.displayFormat || ''
            }
        },

        // input based chosen validation rules
        {
            when(response) {
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                return response._fieldValidateRules && response._fieldValidateRules.indexOf('minlength') !== -1;
            },
            type: 'input',
            name: 'fieldValidateRulesMinlength',
            validate(input) {
                if (_.isFinite(Number(input))) return true;
                return 'Minimum length must be a positive number';
            },
            message: 'What is the minimum length of your field?',
            default: 0
        },
        {
            when(response) {
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                return response._fieldValidateRules && response._fieldValidateRules.indexOf('maxlength') !== -1;
            },
            type: 'input',
            name: 'fieldValidateRulesMaxlength',
            validate(input, response) {
                const numInput = Number(input);
                if (_.isFinite(numInput)) {
                    let minlength = Number(response.fieldValidateRulesMinlength) || 0;
                    if (numInput < minlength) {
                        return `Maximum length must be at least ${minlength}`;
                    }
                    return true;
                } 
                return 'Maximum length must be a positive number';
            },
            message: 'What is the maximum length of your field?',
            default: 20
        },
        {
            when(response) {
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                return !_.isEmpty(response.fieldName) &&
                    response._fieldValidateRules &&
                    response._fieldValidateRules.indexOf('min') !== -1
            },
            type: 'input',
            name: 'fieldValidateRulesMin',
            message: 'What is the minimum of your field?',
            validate(input) {
                if (_.isFinite(Number(input))) return true;
                return 'Minimum must be a number';
            },
            default: 0
        },
        {
            when(response) {
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                return response.fieldName && response.fieldName.length > 0 &&
                    response._fieldValidateRules &&
                    response._fieldValidateRules.indexOf('max') !== -1
            },
            type: 'input',
            name: 'fieldValidateRulesMax',
            message: 'What is the maximum of your field?',
            validate(input, response) {
                const numInput = Number(input);
                if (_.isFinite(numInput)) {
                    let minInput = Number(response.fieldValidateRulesMin);
                    if (_.isFinite(minInput) && numInput < minInput) {
                        return `Maximum number must be at least ${minInput}`
                    }
                    return true;
                }
                return 'Maximum must be a number';
            },
            default: 100
        },
        {
            when: function (response) {
                if (_.isEmpty(response.fieldName) || response.fieldInputType === 'object') return false;    // skip if fieldname is blank
                return response.fieldName && response.fieldName.length > 0 &&
                    response._fieldValidateRules &&
                    response._fieldValidateRules.indexOf('pattern') !== -1;
            },
            type: 'input',
            name: 'fieldValidateRulesPattern',
            message: 'What is the regular expression pattern you want to apply on your field?',
            default: '^[a-zA-Z0-9]*$'
        }
    ];

    this.prompt(prompts).then((props) => {
        if (!_.isEmpty(props.fieldName)) {
            let field = _.extend({}, props);
            if (props._fieldValidateRules && props._fieldValidateRules.indexOf('required') !== -1) {
                field.fieldValidateRulesRequired = true;
            }
            // adjust the fieldname
            if (parentField.fieldName) {
                field.fieldName = `${parentField.fieldName}.${field.fieldName}`;
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

            // remove properties that starts with _
            _.each(props, (v, k) => {
                if (k.startsWith('_')) {
                    delete field[k];
                }
            })

            // display the current list of fields
            for (let i=0; i < this.fields.length; i++) {
                this.log(chalk.green(`Field number: ${i+1}`));
                this.log(stringifyObject(this.fields[i], {indent: Array(4).join(' ')}))
            }
            if (field.fieldInputType === 'object') {
                askForField.call(this, cb, field);
            } else {
                askForField.call(this, cb, parentField);
            }
        } else {
            cb();
        }
    });
}
