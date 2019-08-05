import angular from 'angular'

import { Meteor } from '../nbgenMeteor';
import { Accounts } from '../nbgenMeteor';

import nbgenSocial from './nbgenSocial.js'

import template from './nbgenSocialSignin.html';
import altTemplate from './nbgenSocialSigninAlt.html';

const name = 'nbgenSocialSignin';
const altName = 'nbgenSocialSigninAlt';

class NbgenSocialSigninCtrl {
    constructor($scope, $reactive, $nbgenAuthProviderService, $tmvUiUtils, $timeout, $state, $translate) {
        'ngInject'

        $reactive(this).attach($scope)

        this.$authService = $nbgenAuthProviderService
        this.$tmvUiUtils = $tmvUiUtils
        this.$timeout = $timeout
        this.$state = $state
        this.$translate = $translate

        this.autorun(() => {
            this.loginServicesReady = Accounts.loginServicesConfigured()
        })
    }

    performLogin(service) {
        // check if connected to the server
        const credentials = { service: service, seviceOptions: this.serviceOptions };
        const $state = this.$state

        Meteor.isCordova || this.$tmvUiUtils.showWaitDialog();
        this.$authService.login(credentials)
            .then(() => {
                // check if we need to redirect
                this.$timeout(() => {
                    if ($state.current.data && $state.current.data.returnToState) {
                        const stateDest = $state.current.data.returnToState
                        const stateDestParams = $state.current.data.returnToStateParams
                        delete $state.current.data.returnToState
                        delete $state.current.data.returnToStateParams
                        $state.go(stateDest, stateDestParams, {location: false});
                    } else {
                        $state.go('home', {}, {location: 'replace'});
                    }
                })
            }, (err) => {
                if (err.error == 403) {
                    err = this.$translate.instant('global.login.invalid');
                } else {
                    err = `Unable to sign in via ${credentials.service}`
                }
                this.$tmvUiUtils.error(err);
            }).finally(() => Meteor.isCordova || this.$tmvUiUtils.hideWaitDialog())
    }
}

angular.module(nbgenSocial)
.component(name, {
    template,
    controllerAs: name,
    controller: NbgenSocialSigninCtrl,
    bindings: {
        serviceOptions: '<'
    }
})
.component(altName, {
    template: altTemplate,
    controllerAs: name,
    controller: NbgenSocialSigninCtrl,
    bindings: {
        serviceOptions: '<'
    }
})
