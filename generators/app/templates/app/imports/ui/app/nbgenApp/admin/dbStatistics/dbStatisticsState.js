import angular from 'angular'

import nbgenApp from '../..'

import {appRoles} from '../../../../../common/app.roles'

const name = 'dbStatistics'
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
                        appRoles.SUPER_ADMIN
                    ]
                },
                views: {
                    'content@': {
                        template: '<db-statistics></db-statistics>'
                    }
                },
                resolve: {
                    translatePartialLoader: ['$translate', '$translatePartialLoader',
                        function ($translate,$translatePartialLoader) {
                            $translatePartialLoader.addPart(i18npart);
                            return $translate.refresh();
                        }]
                }
            })
    })
