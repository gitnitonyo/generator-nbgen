import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { getActiveGroup, COLLECTION_GROUP_FIELD, GLOBAL_GROUP } from '/imports/common/app.roles.js';
import _ from 'underscore';
import _s from 'underscore.string';

Meteor.methods({
    'utils.checkForUniqueness': _checkForUniqueness,
    'utils.getUniqueNumber': _getUniqueNumber,
});

export const serviceName = Meteor.settings.public.serviceName || 'NubeVision';

function _getUniqueNumber() {
    let n, uniqueStr, result = '';

    uniqueStr = Random.id(6);   // get an id of 6 characters
    for (n = 0; n < uniqueStr.length; n += 1) {
        let hexStr = _s.lpad(uniqueStr.charCodeAt(n).toString(16), 2, '0').toUpperCase();
        result += hexStr;
    }

    return result;
}

function _checkForUniqueness(collectionName, fieldName, value, exceptions, shouldBeUnique) {
    if (!this.userId) {
        // right now only authenticated is allow
        throw new Meteor.Error(401, "Action not permitted");
    }
    if (shouldBeUnique === undefined) shouldBeUnique = true;
    check(collectionName, String);
    check(fieldName, String);
    check(shouldBeUnique, Boolean);

    const activeGroup = getActiveGroup(this.userId);

    const collection = Mongo.Collection.get(collectionName);
    if (!collection) {
        throw new Meteor.Error(404, "Specified collection does not exist");
    }

    // consider the active group of the user for searching for uniqueness
    let item;
    if (fieldName === '_id') {
        item = collection.findOne(value);
    } else {
        if (activeGroup !== GLOBAL_GROUP) {
            item = collection.findOne({[COLLECTION_GROUP_FIELD]: activeGroup, [fieldName]: value});
        } else {
            item = collection.findOne({[fieldName]: value});
        }
    }
    if (item && exceptions && _.find(exceptions, v => item._id === v)) {
        item = undefined;   // this item is exempted from being checking
    }

    return shouldBeUnique ? (item === undefined) : (item !== undefined);
}

export function echoObject(obj) {
    _.each(obj, function(value, key) {
        if (_.isObject(value)) {
            echoObject(value);
        }
        console.log(`${key}: ${value}`)
    });
}

export function getEmail(item) {
    const email = (item.emails && item.emails[0].address) ||
        (item.services && item.services.facebook && item.services.facebook.email) ||
        (item.services && item.services.google && item.services.google.email)

    return email
}

export function escapeRegExp(s) {
    return s.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
}

function _cleanUpData(source, target, dontCleanId) {
    if (_.isObject(source)) {
        _.each(source, (propertyValue, propertyName) => {
            if (_.isString(propertyName) && propertyName.startsWith('$')) {
                propertyName = '__' + propertyName.substr(1);
            }
            if (_.isObject(propertyValue)) {
                target[propertyName] = _.clone(propertyValue);
                _cleanUpData(propertyValue, target[propertyName]);
            } else if (propertyName !== '_id' || dontCleanId === true) {
                target[propertyName] = propertyValue;
            }
        })
    }
}

export function cleanUpData(obj, dontCleanId) {
    if (!_.isObject(obj)) return;
    let result = { };
    _cleanUpData(obj, result, dontCleanId);
    return result;
}
