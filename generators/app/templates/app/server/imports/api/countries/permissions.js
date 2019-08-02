
/**
 * Define insert / update and delete permission for the Countries collection
 */
import {Countries} from './collection.js'

import {appRoles, getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js'
import {checkPermission} from '../common/permissions.js'

export function insertPermission(userId, doc) {
    return checkPermission.call(this, userId, permissionMappings, 'insert', doc);
}

export function updatePermission(userId, doc, fields, modifier) {
    return checkPermission.call(this, userId, permissionMappings, 'update', doc, fields, modifier);
}

export function removePermission(userId, doc) {
    return checkPermission.call(this, userId, permissionMappings, 'remove', doc);
}

Countries.allow({
    insert: (userId, doc) => {
        if (insertPermission.call(this, userId, doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId)
            doc.createdBy = userId
            doc.createdAt = new Date()
            return true;
        }
        return false;
    },
    update: (userId, doc, fields, modifier) => {
        if (updatePermission.call(this, userId, doc, fields, modifier)) {
            modifier.$set = modifier.$set || {}
            modifier.$set.modifiedBy = userId
            modifier.$set.modifiedAt = new Date()
            return true;
        }
        return false;
    },
    remove: (userId, doc) => {  // eslint-disable-line
        if (removePermission.call(this, userId, doc)) {
            return true;
        }
        return false;
    }
})

// customize for different user roles
// nbgen: protection marker start
const permissionMappings = {
    __default__: false,
    insert: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
        [appRoles.NORMAL_USER]: function(userId, doc) { // eslint-disable-line
            return false;   // no
        },
    },
    update: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
        [appRoles.NORMAL_USER]: function(userId, doc, fields, modifier) { // eslint-disable-line
            // only allow if user is the owner of the document
            return doc[COLLECTION_OWNER_FIELD] === userId
        },
    },
    remove: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
        [appRoles.NORMAL_USER]: function(userId, doc) { // eslint-disable-line
            // only allow if user is the owner of the document
            return doc[COLLECTION_OWNER_FIELD] === userId
        },
    }
}
// nbgen: protection marker end

