/**
 * Common functions for publishing data for collections
 */

import {Meteor} from 'meteor/meteor'
import {Roles} from 'meteor/alanning:roles'
import {Counts} from 'meteor/tmeasday:publish-counts'

import _ from 'underscore'

import {COLLECTION_OWNER_FIELD, COLLECTION_PUBLIC_FIELD, COLLECTION_GROUP_FIELD, appRoles, getActiveGroup} from '/imports/common/app.roles.js'

export function publishCollection(publishName, collection, selectorFn, optionsFn, makePublic) {
    Meteor.publish(publishName, function(selector, options) {
        if (makePublic === true) {
            selector = selector || {}
            options = options || {}

            Counts.publish(this, `${publishName}.count`, collection.find(selector), {noReady: true})
            return collection.find(selector, options)
        }

        // initialze for filter publicly set documents
        let _defaultSelectorSet = {$and: [{[COLLECTION_PUBLIC_FIELD]: {$exists: true}}, {[COLLECTION_PUBLIC_FIELD]: true}]}

        if (!this.userId) {
            return collection.find(_defaultSelectorSet, options)    // return only publicly available documents
        }

        const user = Meteor.users.findOne(this.userId)      // retrieve user details
        const activeGroup = getActiveGroup(user)

        _defaultSelectorSet = [_defaultSelectorSet]     // for adding more criteria

        // can also view documents owned by the current user
        _defaultSelectorSet.push({$and: [{[COLLECTION_OWNER_FIELD]: {$exists: true}}, {[COLLECTION_OWNER_FIELD]: this.userId}]})

        // if user is a super-admin for the currently active group, then he/she can see the documents belonging to the active group
        if (Roles.userIsInRole(user, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN], activeGroup)) {
            _defaultSelectorSet.push({$and: [{[COLLECTION_GROUP_FIELD]: {$exists: true}}, {[COLLECTION_GROUP_FIELD]: activeGroup}]})
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

        if (!selector) selector = { }
        if (!options) options = { }

        if (_.isEmpty(selector)) {
            selector = _defaultSelectorSet || {}
        } else if (!_.isEmpty(_defaultSelectorSet)) {
            // incorporate the specified selector
            selector = {$and: [_defaultSelectorSet, selector]}
        }

        // invoke specified selector callback
        selector = (selectorFn && selectorFn.call(this, selector)) || selector || {}

        // invoke specified options callback
        options = (optionsFn && optionsFn.call(this, options)) || options || {}

        // include counts
        Counts.publish(this, `${publishName}.count`, collection.find(selector), {noReady: true})

        return collection.find(selector, options)
    })
}
