import angular from 'angular'
import { Roles } from '../nbgenMeteor';
import { Meteor } from '../nbgenMeteor';

import nbgenAuth from './nbgenAuth.js';

const USER_GROUP_FIELD = '_activeGroup';

// import _ from 'underscore'

const serviceName = '$nbgenIdentityService'
const $roles = Roles

angular.module(nbgenAuth)
    .factory(serviceName, nbgenIdentityServiceFn)

class NbgenIdentityService {
    constructor($nbgenAuthProviderService, $q) {
        this.$nbgenAuthProviderService = $nbgenAuthProviderService;
        this.$q = $q;
    }

    isIdentityResolved() {
        let currentUser = this.$nbgenAuthProviderService.user();
        if (!currentUser || !currentUser.roles) return false;
        return true;
    }

    isAuthenticated() {
        return this.isIdentityResolved()
    }

    isInRole(role) {
        const userId = this.$nbgenAuthProviderService.userId()
        if (!userId) {
            return false;
        }
        const user = this.$nbgenAuthProviderService.user()
        if (!user) {
            return false;
        }

        return $roles.userIsInRole(user, role, (user.profile && user.profile._activeGroup))
    }

    isInAnyRole(roles) {
        return this.isInRole(roles)
    }

    identity(force) { // eslint-disable-line
        return this.$nbgenAuthProviderService.user()
    }

    authenticate() {
        // not applicable for this service
    }

    clearIdentity() {
        // not applicable for this service
    }

    getActiveGroup() {
        const user = this.$nbgenAuthProviderService.user()
        return user.profile && user.profile[USER_GROUP_FIELD];
    }

    userId() {
        return this.$nbgenAuthProviderService.userId()
    }

    user() {
        return this.$nbgenAuthProviderService.user()
    }

    // returns the first role assigned to the user
    getFirstRole() {
        const userRoles = this.getUserRoles();
        return userRoles && userRoles[0];
    }

    getUserRoles() {
        const user = this.$nbgenAuthProviderService.user();
        if (user) {
            const currentGroup = user.profile[USER_GROUP_FIELD] || Roles.GLOBAL_GROUP;
            return Roles.getRolesForUser(user, currentGroup);
        }
    }

    // promisable checking of roles
    userIsInRole(role) {
        return this.$q((_resolve, _reject) => {
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

function nbgenIdentityServiceFn($nbgenAuthProviderService, $q) {
    'ngInject';

    return new NbgenIdentityService($nbgenAuthProviderService, $q)
}
