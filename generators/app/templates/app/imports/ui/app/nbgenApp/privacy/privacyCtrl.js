import angular from 'angular';

import config from './privacyConfig.js';
import template from './privacy.html';
import moduleName from '../nbgenApp';

const name = 'privacy';

class PrivacyCtrl {
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

    imClick() {
        console.log('Im clicked');
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: PrivacyCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
