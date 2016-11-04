import angular from 'angular'

import nbgenApp from '../nbgenApp.js'

import template from './nbgenSignupState.html'

const name = 'nbgenSignup'
const i18npart = `${nbgenApp}/${name}`

angular.module(nbgenApp)
    .config(function($stateProvider) {
        'ngInject';

        $stateProvider
            .state(name, {
                parent: 'site',
                url: `/${name}`,
                data: {
                    roles: [
                    ]
                },
                views: {
                    'content@': {
                        template,
                    }
                },
                resolve: {
                    checkAuthentication: ['$state', '$nbgenIdentityService', '$q', function($state, $nbgenIdentityService, $q) {
                        // ensure it won't go to this state if already authenticated
                        return $q(function(resolve, reject) {
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
