import angular from 'angular';

import config from './<%= componentName %>Config.js';
import template from './<%= componentName %>.html';
import moduleName from '../nbgenApp';

const name = '<%= componentName %>';
const controllerAs = '$tmvCollection';

class <%= controllerName %> {
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
        controllerAs: controllerAs,
        controller: <%= controllerName %>,
        require: {
            <%= moduleName %>: '^<%= moduleName %>',
        }
    })
