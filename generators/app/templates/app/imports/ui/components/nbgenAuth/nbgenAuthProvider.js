/**
 * This is meteor-specific, using built-in function in Meteor and Accounts
 */
import _s from 'underscore.string'
import _ from 'underscore'

import angular from 'angular'
import nbgenAuth from './nbgenAuth.js'

import { Meteor as $meteor, Accounts as $accounts, Roles } from '../nbgenMeteor';
import { getActiveGroup } from '../../../common/app.roles';

const serviceName = '$nbgenAuthProviderService';

// returns true if app is accessed within facebook in-app browser
function isFacebookApp() {
    let ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1);
}

angular.module(nbgenAuth)
    .factory(serviceName, nbgenAuthProviderServiceFn)

function _BaseAuthProviderService() {

}

_BaseAuthProviderService.prototype.userId = function() {
    const user = $meteor.user() || ($meteor.nbgenUser && $meteor.nbgenUser());
    return user && user._id;
}

_BaseAuthProviderService.prototype.user = function() {
    const user = $meteor.user() || ($meteor.nbgenUser && $meteor.nbgenUser());
    return user;
}

if ($accounts) {
    _BaseAuthProviderService.prototype.createUser = $accounts.createUser,
    _BaseAuthProviderService.prototype.setUsername = $accounts.setUsername,
    _BaseAuthProviderService.prototype.addEmail = $accounts.addEmail,
    _BaseAuthProviderService.prototype.removeEmail = $accounts.removeEmail,
    _BaseAuthProviderService.prototype.verifyEmail = $accounts.verifyEmail,
    _BaseAuthProviderService.prototype.findUserByUsername = $accounts.findUserByUsername,
    _BaseAuthProviderService.prototype.findUserByEmail = $accounts.findUserByEmail,
    _BaseAuthProviderService.prototype.changePassword = $accounts.changePassword,
    _BaseAuthProviderService.prototype.forgotPassword = $accounts.forgotPassword,
    _BaseAuthProviderService.prototype.resetPassword = $accounts.resetPassword,
    _BaseAuthProviderService.prototype.setPassword = $accounts.setPassword,
    _BaseAuthProviderService.prototype.sendResetPasswordEmail = $accounts.sendResetPasswordEmail,
    _BaseAuthProviderService.prototype.sendEnrollmentEmail = $accounts.sendEnrollmentEmail,
    _BaseAuthProviderService.prototype.sendVerificationEmail = $accounts.sendVerificationEmail,
    _BaseAuthProviderService.prototype.onResetPasswordLink = $accounts.onResetPasswordLinkL,
    _BaseAuthProviderService.prototype.onEnrollmentLink = $accounts.onEnrollmentLink,
    _BaseAuthProviderService.prototype.onEmailVerificationLink = $accounts.onEmailVerificationLink,
    _BaseAuthProviderService.prototype.emailTemplates = $accounts.emailTemplates
}

class NbgenAuthProviderService extends _BaseAuthProviderService {

    constructor($q) {
        super()
        this.$q = $q
    }

    // login using meteor service
    login(credentials) {
        const deferred = this.$q.defer()
        // check if external service is specified
        if (angular.isString(credentials.service)) {
            // login with external service
            const serviceOptions = credentials.serviceOptions || { };
            if ( isFacebookApp() ) {
                serviceOptions.loginStyle = 'redirect';     // change to redirect style if inside fb
            }
            const serviceCall = 'loginWith' + _s.capitalize(credentials.service)
            $meteor[serviceCall].call(this, serviceOptions, (err) => {
                if (err) {
                    deferred.reject(err)
                } else {
                    deferred.resolve($meteor.user())
                }
            })
        } else {
            // login with password
            $meteor.loginWithPassword(credentials.username, credentials.password, (err) => {
                if (err) {
                    deferred.reject(err)
                } else {
                    deferred.resolve($meteor.user())
                }
            })
        }

        return deferred.promise
    }

    logout() {
        return this.$q((resolve, reject) => {
            $meteor.logout((err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    isAuthenticated() {
        return !_.isEmpty($meteor.userId())
    }

    loggingIn() {
        return $meteor.loggingIn()
    }

    isUserInRole(user, roles) {
        if (!_.isArray(roles)) {
            roles = [roles];
        }
        return Roles.userIsInRole(user, roles, getActiveGroup(user));
    }
}

function nbgenAuthProviderServiceFn($q) {
    'ngInject';

    // setup Accounts verification
    return new NbgenAuthProviderService($q)
}
