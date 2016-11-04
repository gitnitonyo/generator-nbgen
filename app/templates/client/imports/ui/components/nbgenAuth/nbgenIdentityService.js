import angular from 'angular'
import {Roles} from 'meteor/alanning:roles'

import nbgenAuth from './nbgenAuth.js'

import _ from 'underscore'

const serviceName = '$nbgenIdentityService'
const $roles = Roles

angular.module(nbgenAuth)
.factory(serviceName, nbgenIdentityServiceFn)

class NbgenIdentityService {
    constructor($nbgenAuthProviderService) {
        this.$nbgenAuthProviderService = $nbgenAuthProviderService
    }

    isIdentityResolved() {
        return !_.isEmpty(this.$nbgenAuthProviderService.userId())
    }

    isAuthenticated() {
        return this.isIdentityResolved()
    }

    isInRole(role) {
        const userId = this.$nbgenAuthProviderService.userId()
        if (!userId) return false
        const user = this.$nbgenAuthProviderService.user()
        if (!user) return false

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
        return user.profile && user.profile._activeGroup
    }

    userId() {
        return this.$nbgenAuthProviderService.userId()
    }

    user() {
        return this.$nbgenAuthProviderService.user()
    }
}

function nbgenIdentityServiceFn($nbgenAuthProviderService) {
    'ngInject';

    return new NbgenIdentityService($nbgenAuthProviderService)
}
