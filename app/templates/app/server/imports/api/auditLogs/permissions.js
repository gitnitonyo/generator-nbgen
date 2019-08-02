
/**
 * Define insert / update and delete permission for the AuditLogs collection
 */
import {AuditLogs} from './collection.js'

import {getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js'
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

AuditLogs.allow({
    insert: (userId, doc) => {
        if (insertPermission.call(this, userId, doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId)
            doc.createdBy = userId
            doc.createdAt = new Date()
            return true
        }
        return false
    },
    update: (userId, doc, fields, modifier) => {
        if (updatePermission.call(this, userId, doc, fields, modifier)) {
            modifier.$set = modifier.$set || {}
            modifier.$set.modifiedBy = userId
            modifier.$set.modifiedAt = new Date()
            return true
        }
        return false
    },
    remove: (userId, doc) => {  // eslint-disable-line
        if (removePermission.call(this, userId, doc)) {
            return true;
        }
        return false;
    }
})

// customize for different user roles
// assign either a boolean or function which returns a boolean to
// indicate whether the user with the corresponding role is allowe to perform
// the operation

/**
 * Audit log will be populated through methods
 */
const permissionMappings = {
    __default__: false,
}

