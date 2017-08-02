
/**
 * Define insert / update and delete permission for the <%= collection.name %> collection
 */
import {<%= collection.name %>} from '/imports/common/<%= collectionName %>/collection.js';

import {appRoles, getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js';
import {checkPermission} from '/server/imports/api/common/permissions.js';
<%_ if (generateAuditLog) { _%>
import { postAuditLog } from '/server/imports/api/auditLogs/methods.js';
<%_ } _%>

/**
 *  customize for different user roles
 *  assign either a boolean or function which returns a boolean to
 *  indicate whether the user with the corresponding role is allowed to perform
 *  the operation
 */
const permissionMappings = {
    __default__: false,
    insert: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
        [appRoles.NORMAL_USER]: function(userId, doc) { // eslint-disable-line
            return true;
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

export function insertPermission(userId, doc) {
    return checkPermission.call(this, userId, permissionMappings, 'insert', doc);
}

export function updatePermission(userId, doc, fields, modifier) {
    return checkPermission.call(this, userId, permissionMappings, 'update', doc, fields, modifier);
}

export function removePermission(userId, doc) {
    return checkPermission.call(this, userId, permissionMappings, 'remove', doc);
}

/**
 * More control over permission
 */
<%= collection.name %>.allow({
    insert: (userId, doc) => {
        if (insertPermission.call(this, userId, doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId;
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId);
            doc.createdBy = userId;
            doc.createdAt = new Date();
            <%_ if (generateAuditLog) { _%>
            postAuditLog(userId, 'insert', { doc }, '<%= collectionName %>');
            <%_ } _%>

            return true;
        }
        return false;
    },
    update: (userId, doc, fields, modifier) => {
        if (updatePermission.call(this, userId, doc, fields, modifier)) {
            modifier.$set = modifier.$set || {};
            modifier.$set.modifiedBy = userId;
            modifier.$set.modifiedAt = new Date();
            <%_ if (generateAuditLog) { _%>
            postAuditLog(userId, 'update', { doc, fields, modifier }, '<%= collectionName %>');
            <%_ } _%>

            return true;
        }
        return false;
    },
    remove: (userId, doc) => {  // eslint-disable-line
        if (removePermission.call(this, userId, doc)) {
            <%_ if (generateAuditLog) { _%>
            postAuditLog(userId, 'remove', { doc }, '<%= collectionName %>');
            <%_ } _%>
            return true;
        }
        return false;
    }
})
