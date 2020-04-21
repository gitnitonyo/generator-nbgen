import angular from 'angular'

import nbgenApp from '..'

import template from './nbgenLogin.html'

import config from './nbgenLoginConfig.js'

import _s from 'underscore.string'

const name = 'nbgenLogin'
const i18npart = `${nbgenApp}/${name}`
const nameDashed = _s.dasherize(name)

class NbgenLoginCtrl {
    constructor($authUiService, $state) {
        'ngInject';
        this.$config = config
        this.formModel = { }

        this.$authUiService = $authUiService;
        this.$state = $state;
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

    performLogin() {
        const $tmvUiUtils = this.nbgenApp.$tmvUiUtils
        // const $state = this.nbgenApp.$state

        const credentials = {
            username: this.formModel.userEmail,
            password: this.formModel.password
        }

        $tmvUiUtils.showWaitDialog()
        this.nbgenApp.$authProviderService.login(credentials)
            .then(() => {
                const $state = this.$state;
                // determine where to redirect
                this.nbgenApp.$timeout(() => {
                    if ($state.current.data && $state.current.data.returnToState) {
                        const stateDest = $state.current.data.returnToState
                        const stateDestParams = $state.current.data.returnToStateParams
                        $state.current.data.returnToState = $state.current.data.returnToStateParams = undefined
                        $state.go(stateDest, stateDestParams, {location: false});
                    } else {
                        $state.go('home');
                    }
                })
            }, (err) => {
                if (err.error === 403) {
                    err = this.nbgenApp.$translate.instant('global.login.invalid')
                }
                $tmvUiUtils.error(err)
            }).finally(() => $tmvUiUtils.hideWaitDialog())
    }

    forgotPassword() {
        this.$authUiService.resetPassword()
    }
}

angular.module(nbgenApp)
.component(name, {
    template,
    controllerAs: name,
    controller: NbgenLoginCtrl,
    require: {
        nbgenApp: '^nbgenApp'
    }
})
.config(($stateProvider) => {
    'ngInject';

    $stateProvider
        .state(name, {
            parent: 'site',
            // url: '/nbgenLogin',
            data: {
                roles: [ ]
            },
            views: {
                'content@': {
                    template: `<${nameDashed}></${nameDashed}>`,
                }
            },
            resolve: {
                checkAuthentication: ['$state', '$nbgenIdentityService', function($state, $nbgenIdentityService) {
                    // ensure it won't go to this state if already authenticated
                    return new Promise((resolve, reject) => {
                        if ($nbgenIdentityService.isAuthenticated()) {
                            reject()
                        } else {
                            resolve()
                        }
                    })
                }],
                translatePartialLoader: ['$translate', '$translatePartialLoader',
                    function ($translate,$translatePartialLoader) {
                        $translatePartialLoader.addPart(i18npart);
                        return $translate.refresh();
                    }]
            }
        })
})

