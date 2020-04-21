/**
 * Controls published information for Announcements collection
 */
import { Roles } from '../common';
import {Announcements} from './collection.js';
import {publishCollection, publishVirtualCollection} from '../common/publish.js'
import {COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD, appRoles, getActiveGroup} from '../../common/app.roles'

import moment from 'moment';

const publishName = 'announcements'
const collection = Announcements
const isPublic = false

publishCollection(publishName, collection, selectorFn, optionsFn, isPublic)

// nbgen: protection marker start
// for customizing set selector; you may set application-specific filter here
// please check publishCollection for default filter
function selectorFn(selector) {
    const activeGroup = getActiveGroup(this.userId);
    if (!Roles.userIsInRole(this.userId, [appRoles.SUPER_ADMIN], activeGroup)) {
        // hide all announcement not belonging to the group of the user
        selector = {$and: [{[COLLECTION_GROUP_FIELD]: activeGroup}, selector || {}]};
    }
    return selector;
}

// for customizing options, you may set field filter here
function optionsFn(options) {

    // by default don't publish processing fields
    const fields = (options && options.fields) || { }
    fields[COLLECTION_OWNER_FIELD] = 0
    //  fields[COLLECTION_PUBLIC_FIELD] = 0  // allow public to be exposed
    fields[COLLECTION_GROUP_FIELD] = 0
    options.fields = fields


    // by default limit the documents to return to 50
    options.limit = options.limit || 50

    return options
}


// for the annnouncement display on front page
const myOwnAnnouncements = 'myOwnAnnouncements';
publishVirtualCollection(myOwnAnnouncements, collection, (selector) => {
    // selector = selectorFn.call(this, selector);
    const activeGroup = getActiveGroup(this.userId);
    // make all announcement belonging to user's group visible
    selector = {$or: [{[COLLECTION_GROUP_FIELD]: activeGroup}, selector || {}]};

    let currentDate = moment().startOf('day').toDate();
    selector = {$and: [{
        dateToPost: {$lte: currentDate},
    }, {
        expiryDate: {$gt: currentDate},
    }, selector || {}]};
    return selector;
}, (options) => {
    options = optionsFn.call(this, options);
    options.sort = {dateToPost: -1, modifiedAt: -1, createdAt: -1};
    return options;
})
// nbgen: protection marker end
