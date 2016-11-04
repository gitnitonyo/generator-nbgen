import angular from 'angular';

import config from './<%= componentName %>Config.js';
import template from './<%= componentName %>.html';
import moduleName from '../../components/nbgenApp/nbgenApp.js';

const name = '<%= componentName %>';

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
        controllerAs: name,
        controller: <%= controllerName %>,
        require: {
            <%= moduleName %>: '^<%= moduleName %>',
        }
    })
