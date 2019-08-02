/**
 * Contains data initialization routines for Users collection
 */
import _ from 'underscore'
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Roles } from 'meteor/alanning:roles'

import { appRoles, getActiveGroup } from '/imports/common/app.roles.js'
import { Organizations } from '../organizations/collection.js';

const initialUsers = [{
    email: 'superAdmin@nubevtech.com',
    password: 'NubeVision$_',
    name: 'Super Admin',
    role: [appRoles.SUPER_ADMIN]
}, {
    email: 'normaluser@nubevtech.com',
    password: 'NubeVision$_',
    name: 'Normal User',
    role: [appRoles.NORMAL_USER]
}]

Meteor.startup(() => {
    // create initial users
    initialUsers.forEach((user) => {
        if (Accounts.findUserByEmail(user.email) === undefined) {
            const profile = _.extend({name: user.name}, user.profile)
            const userInfo = { email: user.email, password: user.password, profile };
            if (user.username) userInfo.username = user.username;
            const userId = Accounts.createUser(userInfo);

            // set initial role
            Roles.setUserRoles(userId, user.role, Roles.GLOBAL_GROUP);
        }
    })
});

// nbgen: protection marker start
// called when a new user account is created
Accounts.onCreateUser((options, user) => {
    if (options.profile) {
        user.profile = options.profile;
        user.profile._activeGroup = Roles.GLOBAL_GROUP;
    }

    if (options.roles) {
        user.roles = options.roles
    }

    if (_.isArray(user.emails) && user.emails.length > 0) {
        const email = user.emails[0].address
            // check if email belongs to pre-configured user
        if (_.find(initialUsers, (item) => item.email.toUpperCase() === email.toUpperCase())) {
            user.emails[0].verified = true
            user.profile.pendingInfo = false;
        } else {
            user.profile.pendingInfo = true;
        }
    } else {
        user.profile.pendingInfo = true;
    }

    return user
});

// called when a user has attempted to login
Accounts.validateLoginAttempt(function(attemptInfo) {
    if (attemptInfo.user && _.isArray(attemptInfo.user.emails) && attemptInfo.user.emails.length > 0) {
        const emailVerified = attemptInfo.user.emails[0].verified
        if (!emailVerified && (!attemptInfo.user.services || !attemptInfo.user.services.password)) {
            throw new Meteor.Error(404, "User's email has not been verified yet.")
        }
    }
    if (attemptInfo.user && attemptInfo.user.profile.deactivated === true) {
        throw new Meteor.Error(404, "Your account is currently deactivated. Please contact helpdesk for reactivation.")
    }

    // check the user's active group has been deacticated
    const activeGroup = (attemptInfo.user && getActiveGroup(attemptInfo.user._id)) || Roles.GLOBAL_GROUP;
    if (activeGroup !== Roles.GLOBAL_GROUP) {
        const currentGroup = Organizations.findOne(activeGroup);
        if (!currentGroup) {
            throw new Meteor.Error(404, "Your account does not belong to any group. Please contact helpdesk for details.");
        }
        if (currentGroup._deactivated === true) {
            throw new Meteor.Error(404, "Your account cannot login because your group has been deactivated. Please contact helpdesk for details.");
        }
        if (currentGroup._approvalNeeded === true) {
            throw new Meteor.Error(404, "Your group still needs approval. Please contact helpdesk for details.");
        }
    }
    return attemptInfo.allowed
});
// nbgen: protection marker end
