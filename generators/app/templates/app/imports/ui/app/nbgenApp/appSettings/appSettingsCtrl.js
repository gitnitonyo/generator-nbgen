import angular from 'angular';

import config from './appSettingsConfig.js';
import template from './appSettings.html';
import moduleName from '../nbgenApp';

import { ApplicationParameters, applicationInfoId } from '../../../../common/applicationParameters/collection';

const name = 'appSettings';

class AppSettingsCtrl {
    constructor($reactive, $scope, $tmvUiUtils, $state) {
        'ngInject';

        this.$config = config

        $reactive(this).attach($scope);

        this.subscribe('$applicationParameters');
        this.helpers({
            applicationInfo: () => ApplicationParameters.findOne(applicationInfoId)
        })

        this.$tmvUiUtils = $tmvUiUtils;
        this.$state = $state;
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

    saveClick() {
        this.call('applicationParameters.saveSettings', this.applicationInfo, (err) => {
            if (err) {
                this.$tmvUiUtils.error(err);
            } else {
                this.$tmvUiUtils.alert("Settings successfully saved").then(() => this.$state.go('home'));
            }
        })
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: AppSettingsCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
