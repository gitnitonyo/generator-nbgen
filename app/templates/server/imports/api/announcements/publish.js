/**
 * Controls published information for Announcements collection
 */
import {Announcements} from '../../../../imports/common/announcements/collection.js'
import {publishCollection} from '../common/publish.js'
import {COLLECTION_PUBLIC_FIELD, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js'

const publishName = 'announcements'
const collection = Announcements
const isPublic = false

publishCollection(publishName, collection, selectorFn, optionsFn, isPublic)

// nbgen: protection marker start
// for customizing set selector; you may set application-specific filter here
// please check publishCollection for default filter
function selectorFn(selector) {
    if (this.userId) {
        // include non-public data also
        const _selector = {$or: [{[COLLECTION_PUBLIC_FIELD]: {$exists: false}}, {[COLLECTION_PUBLIC_FIELD]: false}]}
        if (selector) {
            selector = {$or: [selector, _selector]}
        } else {
            selector = _selector
        }
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
