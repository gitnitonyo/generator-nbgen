import angular from 'angular';

import moduleName from '../nbgenApp';

import template from './supportedBrowsers.html';

const name = "supportedBrowsers";
const i18npart = `nbgenApp/${name}`;

angular.module(moduleName)
    .config(($stateProvider) => {
        'ngInject';

        $stateProvider
            .state(name, {
                parent: 'site',
                url: `/${name}`,
                data: { roles: [ ] },
                resolve: {
                    translatePartialLoader: ['$translate', '$translatePartialLoader',
                        function ($translate,$translatePartialLoader) {
                            $translatePartialLoader.addPart(i18npart);
                            return $translate.refresh();
                        }],
                    // to remove the wait dialog, shown by state transition
                    removeWaitDialog: ['$nbgenWaitDialog', ($nbgenWaitDialog) => Promise.resolve($nbgenWaitDialog.hideDialog())],
                    displaySupportedBrowsers,
                }
            })
    });

function displaySupportedBrowsers($tmvUiData, $nbgenAppConfig) {
    'ngInject';

    const supportedBrowsers = [{
        name: 'Google Chrome',
        minVersion: '49',
        icon: 'mdi-google-chrome',
    }, {
        name: 'Apple Safari',
        minVersion: '9.1',
        icon: 'mdi-apple-safari',
    }, {
        name: 'Firefox',
        minVersion: '47',
        icon: 'mdi-firefox',
    }, {
        name: 'Opera',
        minVersion: '39',
        icon: 'mdi-opera'
    }, {
        name: 'Microsoft Edge',
        minVersion: '13',
        icon: 'mdi-edge',
    }]

    return new Promise((_resolve, _reject) => {
        $tmvUiData.formDialog({
            template,
            okLabel: 'global.common.ok',
            cancelLabel: '',
            locals: {
                $nbgenAppConfig,
                supportedBrowsers
            }
        }).finally(() => _reject());
    })
}
