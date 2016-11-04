import angular from 'angular'

import nbgenApp from '../nbgenApp.js'

import template from './nbgenSignup.html'

import config from './nbgenSignupConfig.js'

import _ from 'underscore'

const name = 'nbgenSignup'

class NbgenSignupCtrl {
    constructor($scope, $state, $tmvUiUtils, $translate, $reactive, $nbgenIdentityService) {
        'ngInject';

        $reactive(this).attach($scope)

        this.$config = config;
        this.formModel = { }

        this.checkPasswords = this.checkPasswords.bind(this)

        this.performSignup = () => {
            $tmvUiUtils.showWaitDialog();
            if (_.isEmpty($nbgenIdentityService.userId())) {
                this.call('users.registerUser', {
                    email: this.formModel.email,
                    profile: {
                        name: this.formModel.profile.name
                    },
                    password: this.formModel.password
                }, function(err) {
                    $tmvUiUtils.hideWaitDialog();
                    if (err) {
                        $tmvUiUtils.error(err);
                    } else {
                        $tmvUiUtils.alert('tx:registration.home.emailPrompt')
                    }
                    $state.go('home')
                })
            }
        }
    }

    checkPasswords() {
        if (!_.isEmpty(this.formModel.password) && !_.isEmpty(this.formModel.reenterPassword)) {
            return this.formModel.password === this.formModel.reenterPassword
        }
        return true;
    }

    $onInit() {
        // all controllers have been initialized
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
    }

    $postLink() {
        // all elements have been linked
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    $doCheck() {

    }
}

angular.module(nbgenApp)
    .component(name, {
        template,
        controllerAs: name,
        controller: NbgenSignupCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
