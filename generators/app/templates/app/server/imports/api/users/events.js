/**
* Enumerate events pertinent to accounts
*/
import { Meteor } from '../common';
import { Accounts } from '../common';
import { appRoles, GLOBAL_GROUP } from '../../../../imports/common/app.roles';

Meteor.startup(() => {

    Accounts.onLogin((loginDetails) => {    // eslint-disable-line
        // calls when there's a successful login
        
    })

    Accounts.onLoginFailure((loginDetails) => { // eslint-disable-line
        // calls when login attempt has failed
        
    })

    Accounts.onLogout((loginDetails) => {   // eslint-disable-line
        
    })

    // server only
    Accounts.validateNewUser((user) => {   // eslint-disable-line
        // return true if user is allowed to be created; false otherwise
        // e.g. to enforce password policy or cross check users from other system
        return true;
    })

    Accounts.onCreateUser((options, user) => {  // eslint-disable-line
        // Use this when you need to do more than simply accept or reject new user creation. 
        // With this function you can programatically control the contents of new user documents.
        
        // options contains info passed by login service
        if (options.password) {
            // it's a password service
            let { profile } = options;
            if (profile._misc) {
                // there's a misc info included
                const misc = profile._misc;
                delete profile._misc;   // don't include it
                if (misc.roles) {
                    // there are roles specified
                    user.roles = misc.roles;
                }
            }
            user.profile = profile;
        }

        // setup default roles for user
        if (!user.roles) {
            user.roles = {[GLOBAL_GROUP]: [appRoles.NORMAL_USER]};
        }

        return user;
    })

    Accounts.validateLoginAttempt((attemptInfo) => { // eslint-disable-line
        // put validation here if user has not been approved
        // or roles has not been setup yet

        // if (attemptInfo.user && _.isArray(attemptInfo.user.emails) && attemptInfo.user.emails.length > 0) {
        //     const emailVerified = attemptInfo.user.emails[0].verified
        //     if (!emailVerified && (!attemptInfo.user.services || !attemptInfo.user.services.password)) {
        //         throw new Meteor.Error(404, "User's email has not been verified yet.")
        //     }
        // }
        // if (attemptInfo.user && attemptInfo.user.profile.deactivated === true) {
        //     throw new Meteor.Error(404, "Your account is currently deactivated. Please contact helpdesk for reactivation.")
        // }

        // check the user's active group has been deacticated
        // const activeGroup = (attemptInfo.user && getActiveGroup(attemptInfo.user._id)) || Roles.GLOBAL_GROUP;
        // if (activeGroup !== Roles.GLOBAL_GROUP) {
        //     const currentGroup = Organizations.findOne(activeGroup);
        //     if (!currentGroup) {
        //         throw new Meteor.Error(404, "Your account does not belong to any group. Please contact helpdesk for details.");
        //     }
        //     if (currentGroup._deactivated === true) {
        //         throw new Meteor.Error(404, "Your account cannot login because your group has been deactivated. Please contact helpdesk for details.");
        //     }
        //     if (currentGroup._approvalNeeded === true) {
        //         throw new Meteor.Error(404, "Your group still needs approval. Please contact helpdesk for details.");
        //     }
        // }
        return attemptInfo.allowed
    })
})
