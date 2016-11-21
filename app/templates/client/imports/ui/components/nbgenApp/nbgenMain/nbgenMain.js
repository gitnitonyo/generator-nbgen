import angular from 'angular'

import nbgenApp from '../nbgenApp.js'

import template from './nbgenMain.html'

const name = 'nbgenMain'
const i18npart = `${nbgenApp}/${name}`

class NbgenMainCtrl {
    constructor($tmvUiUtils, $timeout) {
        'ngInject';

        this.$tmvUiUtils = $tmvUiUtils
        this.$timeout = $timeout
    }

    isAuthenticated() {
        return this.nbgenApp && this.nbgenApp.$identityService.isAuthenticated()
    }

    dialogTest() {
        this.$timeout(() => this.$tmvUiUtils.alert("Another sample"), 500)
    }

    $postLink() {

    }
}

angular.module(nbgenApp)
// the component
.component(name, {
    template,
    controllerAs: name,
    controller: NbgenMainCtrl,
    require: {
        nbgenApp: '^nbgenApp'
    }
})
.config(function($stateProvider) {
    'ngInject'

    $stateProvider
        .state('home', {
            parent: 'site',
            url: '/',
            data: {
                roles: [ ]
            },
            views: {
                'content@': {
                    template: '<nbgen-main class="app-content anim-fade" layout="column"></nbgen-main>',
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
