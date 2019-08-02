/**
 * Controls published information for ServiceConfigurations collection
 */
import {ServiceConfigurations} from './collection.js'
import {publishCollection} from '../common/publish.js'
import {appRoles, COLLECTION_OWNER_FIELD, COLLECTION_PUBLIC_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js'
import {Roles} from 'meteor/alanning:roles'

const publishName = 'serviceConfigurations'
const collection = ServiceConfigurations
const isPublic = false

publishCollection(publishName, collection, selectorFn, optionsFn, isPublic)

// nbgen: protection marker start
// for customizing set selector; you may set application-specific filter here
// please check publishCollection for default filter
function selectorFn(selector) {
    // make all documents accessible to superAdmin
    if (this.userId && Roles.userIsInRole(this.userId, appRoles.SUPER_ADMIN)) {
        selector = {}
    }
    return selector
}

// for customizing options, you may set field filter here
function optionsFn(options) {

    // by default don't publish processing fields
    const fields = (options && options.fields) || { }
    fields[COLLECTION_OWNER_FIELD] = 0
    fields[COLLECTION_PUBLIC_FIELD] = 0
    fields[COLLECTION_GROUP_FIELD] = 0
    options.fields = fields


    // by default limit the documents to return to 50
    options.limit = options.limit || 50

    return options
}
// nbgen: protection marker end
