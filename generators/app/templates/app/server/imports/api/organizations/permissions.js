/**
 * Define insert / update and delete permission for the Organizations collection
 */

import { Organizations } from './collection.js'

import { appRoles, getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD } from '/imports/common/app.roles.js'
import { checkPermission } from '../common/permissions.js'
import { postAuditLog } from '../auditLogs/methods.js';

export function insertPermission(userId, doc) {
    return checkPermission.call(this, userId, permissionMappings, 'insert', doc);
}

export function updatePermission(userId, doc, fields, modifier) {
    return checkPermission.call(this, userId, permissionMappings, 'update', doc, fields, modifier);
}

export function removePermission(userId, doc) {
    return checkPermission.call(this, userId, permissionMappings, 'remove', doc);
}

Organizations.allow({
    insert: (userId, doc) => {
        if (insertPermission.call(this, userId, doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId)
            doc.createdBy = userId
            doc.createdAt = new Date()
            postAuditLog(userId, 'insert', { doc }, 'organizations');

            return true
        }
        return false
    },
    update: (userId, doc, fields, modifier) => {
        if (updatePermission.call(this, userId, doc, fields, modifier)) {
            modifier.$set = modifier.$set || {}
            modifier.$set.modifiedBy = userId
            modifier.$set.modifiedAt = new Date()
            postAuditLog(userId, 'update', { doc, fields, modifier }, 'organizations');

            return true
        }
        return false
    },
    remove: (userId, doc) => {
        if (removePermission.call(this, userId, doc)) {
            postAuditLog(userId, 'remove', { doc }, 'organizations');
            return true;
        }
        return false;
    }
})

// customize for different user roles
// assign either a boolean or function which returns a boolean to
// indicate whether the user with the corresponding role is allowe to perform
// the operation

const permissionMappings = {
    __default__: false,
    insert: {
        [appRoles.SUPER_ADMIN]: true,
    },
    update: {
        [appRoles.SUPER_ADMIN]: true,
    },
    remove: {
        // organizations cannot be removed from the app
        // it can only be deactivated
    }
}
