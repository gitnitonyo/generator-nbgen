import angular from 'angular';
import _ from 'underscore';
import moduleName from '../nbgenForm.js';
import moment from 'moment';

const componentName = 'tmvTimePicker';
const controllerAs = `$${componentName}`;
import timePickerTemplate from './tmvTimePicker.html';

class TmvTimePickerCtrl {

    constructor($element) {
        'ngInject';

        this.$element = $element;
    }

    $onInit() {

    }

    $postLink() {
        this._inputContainerDom = this.$element.find('.tmv-time-picker-container');
        this._mdInputDom = this._inputContainerDom.find('.md-input');
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
        this._mdTimeReadOnly = this.readOnly({$value: this.ngModel});
        this._mdTimeRequired = this.ngRequired({$value: this.ngModel});

        if (this._mdTimeReadOnly !== true) {
            // only validate if not readonly
            let ngModelDate;
            if (this.ngModel) {
                ngModelDate = moment(this.ngModel);
            }

            if (this.minDate && ngModelDate) {
                let minDate = moment(this.minDate);
                if (minDate.isValid() && ngModelDate.isValid()) {
                    if (ngModelDate.isBefore(minDate)) {
                        // reset the date to be the minimum date
                        this.ngModel = minDate.toDate();
                    }
                }
            }

            if (this.maxDate && ngModelDate) {
                let maxDate = moment(this.maxDate);
                if (maxDate.isValid() && ngModelDate.isValid()) {
                    if (ngModelDate.isAfter(maxDate)) {
                        // reset to the maximum date
                        this.ngModel = maxDate.toDate();
                    }
                }
            }
        }
    }

    openTimePicker(ev) {
        let tpScope = this.$element.find('md-time-picker ng-form').scope();
        tpScope && tpScope.showPicker && tpScope.showPicker(ev);
    }
}

angular.module(moduleName)
    .component(componentName, {
        controller: TmvTimePickerCtrl,
        controllerAs: controllerAs,
        template: timePickerTemplate,
        require: {
            ngModelCtrl: 'ngModel'
        },
        bindings: {
            ngModel: '=',
            ngRequired: '&',
            label: '@',     // label to be used for input container
            readOnly: '&',

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
