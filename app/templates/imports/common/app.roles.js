import {Meteor} from 'meteor/meteor'
import {Roles} from 'meteor/alanning:roles'
import _ from 'underscore'
/**
 * Define the different roles inside the application
 */

export const appRoles = {
    SUPER_ADMIN: 'super-admin',
    USER_ADMIN: 'user-admin',
    NORMAL_USER: 'normal-user',
    // define application-specific roles here
}

export const USER_GROUP_FIELD = '_activeGroup'
export const COLLECTION_GROUP_FIELD = '_group'
export const COLLECTION_OWNER_FIELD = '_owner'
export const COLLECTION_PUBLIC_FIELD = '_public'

export const GLOBAL_GROUP = Roles.GLOBAL_GROUP

export function getActiveGroup(userId) {
    let user
    if (_.isString(userId)) {
        user = Meteor.users.findOne(userId)
    } else {
        user = userId   // can also be the user
    }

    return user && user.profile && user.profile[USER_GROUP_FIELD]
}
