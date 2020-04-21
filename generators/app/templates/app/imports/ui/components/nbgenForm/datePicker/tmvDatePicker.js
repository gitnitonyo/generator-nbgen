import angular from 'angular';
import _ from 'underscore';
import moduleName from '../nbgenForm.js';

const componentName = 'tmvDatePicker';
const controllerAs = `$${componentName}`;

import template from './tmvDatePicker.html';

class TmvDatePickerCtrl {
    constructor($element) {
        'ngInject';

        this.$element = $element;
    }

    $onInit() {

    }

    $postLink() {

    }

    /**
     * Include infotext on messages
     */
    _errorObjects() {
        return _.extend({infotext: true}, this.ngModelCtrl.$error);
    }

    _isRequired() {
        return this.$element.attr('required');      // whether it's a required field
    }

    _onFocus() {
        this._inputContainerDom.addClass('md-input-focused');
    }

    _onBlur() {
        this._inputContainerDom.removeClass('md-input-focused');
        if (!this._mdInputDom.hasClass('ng-touched')) {
            this._mdInputDom.addClass('ng-touched');
            this._hasBeenTouched = true;
        }
    }

    $doCheck() {
        if (this.__ngModel !== this.ngModel) {
            this.__ngModel = this.ngModel;
            this.ngModelCtrl.$setViewValue(this.ngModel);
        }
    }
}

angular.module(moduleName)
    .component(componentName, {
        controller: TmvDatePickerCtrl,
        controllerAs: controllerAs,
        template: template,
        require: {
            ngModelCtrl: 'ngModel',
        },
        bindings: {
            ngModel: '=',
            ngRequired: '&',
            ngChange: '&',
            label: '@',     // label to be used for input container
            readOnly: '&',
            name: '@',

            // usual bindings for input container
            hint: '@',
            hintLabel: '@',
            infoText: '@',

            leftIcon: '@',
            rightIcon: '@',

            minDate: '<',
            maxDate: '<',
        }
    })
