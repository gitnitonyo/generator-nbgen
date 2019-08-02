import angular from 'angular';
import { Meteor } from '../../nbgenMeteor';

import moduleName from '../nbgenUtilsUi.js';
const componentName = 'nbgenWaitDialog';

let _controllerInstance;

import template from './nbgenWaitDialog.html';

const timeout = 10;

class NbgenWaitDialogCtrl {
    constructor($interval, $tmvUiUtils) {
        'ngInject';

        this.$interval = $interval;
        this.$tmvUiUtils = $tmvUiUtils;

        this.waitMessage = '';
        this.isActive = false;

        _controllerInstance = this;

        this._waitPromise  = null;
        this._numSec = 0;
    }

    showDialog(message) {
             // reconnect if not connected
        this.waitMessage = message;
        this.isActive = true;
        this._numSec = 0;       // reset the number of seconds
        this._waitPromise && this.$interval.cancel(this._waitPromise); this._waitPromise = null;
        this._waitPromise = this.$interval(() => {
            let connectionStatus = Meteor.status();
            if (connectionStatus.status === 'waiting' || connectionStatus.status === 'offline') Meteor.reconnect();
            this._numSec += 1;
            if (this._numSec > timeout && connectionStatus.connected !== true) {
                this.isActive = false;
                this.$interval.cancel(this._waitPromise); this._waitPromise = null;
                this.$tmvUiUtils.error("Timed out connecting to the server.");
            }
        }, 2000);
    }

    hideDialog() {
        // cancel any pending count
        this._waitPromise && this.$interval.cancel(this._waitPromise); this._waitPromise = null;
        this.isActive = false;
    }
}

class NbgenWaitDialogService {
    constructor() {

    }

    showDialog(message) {
        _controllerInstance && _controllerInstance.showDialog(message);
    }

    hideDialog() {
        _controllerInstance && _controllerInstance.hideDialog();
    }
}

angular.module(moduleName)
    .component(componentName, {
        template,
        controllerAs: componentName,
        controller: NbgenWaitDialogCtrl,
    })
    .factory('$nbgenWaitDialog', function() {
        'ngInject';

        return new NbgenWaitDialogService();
    })
