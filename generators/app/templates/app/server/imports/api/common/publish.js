/**
 * Common functions for publishing data for collections
 */

import {Meteor} from '../common'
import {Roles} from '../common'
import {Counts} from '../common'

import { ReactiveAggregate } from '../common';

import _ from 'underscore'

import {COLLECTION_OWNER_FIELD, COLLECTION_PUBLIC_FIELD, COLLECTION_GROUP_FIELD, appRoles, getActiveGroup} from '/imports/common/app.roles.js';

export function determineDefaultSelector(selector, selectorFn, makePublic) {
    let _defaultSelectorSet;

    if (makePublic !== true) {
        // initialze for filter publicly set documents
        _defaultSelectorSet = {$and: [{[COLLECTION_PUBLIC_FIELD]: {$exists: true}}, {[COLLECTION_PUBLIC_FIELD]: true}]};
        if (this.userId) {
            // authenticated users

            const user = Meteor.users.findOne(this.userId)      // retrieve user details
            const activeGroup = getActiveGroup(user)

            _defaultSelectorSet = [_defaultSelectorSet]     // for adding more criteria

            // can also view documents owned by the current user
            _defaultSelectorSet.push({$and: [{[COLLECTION_OWNER_FIELD]: {$exists: true}}, {[COLLECTION_OWNER_FIELD]: this.userId}]})

            // if user is a super-admin for the currently active group, then he/she can see the documents belonging to the active group
            if (Roles.userIsInRole(user, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN], activeGroup)) {
                _defaultSelectorSet.push({$or: [
                    {$and: [{[COLLECTION_GROUP_FIELD]: {$exists: true}}, {[COLLECTION_GROUP_FIELD]: activeGroup}]},
                    // make available if record don't have group field
                    {[COLLECTION_GROUP_FIELD]: {$exists: false}},
                ]})
            }

            // normalize selector
            if (_defaultSelectorSet.length > 0) {
                if (_defaultSelectorSet.length === 1) {
                    _defaultSelectorSet = _defaultSelectorSet[0]
                } else {
                    _defaultSelectorSet = {$or: _defaultSelectorSet}
                }
            } else {
                _defaultSelectorSet = undefined
            }
        }
    }

    // add any customize selector for the collection
    if (_.isFunction(selectorFn)) {
        // it's a function
        _defaultSelectorSet = selectorFn.call(this, _defaultSelectorSet) || _defaultSelectorSet;
    } else if (_.isObject(selectorFn)) {
        // it's an additional selector
        _defaultSelectorSet = {$and: [_defaultSelectorSet, selectorFn]};
    }


    // construct final selector
    if (!selector) selector = { }

    if (_.isEmpty(selector)) {
        selector = _defaultSelectorSet || {}
    } else if (!_.isEmpty(_defaultSelectorSet)) {
        // incorporate the specified selector
        selector = {$and: [_defaultSelectorSet, selector]}
    }

    return selector;
}

function _determineSelector(selector, selectorFn, makePublic) {
    return determineDefaultSelector.call(this, selector, selectorFn, makePublic);
}

function _determineOptions(options, optionsFn) {
    options = options || { }
    options = (optionsFn && optionsFn.call(this, options)) || options;

    return options;
}

export const determineOptions = _determineOptions;

export function publishCollection(publishName, collection, selectorFn, optionsFn, makePublic, isVirtual, observerFns) {

    Meteor.publish(publishName, function(selector, options) {

        selector = _determineSelector.call(this, selector, selectorFn, makePublic);
        options = _determineOptions.call(this, options, optionsFn);

        // include counts
        Counts.publish(this, `${publishName}.count`, collection.find(selector), {noReady: true});
        let cursor = collection.find(selector, options);

        return isVirtual === true ? publishVirtual(this, publishName, cursor, observerFns) : cursor;
    })
}

export function publishVirtualCollection(publishName, collection, selectorFn, optionsFn, makePublic, observerFns) {
    publishCollection.call(this, publishName, collection, selectorFn, optionsFn, makePublic, true, observerFns);
}

export function publishVirtual(sub, name, cursor, observerFns) {
    observerFns = _.extend({
        added(id, fields) {
            sub.added(name, id, fields);
        },

        changed(id, fields) {
            sub.changed(name, id, fields)
        },

        removed(id) {
            sub.removed(name, id)
        }
    }, observerFns);

    let observer = cursor.observeChanges(observerFns)

    sub.onStop(function() {
        observer.stop() // important. Otherwise, it keeps running forever
    });

    sub.ready();
}

export function publishAggregate(publishName, collection, selectorFn, optionsFn, makePublic, pipeLine) {
    Meteor.publish(publishName, function(selector, options) {
        let defaultSelector = _determineSelector.call(this, null, selectorFn, makePublic);
        options = _determineOptions.call(this, options, optionsFn);

        let newPipeLine = pipeLine.slice();

        if (!_.isEmpty(defaultSelector)) {
            newPipeLine.unshift({$match: defaultSelector});
        }

        if (!_.isEmpty(selector)) {
            newPipeLine.push({$match: selector});
        }

        if (!_.isEmpty(options.sort)) {
            newPipeLine.push({$sort: options.sort});
        }
        if (!_.isEmpty(options.skip)) {
            newPipeLine.push({$skip: options.skip});
        }
        if (!_.isEmpty(options.limit)) {
            newPipeLine.push({$limit: options.limit});
        }

        ReactiveAggregate(this, collection, newPipeLine, {
            observeSelector: defaultSelector,
            clientCollection: publishName,
        });
    })
}
