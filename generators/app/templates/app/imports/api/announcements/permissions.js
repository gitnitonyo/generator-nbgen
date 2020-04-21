
/**
 * Define insert / update and delete permission for the Announcements collection
 */
import {Announcements} from './collection.js';

import {appRoles, getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '../../common/app.roles'
import {checkPermission} from '../common/permissions.js'
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


Announcements.allow({
    insert: (userId, doc) => {
        if (insertPermission.call(this, userId, doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId)
            doc.createdBy = userId
            doc.createdAt = new Date()
            postAuditLog(userId, 'insert', { doc }, 'announcements');

            return true
        }
        return false
    },
    update: (userId, doc, fields, modifier) => {
        if (updatePermission.call(this, userId, doc, fields, modifier)) {
            modifier.$set = modifier.$set || {}
            modifier.$set.modifiedBy = userId
            modifier.$set.modifiedAt = new Date();
            postAuditLog(userId, 'update', { doc, fields, modifier }, 'announcements');
            return true;
        }
        return false
    },
    remove: (userId, doc) => {
        if (removePermission.call(this, userId, doc)) {
            postAuditLog(userId, 'remove', { doc }, 'announcements');
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
    },
    update: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
    },
    remove: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
    }
}
// nbgen: protection marker end

