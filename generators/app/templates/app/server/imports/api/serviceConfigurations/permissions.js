
/**
 * Define insert / update and delete permission for the ServiceConfigurations collection
 */
import {ServiceConfigurations} from './collection.js'

import {appRoles, getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js'
import {checkPermission} from '../common/permissions.js';
import { postAuditLog } from '../auditLogs/methods.js';

ServiceConfigurations.allow({
    insert: (userId, doc) => {
        if (checkPermission.call(this, userId, permissionMappings, 'insert', doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId)
            doc.createdBy = userId
            doc.createdAt = new Date()
            postAuditLog(userId, 'insert', { doc }, 'serviceConfigurations');

            return true;
        }
        return false;
    },
    update: (userId, doc, fields, modifier) => {
        if (checkPermission.call(this, userId, permissionMappings, 'update', doc, fields, modifier)) {
            modifier.$set = modifier.$set || {}
            modifier.$set.modifiedBy = userId
            modifier.$set.modifiedAt = new Date();
            postAuditLog(userId, 'update', { doc, fields, modifier }, 'serviceConfigurations');

            return true;
        }
        return false;
    },
    remove: (userId, doc) => {  // eslint-disable-line
        if (checkPermission.call(this, userId, permissionMappings, 'remove', doc)) {
            postAuditLog(userId, 'remove', { doc }, 'serviceConfigurations');

            return true;
        }
        return false;
    }
})

// customize for different user roles
// nbgen: protection marker start
const permissionMappings = {
    __default__: false,
    update: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
    },
}
// nbgen: protection marker end

