import angular from 'angular';

import config from './nbgenLineItemsConfig.js';
import template from './nbgenLineItems.html';
import moduleName from '../nbgenForm.js';

import _ from 'underscore';

const name = 'nbgenLineItems';

class NbgenLineItemsCtrl {
    constructor($scope, $timeout, $parse, $element, $mdMedia) {
        'ngInject';

        this.$config = config
        this.$timeout = $timeout;
        this.$scope = $scope;
        this.$parse = $parse;
        this.$element = $element;
        this.$mdMedia = $mdMedia;
    }

    $onInit() {
        // all controllers have been initialized

        // disable labels
        if (this.lineSchema && angular.isArray(this.lineSchema)) {
            this.lineSchema.forEach((lineItem) => {
                // lineItem.fieldLabelDisable = true;
                // lineItem.noErrorIndicator = true;   // disable error indicator
                lineItem.fieldLabel = `${this.name}.${lineItem.fieldName}`
            })
        }

        // so we can call $tmvCollection methods inside the template
        if (this.$scope.$parent.$tmvCollection) {
            this.$scope.$tmvCollection = this.$scope.$parent.$tmvCollection;
        }

        if (!this.expandOn) {
            this.expandOn = 'gt-xs';
        }
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
    }

    _convertToInternal() {
        const modelValue = this.ngModelCtrl.$modelValue;
        let lineItemData = [];

        if (_.isArray(modelValue)) {
            _.each(modelValue, v => {
                if (v !== null && v !== undefined) {
                    lineItemData.push(angular.copy(v));
                }
            })
        } else {
            if (this.readOnly()) {
                lineItemData = [ ];
            } else {
                lineItemData = [{}]
            }
        }

        return lineItemData;
    }

    _convertToExternal() {
        let lineItemData = this.lineItemData;
        let newModelValue = [ ];
        if (_.isArray(lineItemData)) {
            _.each(lineItemData, v => {
                if (!this.isEmpty(v)) {
                    this.onChange({$item: v, $data: lineItemData});
                    newModelValue.push(angular.copy(v));
                }
            })
        }

        return newModelValue;
    }

    $postLink() {
        // all elements have been linked
        this._inputContainer = this.$element.find('.nbgen-line-items-input-container');
        this._inputDom = this.$element.find('.md-input');
    }

    /**
     * Include infotext on messages
     */
    _errorObjects() {
        return _.extend({infotext: true}, this.ngModelCtrl.$error);
    }

    _isRequired() {
        return this.$element.attr('required');
    }

    _onFocus() {
        this._inputContainer.addClass('md-input-focused');
    }

    _onBlur() {
        this._inputContainer.removeClass('md-input-focused');
        if (!this._inputDom.hasClass('ng-touched')) {
            this._hasBeenTouched = true;
            this._inputDom.addClass('ng-touched');
        }
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    $doCheck() {
        // are there changes in the model
        if (!_.isEqual(this.$currentModelValue, this.ngModelCtrl.$modelValue)) {
            this.$currentModelValue = angular.copy(this.ngModelCtrl.$modelValue)
            let lineItemData = this._convertToInternal();
            if (!_.isEqual(lineItemData, this.lineItemData)) {
                this.$currentInternalValue = angular.copy(lineItemData);
                this.lineItemData = lineItemData;
            }
            if (!this.readOnly() && _.isEmpty(this.lineItemData)) {
                this.lineItemData = [{}];
            }
        }

        // are there changes in the internal value
        if (!_.isEqual(this.$currentInternalValue, this.lineItemData)) {
            this.$currentInternalValue = angular.copy(this.lineItemData);
            let modelValue = this._convertToExternal();
            if (!_.isEqual(modelValue, this.ngModelCtrl.$modelValue)) {
                if (_.isArray(modelValue) && modelValue.length === 0) {
                    this.$currentModelValue = undefined;
                    this.ngModelCtrl.$setViewValue(undefined);
                } else {
                    this.$currentModelValue = angular.copy(modelValue);
                    this.ngModelCtrl.$setViewValue(modelValue);
                }
            }
        }

        this.doCheck({$modelValue: this.$currentModelValue, $ctrl: this});
    }

    isEmpty(obj) {
        if (_.isEmpty(obj) || _.keys(obj).length === 0 || (_.keys(obj).length === 1 && obj.$$hashKey))
            return true;
        return false;
    }

    removeItem(index) {
        this.lineItemData.splice(index, 1);
        if (this.lineItemData.length === 0) {
            this.lineItemData.push({});     // always have at least 1 item
        }
    }

    addItem(index) {
        if (index === this.lineItemData.length - 1) {
            this.lineItemData.push({ })
        } else {
            this.lineItemData.splice(index-1, 0, {})
        }
    }

    _hasNoAction(item) {
        let result = false;
        if (this.noAction) {
            result = result || this.noAction({$item: item});
        }
        if (this.readOnly) {
            result = result || this.readOnly({$item: item});
        }
        return result;
    }

    _isLineItemRequired(lineItemSchema) {
        if (lineItemSchema.fieldValidateRulesRequired !== undefined) {
            if (_.isBoolean(lineItemSchema.fieldValidateRulesRequired)) return lineItemSchema.fieldValidateRulesRequired;
            return this.$parse(lineItemSchema.fieldValidateRulesRequired)(this.$scope.$parent);
        }
        return false;
    }

    // returns true if table should be collapse
    _shouldCollapse() {
        if (this.expandOn === 'true') return false;
        if (this.expandOn === 'false') return true;
        return !this.$mdMedia(this.expandOn);
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: NbgenLineItemsCtrl,
        require: {
            ngModelCtrl: 'ngModel'
        },
        bindings: {
            label: '@',
            name: '@',
            lineSchema: '<',
            translatePrefix: '@',
            onChange: '&',
            readOnly: '&',
            noAction: '&',
            footer: '&',
            hasFooter: '@',
            noItemNo: '@',
            alwaysRed: '@',

            hint: '@',
            hintLabel: '@',
            infoText: '@',

            otherData: '<',
            expandOn: '@',    // indicates when table is expanded; default to 'gt-xs'; if value is 'false' || 'true'
            doCheck: '&',       // called every digest cycle
        }
    })
