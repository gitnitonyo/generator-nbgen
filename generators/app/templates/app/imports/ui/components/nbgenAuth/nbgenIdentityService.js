import angular from 'angular'
import { Roles } from '../nbgenMeteor';
import { Meteor, Tracker } from '../nbgenMeteor';

import nbgenAuth from './nbgenAuth.js';

const USER_GROUP_FIELD = '_activeGroup';

// import _ from 'underscore'

const serviceName = '$nbgenIdentityService'

class NbgenIdentityService {
    constructor($nbgenAuthProviderService) {
        'ngInject';

        this.$nbgenAuthProviderService = $nbgenAuthProviderService;

        Tracker.autorun(() => {
            this._currentUser = Meteor.user();
            this._currentUserId = this._currentUser && this._currentUser._id;
        })
    }

    isIdentityResolved() {
        return this._currentUser && this._currentUser.roles;    // if roles has been retrieve from server
    }

    isAuthenticated() {
        return !! this._currentUser;
    }

    isInRole(role) {
        if (!this._currentUser) return;
        return this.$nbgenAuthProviderService.isUserInRole(this._currentUser, role);
    }

    isInAnyRole(roles) {
        return this.isInRole(roles)
    }

    identity(force) { // eslint-disable-line
        if (force) return Meteor.user();
        return this._currentUser;
    }

    authenticate() {
        // not applicable for this service
    }

    clearIdentity() {
        // not applicable for this service
    }

    getActiveGroup() {
        const user = this._currentUser;
        return user.profile && user.profile[USER_GROUP_FIELD];
    }

    userId() {
        return this._currentUserId;
    }

    user() {
        return this._currentUser;
    }

    // returns the first role assigned to the user
    getFirstRole() {
        const userRoles = this.getUserRoles();
        return userRoles && userRoles[0];
    }

    getUserRoles() {
        const user = this._currentUser;
        if (user) {
            const currentGroup = user.profile[USER_GROUP_FIELD] || Roles.GLOBAL_GROUP;
            return Roles.getRolesForUser(user, currentGroup);
        }
    }

    // promisable checking of roles
    userIsInRole(role) {
        return new Promise((_resolve, _reject) => {
            Meteor.call('accounts.isInRole', role, (err, result) => {
                if (err) {
                    _reject(err);
                } else {
                    _resolve(result);
                }
            })
        })
    }
}

angular.module(nbgenAuth)
    .service(serviceName, NbgenIdentityService)

