import angular from 'angular';

import template from './appSettingsState.html';
import moduleName from '../nbgenApp';

import { appRoles } from '../../../../common/app.roles';

const name = 'appSettings';
const i18npart = `nbgenApp/${name}`;

class AppSettingsStateCtrl {
    constructor($scope, $state, $tmvUiUtils) {
        'ngInject';

        this.$tmvUiUtils = $tmvUiUtils;
        this.$state = $state;
    }

    goBack() {
        this.$state.go('home');
    }
}

angular.module(moduleName)
    .config(function($stateProvider) {
        'ngInject';

        $stateProvider
            .state(name, {
                parent: 'site',
                url: `/${name}`,
                data: {
                    roles: [
                        // specify roles allowed to access this route
                        appRoles.SUPER_ADMIN,
                        appRoles.USER_ADMIN
                    ]
                },
                views: {
                    'content@': {
                        template,
                        controller: AppSettingsStateCtrl,
                        controllerAs: '$ctrl'
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
