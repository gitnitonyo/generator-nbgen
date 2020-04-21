import angular from 'angular';

import config from './termsOfUseConfig.js';
import template from './termsOfUse.html';
import moduleName from '../nbgenApp';

import acceptanceActionTemplate from './acceptanceAction.html';

const name = 'termsOfUse';

class TermsOfUseCtrl {
    constructor() {
        'ngInject';

        this.$config = config;
    }

    $onInit() {
        // all controllers have been initialized
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
    }

    $postLink() {
        // all elements have been linked
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    $doCheck() {

    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: TermsOfUseCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
    .factory('$showAcceptance', function($tmvUiData) {
        'ngInject';

        return _showAcceptance;

        function _showAcceptance(template, title, acceptancePrompt, downloadHref, initFunc) {
            const formModel = { };
            const nbgenApp = angular.element('nbgen-app').controller('nbgenApp');

            return $tmvUiData.formDialog({
                title,
                cssClass: 'tmv-full-dialog',
                template,
                formModel,
                functions: {
                    $initController: initFunc,
                },
                actionTemplate: acceptanceActionTemplate,
                locals: {
                    nbgenApp,
                    acceptancePrompt,
                    downloadHref,
                }
            })
        }
    })
