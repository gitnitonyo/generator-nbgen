/**
 * Contains data initialization routines for Users collection
 */
import _ from 'underscore'
import { Meteor } from '../common'
import { Accounts } from '../common'
import { Roles } from '../common';

import { appRoles } from '../../common/app.roles'

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
            const profile = _.extend({name: user.name}, user.profile, {
                _misc: {roles: {[Roles.GLOBAL_GROUP]: user.role}, preVerified: true}
            })
            const userInfo = { email: user.email, password: user.password, profile };
            if (user.username) userInfo.username = user.username;
            Accounts.createUser(userInfo);
        }
    })
});
