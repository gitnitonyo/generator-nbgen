/**
 * Controls published information for Users collection
 */
import { Meteor } from 'meteor/meteor'
import { Users } from '../../../../imports/common/users/collection.js'
import { publishCollection } from '../common/publish.js'
import { appRoles, COLLECTION_OWNER_FIELD, COLLECTION_PUBLIC_FIELD, COLLECTION_GROUP_FIELD } from '/imports/common/app.roles.js'

import { Roles } from 'meteor/alanning:roles'

const publishName = 'users'
const collection = Users
const isPublic = false

publishCollection(publishName, collection, selectorFn, optionsFn, isPublic)

// nbgen: protection marker start
// for customizing set selector; you may set application-specific filter here
// please check publishCollection for default filter
function selectorFn(selector) {
    if (this.userId) {
        const user = Meteor.users.findOne(this.userId)
        if (Roles.userIsInRole(user, appRoles.SUPER_ADMIN)) {
            // it's a super admin; make all user visible except himself
            return { $or: [{ _id: { $ne: this.userId } }, selector || {}] }
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
    return Meteor.users.find({ _id: this.userId }, {
        fields: {
            "services.facebook.id": 1,
            "services.facebook.email": 1,
            "services.google.email": 1,
            "services.google.picture": 1,
            "services.twitter.profile_image_url_https": 1,
            "services.twitter.profile_image_url": 1,
        }
    })
})


// nbgen: protection marker end
