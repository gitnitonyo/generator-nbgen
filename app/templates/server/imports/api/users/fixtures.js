/**
 * Contains data initialization routines for Users collection
 */
import _ from 'underscore'
import {Meteor} from 'meteor/meteor'
import {Accounts} from 'meteor/accounts-base'
import {Roles} from 'meteor/alanning:roles'

import {Users} from '../../../../imports/common/users/collection.js'

import {appRoles, USER_GROUP_FIELD, GLOBAL_GROUP} from '/imports/common/app.roles.js'

const initialUsers = [{
    email: 'superAdmin@nubevtech.com',
    password: 'superAdmin',
    name: 'Super Admin',
    role: [ appRoles.SUPER_ADMIN, appRoles.NORMAL_USER ]
}, {
    email: 'normalUser@nubevtech.com',
    password: 'normalUser',
    name: 'Normal User',
    role: appRoles.NORMAL_USER
}]


Meteor.startup(() => {
    if (Users.find({}).count() === 0) {
        // create initial users
        initialUsers.forEach((user) => {
            const userId = Accounts.createUser({
                email: user.email,
                password: user.password,
                profile: {name: user.name}
            })

            // set initial role
            Roles.setUserRoles(userId, user.role)
        })
    }
})

// nbgen: protection marker start
// called when a new user account is created
Accounts.onCreateUser((options, user) => {
    if (options.profile) {
        user.profile = options.profile
        user.profile[USER_GROUP_FIELD] = GLOBAL_GROUP
    }

    if (_.isArray(user.emails) && user.emails.length > 0) {
        const email = user.emails[0].address
        // check if email belongs to pre-configured user
        if (_.find(initialUsers, (item) => item.email.toUpperCase() === email.toUpperCase())) {
            user.emails[0].verified = true
        } else {
            if (!user.roles) user.roles = { }
            user.roles[GLOBAL_GROUP] = [appRoles.NORMAL_USER]
        }
    } else {
        if (!user.roles) user.roles = { }
        user.roles[GLOBAL_GROUP] = [appRoles.NORMAL_USER]
    }

    return user
})

// called when a user has attempted to login
Accounts.validateLoginAttempt(function(attemptInfo) {
    if (attemptInfo.user && _.isArray(attemptInfo.user.emails) && attemptInfo.user.emails.length > 0) {
        const emailVerified = attemptInfo.user.emails[0].verified
        if (!emailVerified) {
            throw new Meteor.Error(401, "User's email has not been verified yet.")
        }
    }
    return attemptInfo.allowed
})
// nbgen: protection marker end
