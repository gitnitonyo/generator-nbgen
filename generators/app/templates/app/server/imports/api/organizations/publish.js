/**
 * Controls published information for Organizations collection
 */
import { Meteor } from '../common';
import {Organizations} from './collection.js'
import {publishCollection, publishVirtual} from '../common/publish.js'
import {COLLECTION_PUBLIC_FIELD, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD, getActiveGroup} from '/imports/common/app.roles.js'

const publishName = 'organizations'
const collection = Organizations
const isPublic = false

publishCollection(publishName, collection, selectorFn, optionsFn, isPublic)

// nbgen: protection marker start
// for customizing set selector; you may set application-specific filter here
// please check publishCollection for default filter
function selectorFn(selector) {
    // user has read access to its own organization
    const userActiveGroup = getActiveGroup(this.userId);
    selector = {$or: [{_id: userActiveGroup}, selector || {}]};

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

// for publishing user's own organization
Meteor.publish('myOrganization', function() {
    if (this.userId) {
        publishVirtual.call(this, this, 'myOrganization', Organizations.find({_id: getActiveGroup(this.userId)}));
    }
});
// nbgen: protection marker end
