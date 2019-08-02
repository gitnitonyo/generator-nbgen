import angular from 'angular';

import template from './contactUsState.html';
import moduleName from '../nbgenApp';

const name = 'contactUs';
const i18npart = `nbgenApp/${name}`;

class ContactUsStateCtrl {
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
                    ]
                },
                views: {
                    'content@': {
                        template,
                        controller: ContactUsStateCtrl,
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
