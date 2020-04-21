import angular from 'angular';
import _ from 'underscore';

import config from './tmvLineItemsConfig.js';
import template from './tmvLineItems.html';
import actionTemplate from './tmvLineItemsAction.html';
import preLineItems from './preLineItems.html';

import moduleName from '../nbgenForm.js';

const name = 'tmvLineItems';

class TmvLineItemsCtrl {
    constructor($scope, $element, $timeout, $q, $tmvUiData, $translate, $tmvUiUtils, $parse, $interpolate, $tmvFormService) {
        'ngInject';

        this.$config = config;
        this.$timeout = $timeout;
        this.$scope = $scope;
        this.$element = $element;
        this.$q = $q;
        this.$tmvUiData = $tmvUiData;
        this.$translate = $translate;
        this.$tmvUiUtils = $tmvUiUtils;
        this.$parse = $parse;
        this.$interpolate = $interpolate;
        this.$tmvFormService = $tmvFormService;
    }

    $onInit() {
        // all controllers have been initialized
        // disable labels
        if (_.isObject(this.lineSchema)) {
            if (_.isArray(this.lineSchema)) {
                this.lineLayout = this.lineSchema;
                this.lineSchema = {lineLayout: this.lineLayout}
            } else {
                this.lineLayout = this.lineSchema.lineLayout || [];
            }
            this.lineLayout.forEach((lineItem) => {
                lineItem.fieldLabelDisable = true;
                lineItem.fieldInputType = 'static';     // all items are read-only
            })
        }

        // so we can call $tmvCollection methods inside the template
        if (this.$scope.$parent.$tmvCollection) {
            this.$scope.$tmvCollection = this.$scope.$parent.$tmvCollection;
        }

        if (!this.actionTemplate) {
            this.actionTemplate = actionTemplate;
        }
        if (!this.preLineItems) {
            this.preLineItems = preLineItems;
        }


    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
    }

    _convertToInternal() {
        let lineItemData = [ ];
        const modelValue = this.ngModelCtrl.$modelValue;
        if (_.isArray(modelValue)) {
            _.each(modelValue, v => {
                lineItemData.push(angular.copy(v));
            })
        }

        return lineItemData;
    }

    _convertToExternal() {
        const lineItemData = this.lineItemData;
        const modelValue = [ ];
        if (_.isArray(lineItemData)) {
            _.each(lineItemData, v => {
                if (v !== null && v !== undefined) {
                    modelValue.push(angular.copy(v));
                }
            })
        }

        return modelValue;
    }

    $postLink() {
        this._inputContainer = this.$element.find('.tmv-line-items-container');
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
            this._inputDom.addClass('ng-touched');
            this._hasBeenTouched = true;
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
        }

        // are there changes in the internal value
        if (!_.isEqual(this.$currentInternalValue, this.lineItemData)) {
            this.$currentInternalValue = angular.copy(this.lineItemData);
            let modelValue = this._convertToExternal();
            if (!_.isEqual(modelValue, this.ngModelCtrl.$modelValue)) {
                if (_.isArray(modelValue) && modelValue.length === 0) {
                    this.$currentModelValue = null;
                    this.ngModelCtrl.$setViewValue(null);
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

    removeItem(index, lineItem) {
        // the beforeRemove may reject to cancel removing
        this.$q.when(this.beforeRemove({$index: index, $lineItem:lineItem, $ngModel: this.ngModelCtrl}), () => {
            // ask user to confirm first
            this.$tmvUiUtils.confirm('tx:global.common.removeConfirm').then(() => {
                    // continue only if the result is not false
                this.lineItemData.splice(index, 1);
                this.afterRemove({$index: index, $lineItem: lineItem, $ngModel: this.ngModelCtrl}); // call after event
            })
        })
    }

    isViewMode() {
        if (_.isBoolean(this.lineSchema.editOnClick))
            return !this.lineSchema.editOnClick;
        if (_.isFunction(this.lineSchema.editOnClick)) {
            return !this.lineSchema.editOnClick.call(this.$scope.$tmvCollection || this);
        }

        return true;
    }

    editItem(index, lineItem, viewOnly) {
        // execute before event
        const formModel = angular.copy(lineItem);

        this._formDialog(formModel, viewOnly ? 'view' : 'edit', index).then(formModel => {
            formModel = this.$tmvUiUtils.cleanUpData(formModel);
            this.$q.when(this.beforeEdit({$index: index, $lineItem: lineItem, $ngModel: this.ngModelCtrl}), () => {
                // copy the new values to the line item
                _.extend(lineItem, formModel);
                this.afterEdit({$index: index, $lineItem: lineItem, $ngModel: this.ngModelCtrl});
            })
        })
    }

    addItem(index) {
        if (index === undefined) index = this.lineItemData.length;      // set index to the end of the items array
        let formModel = { };
        this._formDialog(formModel, 'new', index).then(formModel => {
            let dataToSave = this.$tmvUiUtils.cleanUpData(formModel);
            this.$q.when(this.beforeAdd({$index: index, $ngModel: this.ngModelCtrl, $lineItem: dataToSave}), () => {
                // save the form model to the line data
                if (index === undefined || index >= this.lineItemData.length - 1) {
                    if (this.prependOnAdd) {
                        // always at the start
                        this.lineItemData.splice(0, 0, dataToSave);
                    } else {
                        this.lineItemData.push(dataToSave);
                    }
                } else {
                    this.lineItemData.splice(index-1, 0, dataToSave);
                }

                // call the after add event
                this.afterAdd({$lineItem: dataToSave, $ngModel: this.ngModelCtrl});
            })
        })
    }

    _renderCell(lineItem, lineItemSchema) {
        if (_.isString(lineItemSchema.computedValue)) {
            return this.$parse(lineItemSchema.computedValue)(lineItem, {$ctrl: this});
        }
        if (_.isString(lineItemSchema.displayExpr)) {
            return this.$interpolate(lineItemSchema.displayExpr)(lineItem);
        }

        return this.$parse(lineItemSchema.fieldName)(lineItem);
    }

    _formDialog(formModel, mode, index) {
        return this.$q((_resolve, _reject) => {
            this.$q.when(this.formSchema({$formModel: formModel, $mode: mode, $index: index}) || this.formLayout({$formModel: formModel, $mode: mode, $index: index}), data => {
                // check if additional data is passed
                let _formData = { };
                if (data && data.formLayout) {
                    _formData.formSchema = {formLayout: data.formLayout};
                    if (data.translatePrefix) {
                        _formData.formSchema.translatePrefix = data.translatePrefix;
                    }
                } else if (data && data.formSchema) {
                    _formData.formSchema = data.formSchema;
                } else {
                    _formData.formSchema = {formLayout: data};
                }
                if (data && data.locals) {
                    _formData.locals = data.locals;
                }
                if (data && data.functions) {
                    _formData.functions = data.functions;
                }

                // view mode may change
                if (data && data.viewMode) {
                    mode = data.viewMode;
                }

                let options = {
                    title: this.$translate.instant(`${this.translatePrefix}${this.formTitle || this.ngModelCtrl.$name}`),
                    formSchema: _formData.formSchema,
                    locals: _formData.locals,
                    functions: _formData.functions,
                    formModel,
                    translatePrefix: `${this.translatePrefix}${this.name}`,
                    actionTemplate: this.formActionTemplate,
                    mode,
                }

                let formHandler;

                if (this.editIn) {
                    formHandler = this.$tmvFormService(options, this.$scope, this.editIn);
                } else {
                    options.cssClass = 'tmv-line-items-data-entry ' + (this.formDialogCss || '');
                    formHandler = this.$tmvUiData.formDialog(options);
                }

                formHandler.then(val => _resolve(val), err => _reject(err));
            })
        })
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

    _openActionMenu($mdMenu, $event) {
        $event.stopPropagation();
        $mdMenu.open();
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: TmvLineItemsCtrl,
        require: {
            ngModelCtrl: 'ngModel',
        },
        bindings: {
            label: '@',
            name: '@',
            formLayout: '&',
            formSchema: '&',
            lineSchema: '<',
            translatePrefix: '@',
            alwaysRed: '@',

            hint: '@',
            hintLabel: '@',
            infoText: '@',

            readOnly: '&',
            noAction: '&',
            noItemNo: '@',
            noDirty: '@',       // if attribute is present, controller will be marked dirty
            formTitle: '@',
            formDialogCss: '@', // css class to attach to the form dialog

            allowAddOnly: '@',   // whether only add action is permitted
            prependOnAdd: '@',   // whether addition should be prepended at the start

            // events
            beforeAdd: '&',
            afterAdd: '&',
            beforeEdit: '&',
            afterEdit: '&',
            beforeRemove: '&',
            afterRemove: '&',

            preFormAdd: '&',    // executed before displaying the form to add
            preFormEdit: '&',   // executed before displaying the form to edit

            // customized action template
            actionTemplate: '<',
            preLineItems: '<',  // template displayed before displaying the table of line items

            formActionTemplate: '<',    // action template for the form dialogled

            // whether to disabled actions
            addDisabled: '&',
            editDisabled: '&',
            removeDisabled: '&',

            doCheck: '&',

            // a dom id where the form will be opened for editing
            editIn: '@',
        }
    });
