import angular from 'angular'

import nbgenApp from '../../nbgenApp.js'

import {appRoles} from '/imports/common/app.roles.js'

import template from './dbStatisticsState.html'

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
                        template,
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
