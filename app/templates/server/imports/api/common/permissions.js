import {Meteor} from 'meteor/meteor'
import {Roles} from 'meteor/alanning:roles'

import _ from 'underscore'

import {getActiveGroup} from '/imports/common/app.roles.js'

// call when checking if the specified user is allowed to perform operation based on the specified
// mapping.
export function checkPermission(userId, mapping, operation, doc, fields, modifier) {
    // check if there's an entry for the operation in the mapping
    const operMapping = mapping[operation] || mapping.__default__
    // check what's the defined mapping
    if (_.isBoolean(operMapping)) {
        // just return the boolean expression
        return operMapping
    }

    // is it a function
    if (_.isFunction(operMapping)) {
        return operMapping.call(this, userId, doc, fields, modifier)
    }

    // if it's a string, might be a list of role names separated by comma who are allowed to perform operation
    let rolesList
    if (_.isString(operMapping)) {
        rolesList = operMapping.split(',')
    }

    // if it's array, assume to be list of roles allowed to perform the operation
    if (_.isArray(operMapping)) {
        rolesList = operMapping
    }

    const user = Meteor.users.findOne(userId)
    const activeGroup = getActiveGroup(user)
    if (rolesList) {
        // check if specified userId is in the list
        return Roles.userIsInRole(user, rolesList, activeGroup)
    }

    // if not above, operMapping must be an object
    if (!_.isObject(operMapping)) return false

    // each member of the object is assumed to be a role name
    for (let roleName in operMapping) {
        const value = operMapping[roleName]
        if (Roles.userIsInRole(user, roleName, activeGroup)) {
            // user is in role
            if (_.isBoolean(value) && value) {
                return true
            }
            if (_.isFunction(value)) {
                if (value.call(this, userId, doc, fields, modifier)) return true
            }
        }
    }

    return false
}
