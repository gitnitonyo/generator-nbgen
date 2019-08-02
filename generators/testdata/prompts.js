'use strict';

var chalk = require('chalk'),
    path = require('path'),
    _ = require('lodash'),
    moment = require('moment');

module.exports = {
    askForTestDataDetails,
    askHowMany
};

function askForTestDataDetails() {
    var done = this.async();
    askForFieldDetails.call(this, done, 0);
}

function askHowMany() {
    var done = this.async();
    var prompts = [
        {
            type: 'input',
            name: 'numberOfRecords',
            message: 'How many records of data to generate?',
            validate: function(input) {
                if (this.isNumber(input)) return true;
                return 'You must enter a valid number';
            }.bind(this),
            default: 20
        }
    ];

    this.prompt(prompts).then(function (response) {
        this.numberOfRecords = parseInt(response.numberOfRecords);
        done();
    }.bind(this));
}

function askForFieldDetails(done, fieldIdx) {
    if (fieldIdx >= this.fields.length) return;

    var fieldSchema = this.fields[fieldIdx];

    var prompts = [
        {
            when: function(response) { return true; },
            type: 'confirm',
            name: 'processField',
            message: 'Do you want to include ' + fieldSchema.fieldName + ' in the generation?',
            default: true
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String');
            },
            type: 'list',
            name: 'stringMethod',
            message: 'Please select how you want to generate test data for ' + fieldSchema.fieldName,
            choices: [
                {
                    value: 'fixedValue',
                    name: 'Fixed Value'
                },
                {
                    value: 'fromList',
                    name: 'From a list'
                },
                {
                    value: 'increment',
                    name: 'Increment'
                },
                {
                    value: 'randomWord',
                    name: 'Random Word'
                },
                {
                    value: 'randomNumber',
                    name: 'Random Number'
                },
                {
                    value: 'name',
                    name: 'Name'
                },
                {
                    value: 'address',
                    name: 'Address'
                },
                {
                    value: 'phone',
                    name: 'Phone'
                },
                {
                    value: 'internet',
                    name: 'Internet'
                },
                {
                    value: 'company',
                    name: 'Company'
                }
            ]
        },
        {
            when: function(response) {
                if (response.processField != true) return false;
                if (response.stringMethod == 'increment') {
                    fieldSchema.originalFieldType = fieldSchema.fieldType;
                    fieldSchema.fieldType = 'Long';
                    response.numberType = 'sequential';
                }
                return false;
            }
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'fixedValue');
            },
            type: 'input',
            name: 'fixedValue',
            message: 'Please enter the fixed value you want to put into ' + fieldSchema.fieldName,
            validate: function(input) {
                if (_.isNil(input) || input.trim().length == 0) {
                    return "Fixed value must be provided";
                }
                // TODO: validate according to the spec found in the schema
                return true;
            }
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'fromList');
            },
            type: 'input',
            name: 'fromList',
            message: 'Please enter the list of possible values separated by "^"',
            validate: function(input) {
                if (_.isNil(input) || input.trim().length == 0) {
                    return "List of values must be provided";
                }
                // TODO: validate according to the spec found in the schema
                return true;
            }
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'randomWord');
            },
            type: 'list',
            name: 'randomStringType',
            message: 'Please select the type of random string to generate',
            choices: [
                {
                    value: 'word',
                    name: 'Word'
                },
                {
                    value: 'sentence',
                    name: 'Sentence'
                },
                {
                    value: 'paragraph',
                    name: 'Paragraph'
                }
            ]
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'randomWord' &&
                    response.randomStringType == 'word');
            },
            type: 'input',
            name: 'numLetters',
            message: 'Please enter number of letters for the word to generate',
            default: 7
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'randomWord' &&
                    response.randomStringType == 'sentence');
            },
            type: 'input',
            name: 'numWords',
            message: 'Please enter number of words for the sentence to generate',
            default: 7
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'randomWord' &&
                    response.randomStringType == 'paragraph');
            },
            type: 'input',
            name: 'numSentences',
            message: 'Please enter number of sentences for the paragraph to generate',
            default: 7
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'name');
            },
            type: 'list',
            name: 'nameType',
            message: 'Please select type of name to generate',
            choices: [
                {
                    value: 'fullName',
                    name: 'Full Name'
                },
                {
                    value: 'firstName',
                    name: 'First name'
                },
                {
                    value: 'lastName',
                    name: 'Last name'
                },
                {
                    value: 'prefix',
                    name: 'Prefix'
                },
                {
                    value: 'suffix',
                    name: 'Suffix'
                }
            ]
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'randomNumber');
            },
            type: 'input',
            name: 'randomNumberMin',
            message: 'Please enter minimum value for the number',
            default: 0
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'randomNumber');
            },
            type: 'input',
            name: 'randomNumberMax',
            message: 'Please enter maximum value for the number',
            default: 9999
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'randomNumber');
            },
            type: 'input',
            name: 'randomNumberPrecision',
            message: 'Please enter precision for the number',
            default: 1
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'address');
            },
            type: 'list',
            name: 'addressType',
            message: 'Please enter type of address to generate',
            choices: [
                {
                    value: 'zipCode',
                    name: 'Zip Code'
                },
                {
                    value: 'city',
                    name: 'City'
                },
                {
                    value: 'cityPrefix',
                    name: 'City Prefix'
                },
                {
                    value: 'citySuffix',
                    name: 'City Suffix'
                },
                {
                    value: 'streetName',
                    name: 'streetName'
                },
                {
                    value: 'streetAddress',
                    name: 'Street Address'
                },
                {
                    value: 'streetSuffix',
                    name: 'Street Suffix'
                },
                {
                    value: 'fullAddress',
                    name: 'Full Address'
                },
                {
                    value: 'county',
                    name: 'County'
                },
                {
                    value: 'country',
                    name: 'Country'
                },
                {
                    value: 'state',
                    name: 'State'
                },
                {
                    value: 'stateAbbr',
                    name: 'State Abbreviation'
                },
                {
                    value: 'longitude',
                    name: 'Longitude'
                },
                {
                    value: 'latitude',
                    name: 'Latitude'
                }
            ]
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'String' && response.stringMethod == 'internet');
            },
            type: 'list',
            name: 'internetType',
            message: 'Please select type of internet data to generate',
            choices: [
                {
                    value: 'email',
                    name: 'Email'
                },
                {
                    value: 'userName',
                    name: 'Username'
                },
                {
                    value: 'password',
                    name: 'Password'
                }
            ]
        },
        {
            when: function(response) {
                if (!_.isUndefined(response.numberType)) return false;
                return (response.processField == true) && (fieldSchema.fieldType == 'Long' || fieldSchema.fieldType == 'Integer' ||
                    fieldSchema.fieldType == 'BigDecimal');
            },
            type: 'list',
            name: 'numberType',
            message: 'Please select how to generate the number',
            choices: [
                {
                    value: 'fixedValue',
                    name: 'Fixed Value'
                },
                {
                    value: 'fromList',
                    name: 'From a List'
                },
                {
                    value: 'sequential',
                    name: 'Sequential'
                },
                {
                    value: 'random',
                    name: 'Random'
                }
            ]
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'Long' || fieldSchema.fieldType == 'Integer' ||
                    fieldSchema.fieldType == 'BigDecimal') && response.numberType == 'fixedValue';
            },
            type: 'input',
            name: 'fixedValue',
            message: 'Please enter the fixed value to use'
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'Long' || fieldSchema.fieldType == 'Integer' ||
                    fieldSchema.fieldType == 'BigDecimal') && response.numberType == 'fromList';
            },
            type: 'input',
            name: 'fromList',
            message: 'Please enter list of values to use separated by "^"'
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'Long' || fieldSchema.fieldType == 'Integer' ||
                    fieldSchema.fieldType == 'BigDecimal') && response.numberType == 'sequential';
            },
            type: 'input',
            name: 'startingNumber',
            message: 'Please enter starting number for the sequence',
            default: 1
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'Long' || fieldSchema.fieldType == 'Integer' ||
                    fieldSchema.fieldType == 'BigDecimal') && response.numberType == 'sequential';
            },
            type: 'input',
            name: 'sequenceIncrement',
            message: 'Please enter increment for the sequence',
            default: 1
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'Long' || fieldSchema.fieldType == 'Integer' ||
                    fieldSchema.fieldType == 'BigDecimal') && response.numberType == 'random';
            },
            type: 'input',
            name: 'randomNumberMin',
            message: 'Please enter minimum number to use',
            default: 0
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'Long' || fieldSchema.fieldType == 'Integer' ||
                    fieldSchema.fieldType == 'BigDecimal') && response.numberType == 'random';
            },
            type: 'input',
            name: 'randomNumberMax',
            message: 'Please enter maximum number to use',
            default: 99999
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'BigDecimal') && response.numberType == 'random';
            },
            type: 'input',
            name: 'randomNumberPrecision',
            message: 'Please enter precision to use',
            default: 1
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'LocalDate' || fieldSchema.fieldType == 'ZonedDateTime');
            },
            type: 'confirm',
            name: 'includeTime',
            message: 'Do you want to include time?',
            default: false
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'LocalDate' || fieldSchema.fieldType == 'ZonedDateTime');
            },
            type: 'input',
            name: 'startingDate',
            message: 'Please enter the starting date to use (yyyy-mm-dd)',
            default: '1970-01-01'
        },
        {
            when: function(response) {
                return ((response.processField == true) && fieldSchema.fieldType == 'LocalDate' || fieldSchema.fieldType == 'ZonedDateTime');
            },
            type: 'input',
            name: 'endingDate',
            message: 'Please enter the ending date to use (yyyy-mm-dd)',
            default: function() {
                return moment().format('YYYY-MM-DD');
            }
        },
        {
            when: function(response) {
                return (response.processField == true) && (fieldSchema.fieldType == 'Boolean');
            },
            type: 'list',
            name: 'booleanType',
            message: 'Plese select the boolean value to generate',
            choices: [
                {
                    value: 'alwaysTrue',
                    name: 'Always True'
                },
                {
                    value: 'alwaysFalse',
                    name: 'Always False'
                },
                {
                    value: 'random',
                    name: 'Random'
                }
            ]
        }
    ];

    this.prompt(prompts).then(function(props) {
        if (props.processField == true) {
            if (fieldSchema.originalFieldType) {
                fieldSchema.fieldType = fieldSchema.originalFieldType
                fieldSchema.originalFieldType = undefined;
            }
            props.fieldType = fieldSchema.fieldType;
            this.testDataConfig.fields[fieldSchema.fieldName] = props;
        }
        fieldIdx ++;
        if (fieldIdx < this.fields.length) {
            askForFieldDetails.call(this, done, fieldIdx);
        } else {
            done();
        }
    }.bind(this));
}
