import angular from 'angular';

import template from './termsOfUseState.html';
import termsTemplate from './termsOfUse.html';
import moduleName from '../nbgenApp';
import actionTemplate from './actionTemplate.html';

const name = 'termsOfUse';
const i18npart = `nbgenApp/${name}`;

class TermsOfUseStateCtrl {
    constructor($scope, $state, $tmvUiUtils) {
        'ngInject';

        this.$tmvUiUtils = $tmvUiUtils;
        this.$state = $state;
    }

    goBack() {
        this.$state.go('home');
    }
}

function _setupTermsAndConditions($scope) {
    const nbgenApp = angular.element('nbgen-app').controller('nbgenApp');
    this.nbgenApp = nbgenApp;
    $scope.termsOfUse = { nbgenApp };
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
                        controller: TermsOfUseStateCtrl,
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
    .factory('$showTermsAndConditions', function($tmvUiData) {
        'ngInject';

        return _showTermsAndConditions;

        function _showTermsAndConditions() {
            const formModel = { };

            return $tmvUiData.formDialog({
                title: 'Terms and Conditions of Use',
                cssClass: 'tmv-full-dialog',
                i18npart,
                template: termsTemplate,
                formModel,
                functions: {
                    $initController: _setupTermsAndConditions,
                },
                actionTemplate,
            })
        }
    })
