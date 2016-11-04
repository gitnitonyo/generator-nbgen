/**
 * This is meteor-specific, using built-in function in Meteor and Accounts
 */
import {Meteor} from 'meteor/meteor'
import {Accounts} from 'meteor/accounts-base'
import {Counts} from 'meteor/tmeasday:publish-counts'

import _s from 'underscore.string'
import _ from 'underscore'

import angular from 'angular'
import nbgenAuth from './nbgenAuth.js'

const $meteor = Meteor, $accounts = Accounts
const serviceName = '$nbgenAuthProviderService'

angular.module(nbgenAuth)
    .factory(serviceName, nbgenAuthProviderServiceFn)
    .factory('$Meteor', function() { return Meteor; })
    .factory('$Accounts', function() { return Accounts; })
    .factory('$Counts', function() { return Counts; })

function _BaseAuthProviderService() {

}

_BaseAuthProviderService.prototype.userId = $meteor.userId
_BaseAuthProviderService.prototype.user = $meteor.user
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
            const serviceOptions = credentials.serviceOptions || {}
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
}

function nbgenAuthProviderServiceFn($q) {
    'ngInject';

    // setup Accounts verification
    return new NbgenAuthProviderService($q)
}
