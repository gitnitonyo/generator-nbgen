import angular from 'angular';

import template from './privacyState.html';
import privacyTemplate from './privacy.html';
import moduleName from '../nbgenApp';
import actionTemplate from './actionTemplate.html';

const name = 'privacy';
const i18npart = `nbgenApp/${name}`;

class PrivacyStateCtrl {
    constructor($scope, $state, $tmvUiUtils) {
        'ngInject';

        this.$tmvUiUtils = $tmvUiUtils;
        this.$state = $state;
    }

    goBack() {
        this.$state.go('home');
    }
}

function _setupPrivacy($scope) {
    const nbgenApp = angular.element('nbgen-app').controller('nbgenApp');
    this.nbgenApp = nbgenApp;
    $scope.privacy = { nbgenApp };
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
                        controller: PrivacyStateCtrl,
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
    .factory('$showPrivacyPolicy', function($tmvUiData) {
        'ngInject';

        return _showPrivacyPolicy;

        function _showPrivacyPolicy() {
            const formModel = { };

            return $tmvUiData.formDialog({
                title: 'Privacy Policy',
                cssClass: 'tmv-full-dialog',
                i18npart,
                template: privacyTemplate,
                formModel,
                functions: {
                    $initController: _setupPrivacy,
                },
                actionTemplate,
            })
        }
    })
