'use strict';

var _ = require('lodash'),
    pluralize = require('pluralize'),
    prompts = require('./prompts'),
    chalk = require('chalk'),
    moment = require('moment'),
    faker = require('faker'),
    path = require('path'),
    BaseGenerator = require('../tmv-generator-base'),
    CONSTANTS = require('../tmv-constants');

class TmvTestDataGenerator extends BaseGenerator {
    constructor(args, opts) {
        super(args, opts);

        // This makes `name` a required argument.
        this.argument('name', {
            type: String,
            required: true,
            description: 'Entity name'
        });

        this.name = this.options.name;
    }
}

module.exports = TmvTestDataGenerator;

_.assign(TmvTestDataGenerator.prototype, {
    initializing() {
        this.webappDir = CONSTANTS.defaultWebappDir;
        this.serverDir = CONSTANTS.defaultServerDir;
        this.mobileSourceDir = CONSTANTS.defaultMobileDir;
        this.collectionName = _.camelCase(pluralize(this.name));
        this.collections = this.collections || { };
        this.collection = this.collections[this.collectionName] || { };
        this.collection.name = _.upperFirst(this.collectionName);
        this.collection.documentName = _.upperFirst(this.name);
        this.fields = this.collection.fields || [ ];
        if (this.fields.length === 0) {
            this.warning("No field data present");
            this.abort = true;
        }
        this.testDataConfig = { };
        this.testDataConfig.fields = { };
    },

    prompting: {
        // checkForNewVersion() {
        //     this.checkNewerVersion();
        // },
        askForTestDetails () {
            if (this.abort) return;
            prompts.askForTestDataDetails.call(this);
        },
        askHowMany() {
            if (this.abort) return;
            if (!this.testDataConfig.fields) return;
            prompts.askHowMany.call(this);
        }
    },

    configuring() {
        if (this.abort) return;
        this.testDataCollection = [ ];
        var recordNo, possibleValues;
        for (recordNo = 0; recordNo < this.numberOfRecords; recordNo ++) {
            var testData = {}, selected, min, max, precision;
            _.forOwn(this.testDataConfig.fields, (fieldSchema, fieldName) => {
                var testInfo = fieldSchema;
                // handle test data for string
                if (testInfo.fieldType == 'String') {
                    if (testInfo.stringMethod == 'fixedValue') {
                        testData[fieldName] = testInfo.fixedValue;
                    } else if (testInfo.stringMethod == 'fromList') {
                        possibleValues = testInfo.fromList.split('^');
                        selected = faker.random.number({min: 0, max: possibleValues.length-1});
                        testData[fieldName] = possibleValues[selected];
                    } else if (testInfo.stringMethod == 'randomWord' && testInfo.randomStringType == 'word') {
                        testData[fieldName] = faker.lorem.words(testInfo.numLetters);
                    } else if (testInfo.stringMethod == 'randomWord' && testInfo.randomStringType == 'sentence') {
                        testData[fieldName] = faker.lorem.sentence(testInfo.numWords, 20);
                    } else if (testInfo.stringMethod == 'randomWord' && testInfo.randomStringType == 'paragraph') {
                        testData[fieldName] = faker.lorem.paragraph(testInfo.numSentences);
                    } else if (testInfo.stringMethod == 'name' && testInfo.nameType == 'fullName') {
                        testData[fieldName] = faker.name.findName();
                    } else if (testInfo.stringMethod == 'name' && testInfo.nameType == 'firstName') {
                        testData[fieldName] = faker.name.firstName();
                    } else if (testInfo.stringMethod == 'name' && testInfo.nameType == 'lastName') {
                        testData[fieldName] = faker.name.lastName();
                    } else if (testInfo.stringMethod == 'name' && testInfo.nameType == 'prefix') {
                        testData[fieldName] = faker.name.prefix();
                    } else if (testInfo.stringMethod == 'name' && testInfo.nameType == 'suffix') {
                        testData[fieldName] = faker.name.suffix();
                    } else if (testInfo.stringMethod == 'randomNumber') {
                        min = Number(testInfo.randomNumberMin || 0);
                        max = Number(testInfo.randomNumberMax || 0);
                        precision = Number(testInfo.randomNumberPrecision || 1);
                        testData[fieldName] = faker.random.number({min: min, max: max, precision: precision}).toString();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'zipCode') {
                        testData[fieldName] = faker.address.zipCode();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'city') {
                        testData[fieldName] = faker.address.city();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'cityPrefix') {
                        testData[fieldName] = faker.address.cityPrefix();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'citySuffix') {
                        testData[fieldName] = faker.address.citySuffix();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'streetName') {
                        testData[fieldName] = faker.address.streetName();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'streetAddress') {
                        testData[fieldName] = faker.address.streetAddress();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'streetSuffix') {
                        testData[fieldName] = faker.address.streetSuffix();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'fullAddress') {
                        testData[fieldName] = faker.address.streetAddress() + ' ' +
                            faker.address.city() + ' ' + faker.address.zipCode() +  ' ' +
                            faker.address.country();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'country') {
                        testData[fieldName] = faker.address.country();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'county') {
                        testData[fieldName] = faker.address.county();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'state') {
                        testData[fieldName] = faker.address.state();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'stateAbbr') {
                        testData[fieldName] = faker.address.stateAbbr();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'longitude') {
                        testData[fieldName] = faker.address.longitude();
                    } else if (testInfo.stringMethod == 'address' && testInfo.addressType == 'latitude') {
                        testData[fieldName] = faker.address.latitude();
                    } else if (testInfo.stringMethod == 'internet' && testInfo.internetType == 'email') {
                        testData[fieldName] = faker.internet.email();
                    } else if (testInfo.stringMethod == 'internet' && testInfo.internetType == 'userName') {
                        testData[fieldName] = faker.internet.userName();
                    } else if (testInfo.stringMethod == 'internet' && testInfo.internetType == 'password') {
                        testData[fieldName] = faker.internet.password();
                    } else if (testInfo.stringMethod == 'phone') {
                        testData[fieldName] = faker.phone.phoneNumber(faker.phone.phoneFormats());
                    } else if (testInfo.stringMethod == 'company') {
                        testData[fieldName] = faker.company.companyName();
                    } else if (testInfo.stringMethod == 'increment') {
                        if (_.isUndefined(this.sequences)) this.sequences = {};
                        if (_.isUndefined(this.sequences[fieldName])) {
                            this.sequences[fieldName] = Number(testInfo.startingNumber);
                        }
                        testData[fieldName] = this.sequences[fieldName].toString();
                        this.sequences[fieldName] += Number(testInfo.sequenceIncrement);
                    }
                } else if (testInfo.fieldType == 'Long' || testInfo.fieldType == 'Integer' || testInfo.fieldType == 'BigDecimal') {
                    if (testInfo.numberType == 'fixedValue') {
                        testData[fieldName] = Number(testInfo.fixedValue);
                    } else if (testInfo.numberType == 'fromList') {
                        possibleValues = testInfo.fromList.split('^');
                        selected = faker.random.number({min: 0, max: possibleValues.length-1});
                        testData[fieldName] = Number(possibleValues[selected]);
                    } else if (testInfo.numberType == 'sequential') {
                        if (_.isUndefined(this.sequences)) this.sequences = {};
                        if (_.isUndefined(this.sequences[fieldName])) {
                            this.sequences[fieldName] = Number(testInfo.startingNumber);
                        }
                        testData[fieldName] = this.sequences[fieldName];
                        this.sequences[fieldName] += Number(testInfo.sequenceIncrement);
                    } else if (testInfo.numberType == 'random') {
                        min = Number(testInfo.randomNumberMin || 0);
                        max = Number(testInfo.randomNumberMax || 0);
                        precision = Number(testInfo.randomNumberPrecision || 1);
                        testData[fieldName] = faker.random.number({min: min, max: max, precision: precision});
                    }
                } else if (testInfo.fieldType == 'LocalDate' || testInfo.fieldType == 'DateTime') {
                    var startingDate = testInfo.startingDate;
                    var endingDate = testInfo.endingDate;
                    var value = faker.date.between(startingDate, endingDate);
                    if (testInfo.includeTime == true) {
                        var maxSeconds = 60 * 60 * 24;  // number of seconds in 1 day
                        value.setSeconds(faker.random.number({min: 0, max: maxSeconds}));
                        testData[fieldName] = moment(value).format('YYYY-MM-DD HH:MM:SS');
                    } else {
                        testData[fieldName] = moment(value).format('YYYY-MM-DD');
                    }
                } else if (testInfo.fieldType == 'Boolean') {
                    if (testInfo.booleanType == 'alwaysTrue')
                        testData[fieldName] = true;
                    else if (testInfo.booleanType == 'alwaysFalse')
                        testData[fieldName] = false;
                    else
                        testData[fieldName] = faker.random.number({min: 0, max: 1}) == 0 ? false : true;
                }
            });

            this.testDataCollection.push(testData);
        }
    },

    default() {
        if (this.abort) return;

    },

    writing() {
        if (this.abort) return;
        this.targetFile = path.join(CONSTANTS.meteorDir, 'private/dataload/' + this.collectionName + '.json');
        this.fs.write(this.targetFile, JSON.stringify(this.testDataCollection, null, 2));
    },

    end() {
        if (!this.abort) {
            this.log(chalk.green('Test data successfully generated in ' + this.targetFile));
        }
    }
});
