/**
* Enumerate events pertinent to accounts
*/
import { Meteor } from '../common';
import { Accounts } from '../common';
import { appRoles, GLOBAL_GROUP } from '../../common/app.roles';

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
        let { profile } = options;
        if (options.password) {
            // it's a password service
            if (profile._misc) {
                // there's a misc info included
                const misc = profile._misc;
                delete profile._misc;   // don't include it
                if (misc.roles) {
                    // there are roles specified
                    user.roles = misc.roles;
                }
            }
        }
        user.profile = profile;

        // setup default roles for user
        if (!user.roles) {
            user.roles = {[GLOBAL_GROUP]: [appRoles.NORMAL_USER]};
        }

        return user;
    })

    Accounts.validateLoginAttempt((attemptInfo) => { // eslint-disable-line
        // put validation here if user has not been approved
        // or roles has not been setup yet

        
        return attemptInfo.allowed
    })
})
