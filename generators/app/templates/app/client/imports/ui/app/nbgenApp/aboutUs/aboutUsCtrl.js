import angular from 'angular';

import config from './aboutUsConfig.js';
import template from './aboutUs.html';
import moduleName from '../nbgenApp';

const name = 'aboutUs';

class AboutUsCtrl {
    constructor() {
        'ngInject';

        this.$config = config
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
        controller: AboutUsCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
