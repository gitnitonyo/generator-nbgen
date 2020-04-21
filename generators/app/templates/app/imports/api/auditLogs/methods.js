/**
 * Defines remotely accessible methods pertinent to AuditLogs collection
 */
import { Meteor } from '../common';
import { AuditLogs } from './collection.js';
import _ from 'underscore';

Meteor.methods({
    // enumerate remote methods here
    'audit.postLog': postAuditLog,
})

// nbgen: protection marker start
/**
 * Post an auditlog operation
 * params - object containing the ff. properties
 * activity - a string detailing the activity
 * artifacts - object used in the operation
 * collection - a string which pertains to the collection; can be null if operation does not involved a collection
 *
 * This must be invoked within the context of Meteor Environment
 */
export function postAuditLog(userId, activity, artifacts, collection) {
    if (!userId) {
        throw new Meteor.Error(401, "Operation not allowed");
    }
    const user = Meteor.users.findOne(userId);
    if (user === undefined) {
        throw new Meteor.Error(400, "No userid is specified in audit log");
    }

    if (_.isObject(artifacts) && _.isObject(artifacts.modifier)) {
        artifacts.modifier = JSON.stringify(artifacts.modifier);
    }

    const entry = {
        when: new Date(),
        who: {
            userId: userId,
            name: user.profile.name,
        },
        details: {
            activity,
            artifacts,
            collection
        }
    }
    AuditLogs.insert(entry);
}

// nbgen: protection marker end
