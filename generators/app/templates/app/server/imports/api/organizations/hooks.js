import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

import { Organizations } from './collection.js';
import { appRoles, USER_GROUP_FIELD, COLLECTION_GROUP_FIELD } from '/imports/common/app.roles.js';

// operational hooks for the application

Meteor.startup(() => {
    Organizations.before.insert((userId, doc) => {
        // just performs a check to ensure contact name and email is provided
        // for creating initial user
        check(doc.contact.name, String);
        check(doc.contact.email, String);

        // if user is not a super admin, org was created during sign up so set the approval status to false
        if (!Roles.userIsInRole(userId, [appRoles.SUPER_ADMIN], Roles.GLOBAL_GROUP)) {
            doc._approvalNeeded = true;
        } else {
            // create the user account first to ensure the specified contact email does not exists yet on the system
            Accounts.createUser({
                email: doc.contact.email,
                profile: {
                    name: doc.contact.name,
                }
            });
        }
    });

    // define hooks here for Organization operation
    Organizations.after.insert((userId, doc) => {
        // create a user for this new organization
        if (Roles.userIsInRole(userId, [appRoles.SUPER_ADMIN], Roles.GLOBAL_GROUP)) {
            // org was created by super admin
            const orgUser = Accounts.findUserByEmail(doc.contact.email);
            if (!orgUser) {
                console.log('Error creating org user');
                console.log(JSON.stringify(doc));
                throw new Meteor.Error(500, "Unexpected error");
            }

            const newUserId = orgUser._id;

            // set the other info for the new user
            const updates = {
                [`profile.${USER_GROUP_FIELD}`]: doc._id,   // set default group of the user
                'profile.pendingInfo': false,
                [COLLECTION_GROUP_FIELD]: doc._id,
                roles: {
                    [`${doc._id}`]: [appRoles.USER_ADMIN]   // user is to be the admin of this org
                }
            }
            Meteor.users.update({_id: newUserId}, {$set: updates});

            // send the enrollment email
            // only send enrollment email if created by super-admin
            // Accounts.sendEnrollmentEmail(newUserId);
        } else if (userId) {
            // it was created during sign up; assign user to the newly created org
            Meteor.users.update({_id: userId}, {$set: {
                [COLLECTION_GROUP_FIELD]: doc._id,
                'profile.pendingInfo': false,
                [`profile.${USER_GROUP_FIELD}`]: doc._id,
                roles: {
                    [doc._id]: [appRoles.USER_ADMIN],
                }
            }})
        }
    });
})
