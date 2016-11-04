
/**
 * Define insert / update and delete permission for the Announcements collection
 */
import {Announcements} from '../../../../imports/common/announcements/collection.js'

import {appRoles, getActiveGroup, COLLECTION_OWNER_FIELD, COLLECTION_GROUP_FIELD} from '/imports/common/app.roles.js'
import {checkPermission} from '../common/permissions.js'

Announcements.allow({
    insert: (userId, doc) => {
        if (checkPermission.call(this, userId, permissionMappings, 'insert', doc)) {
            doc[COLLECTION_OWNER_FIELD] = userId
            doc[COLLECTION_GROUP_FIELD] = getActiveGroup(userId)
            doc.createdBy = userId
            doc.createAt = new Date()
            return true
        }
        return false
    },
    update: (userId, doc, fields, modifier) => {
        if (checkPermission.call(this, userId, permissionMappings, 'update', doc, fields, modifier)) {
            modifier.$set = modifier.$set || {}
            modifier.$set.modifiedBy = userId
            modifier.$set.modifiedAt = new Date()
            return true;
        }
        return false
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
        [appRoles.NORMAL_USER]: function(userId, doc) { // eslint-disable-line
            return false;   // no
        },
    },
    update: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
        [appRoles.NORMAL_USER]: function(userId, doc, fields, modifier) { // eslint-disable-line
            // only allow if user is the owner of the document
            return doc[appRoles.COLLECTION_OWNER_FIELD] === userId
        },
    },
    remove: {
        [appRoles.SUPER_ADMIN]: true,
        [appRoles.USER_ADMIN]: true,
        [appRoles.NORMAL_USER]: function(userId, doc) { // eslint-disable-line
            // only allow if user is the owner of the document
            return doc[appRoles.COLLECTION_OWNER_FIELD] === userId
        },
    }
}
// nbgen: protection marker end

