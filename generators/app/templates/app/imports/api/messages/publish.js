/**
 * Controls published information for Messages collection
 */
import { Messages } from '.';
import { publishCollection } from '../common/publish.js'
import { COLLECTION_PUBLIC_FIELD, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD, getActiveGroup, appRoles } from '../../common/app.roles'
import { Roles } from '../common';

const publishName = 'messages';
const collection = Messages;
const isPublic = false;
const allowedRoles = [ appRoles.SUPER_ADMIN, appRoles.USER_ADMIN, appRoles.NORMAL_USER ];

export function viewAllowed(userId) {
    const activeGroup = getActiveGroup(userId);
    return Roles.userIsInRole(userId, allowedRoles, activeGroup);
}

publishCollection(publishName, collection, selectorFn, optionsFn, isPublic)

// for customizing set selector; you may set application-specific filter here
// please check publishCollection for default filter
function selectorFn(selector) {
    // if (allowedRoles && allowedRoles.length > 0 && viewAllowed(this.userId)) {
    //     // user is allowed to view
    //     const activeGroup = getActiveGroup(this.userId);
    //     selector = {$or: [{[COLLECTION_GROUP_FIELD]: activeGroup}, selector || { }]};
    // }
    selector = { }      // allowed everyone

    return selector;
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
