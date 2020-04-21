/**
 * Controls published information for Users collection
 */
import { Meteor } from '../common'
import { Users } from './collection.js';
import { publishVirtualCollection } from '../common/publish.js'
import { appRoles, COLLECTION_OWNER_FIELD, COLLECTION_PUBLIC_FIELD, COLLECTION_GROUP_FIELD, getActiveGroup } from '../../common/app.roles'

import { Roles } from '../common'

const publishName = 'appUsers';     // for user admin's access
const collection = Users
const isPublic = false

publishVirtualCollection(publishName, collection, selectorFn, optionsFn, isPublic);

// nbgen: protection marker start
// for customizing set selector; you may set application-specific filter here
// please check publishCollection for default filter
function selectorFn(selector) {
    if (this.userId) {
        const user = Meteor.users.findOne(this.userId);
        const activeGroup = getActiveGroup(user);

        if (Roles.userIsInRole(user, [appRoles.SUPER_ADMIN], Roles.GLOBAL_GROUP)) {
            // it's a super admin; make all user visible except himself
            selector = { _id: { $ne: this.userId } }
        } else if (!Roles.userIsInRole(user, [appRoles.SUPER_ADMIN], activeGroup)) {
            // remove super admin from the list
            const noSuperAdminFilter = {$and: [{
                [`roles.${activeGroup}`]: {$exists: true}
            }, {
                [`roles.${activeGroup}`]: {$elemMatch: {$ne: appRoles.SUPER_ADMIN}}
            }]}
            selector = {$and: [noSuperAdminFilter, selector || {}]}
        }
    }

    return selector
}

// for customizing options, you may set field filter here
function optionsFn(options) {

    // by default don't publish processing fields
    const fields = (options && options.fields) || {}
    fields[COLLECTION_OWNER_FIELD] = 0
    fields[COLLECTION_PUBLIC_FIELD] = 0
    fields[COLLECTION_GROUP_FIELD] = 0

    options.fields = fields


    // by default limit the documents to return to 50
    options.limit = options.limit || 50

    return options
}

Meteor.publish('myAccount', function() {
    if (!this.userId) {
        return []
    }
    // by default only profile property is exposed; for exposing other fields of user's own account
    return Meteor.users.find({ _id: this.userId }, {
        fields: {
            "profile": 1,
            "roles": 1,
            "services.facebook.id": 1,
            "services.facebook.email": 1,
            "services.google.email": 1,
            "services.google.picture": 1,
            "services.twitter.profile_image_url_https": 1,
            "services.twitter.profile_image_url": 1,
            "services.password.dummy": 1, // just for querying if user has password service
        }
    })
});
// nbgen: protection marker end
