import angular from 'angular';

import template from './nbgenRegisterState.html';
import moduleName from '../nbgenApp';

const name = 'nbgenRegister';
const i18npart = `nbgenApp/${name}`;
import appConfig from '../nbgenAppConfig.js';

class NbgenRegisterStateCtrl {
    constructor($scope, $state, $tmvUiUtils) {
        'ngInject';

        this.$tmvUiUtils = $tmvUiUtils;
        this.$state = $state;
        this.$appConfig = appConfig;
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
                    ]
                },
                views: {
                    'content@': {
                        template,
                        controller: NbgenRegisterStateCtrl,
                        controllerAs: '$ctrl'
                    }
                },
                resolve: {
                    translatePartialLoader: ['$translate', '$translatePartialLoader',
                        function ($translate,$translatePartialLoader) {
                            $translatePartialLoader.addPart(i18npart);
                            $translatePartialLoader.addPart('nbgenApp/organizations');      // include organizations
                            return $translate.refresh();
                        }]
                }
            })
    })
