
/**
 * Define insert / update and delete permission for the Users collection
 */
import {Users} from '../../../../imports/common/users/collection.js'

import {appRoles, getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js'
import {checkPermission} from '../common/permissions.js'

Users.allow({
    insert: (userId, doc) => {
        if (checkPermission.call(this, userId, permissionMappings, 'insert', doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId)
            doc.createdBy = userId
            doc.createAt = new Date()
            return true;
        }
        return false;
    },
    update: (userId, doc, fields, modifier) => {
        if (checkPermission.call(this, userId, permissionMappings, 'update', doc, fields, modifier)) {
            modifier.$set = modifier.$set || {}
            modifier.$set.modifiedBy = userId
            modifier.$set.modifiedAt = new Date()
            return true;
        }
        return false;
    },
    remove: (userId, doc) => {  // eslint-disable-line
        return checkPermission.call(this, userId, permissionMappings, 'remove', doc)
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

