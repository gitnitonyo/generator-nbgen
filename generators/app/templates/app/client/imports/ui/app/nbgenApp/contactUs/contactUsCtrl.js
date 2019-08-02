import angular from 'angular';

import config from './contactUsConfig.js';
import template from './contactUs.html';
import moduleName from '../nbgenApp';

const name = 'contactUs';

class ContactUsCtrl {
    constructor($tmvUiUtils, $state) {
        'ngInject';

        this.$config = config;
        this.$tmvUiUtils = $tmvUiUtils;
        this.$state = $state;
    }

    $onInit() {
        // all controllers have been initialized
        this.formModel = { }
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

    submitMessage() {
        this.$tmvUiUtils.showWaitDialog();
        this.nbgenApp.call('misc.contactUs', this.formModel, (err) => {
            this.$tmvUiUtils.hideWaitDialog();
            if (err) {
                this.$tmvUiUtils.error(err);
            } else {
                this.$tmvUiUtils.alert("tx:contactUs.labels.thankYou").finally(() => this.$state.go('home'));
            }
        })
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: ContactUsCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
