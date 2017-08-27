import angular from 'angular';

import template from './<%= componentName %>State.html';
import moduleName from '../nbgenApp';

const name = '<%= componentName %>';
const i18npart = `${name}`;

// specify roles here whore are able to access this state
const roles = [ ];

class <%= stateControllerName %> {
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
                    roles: roles,
                },
                views: {
                    'content@': {
                        template,
                        controller: <%= stateControllerName %>,
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
