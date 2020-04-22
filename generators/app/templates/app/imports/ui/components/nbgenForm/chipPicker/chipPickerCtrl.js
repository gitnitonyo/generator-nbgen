import angular from 'angular';
import config from './chipPickerConfig.js';
import template from './chipPicker.html';
import moduleName from '../nbgenForm.js';

import _ from 'underscore';

const name = 'chipPicker';

class ChipPickerCtrl {
    constructor($scope, $element, $attrs, nbgenDataPicker, $timeout, $parse, $interpolate) {
        'ngInject';

        this.$config = config
        this.$scope = $scope;
        this.$element = $element;
        this.dataPicker = nbgenDataPicker;
        this.$timeout = $timeout;
        this.$parse = $parse;
        this.$interpolate = $interpolate;
        this.$attrs = $attrs;
    }

    isRequired() {
        return this._isRequired;
    }

    $onInit() {
        this.$attrs.$observe('required', v => {
            if (v === undefined || v === null) {
                this._isRequired = false;
            } else {
                this._isRequired = _.isBoolean(v) ? v : true;
            }
        })

        // all controllers have been initialized
        if (this.readonly === undefined) {
            this.readonly = true;
        }
        if (this.removable === undefined) {
            this.removable = true;
        }

        if (this.btnLabel === undefined) {
            this.btnLabel = 'global.common.select';
        }

        this.listLayout = this.listLayout();

        if (this.listLayout === undefined) {
            this.listLayout = {
                displayAvatar: false,
                fields: [{
                    fieldName: 'description',
                    searchField: true
                }]
            }
        } else if (_.isString(this.listLayout)) {
            // assume this is a string of fields delimited by ','
            let parts = this.listLayout.split(/\s+|,\s*/);
            this.listLayout = {
                displayAvatar: false,
                fields: [ ],
            };
            parts.forEach((v, i) => {
                this.listLayout.fields.push({ fieldName: v, searchField: true });
                if (i === 0) this.listLayout.initialSort = {[v]: 1};
            });
        }

        if (this.chipTemplate === undefined) {
            if (this.listLayout && this.listLayout.fields && this.listLayout.fields.length > 0) {
                this.chipTemplate = `{{${this.listLayout.fields[0].fieldName}}}`;
                const noFields = !this.fields;
                if (noFields) this.fields = this.listLayout.fields[0].fieldName;
                if (this.listLayout.fields.length > 1) {
                    this.listLayout.fields.slice(1).forEach((v) => {
                        if (v.fieldName) {
                            this.chipTemplate += ` - {{${v.fieldName}}}`;
                            if (noFields) this.fields += `,${v.fieldName}`;
                        }
                    });
                }
            }
        }

        if (this.chipTemplate === undefined) {
            this.chipTemplate = function(chip) {
                return angular.isString(chip) ? chip : (chip.description || chip.name || chip.desc || chip.serviceName);
            }
        } else if (_.isString(this.chipTemplate)) {
            let templateStr = this.chipTemplate;
            this.chipTemplate = function(chip) {
                let result = _.isString(chip) ? chip : this.$interpolate(templateStr)(chip);
                return result;
            }
        }

        // so we can call $tmvCollection methods inside the template
        if (this.$scope.$parent.$tmvCollection) {
            this.$scope.$tmvCollection = this.$scope.$parent.$tmvCollection;
        }

        if (!this.fields) {
            this._fields = [ ];
        } else {
            this._fields = this.fields.split(/\s+|,\s*/);
        }

        this.$scope.$watch(() => this.readOnly(), v => {
            if (v === true) {
                this.$element.attr('readonly', 'readonly')
            } else {
                this.$element.removeAttr('readonly');
            }
        })
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
    }

    _convertToInternal() {
        const modelCopy = angular.copy(this.ngModelCtrl.$modelValue);
        let chipsValue;
        if (this.single === true) {
            if (modelCopy) {
                let chipValueStr = this.chipTemplate && this.chipTemplate(modelCopy);
                if (chipValueStr.trim()) {
                    chipsValue = [modelCopy];
                } else {
                    chipsValue = [ ];
                }
            } else {
                chipsValue = [ ];
            }
        } else {
            chipsValue = modelCopy || [ ];
        }

        return chipsValue;
    }

    __modelWithFields(value) {
        const modelValue = { };
        if (value._id) {
            // _id field is always copied
            modelValue._id = value._id;
        }

        // copy those specified in the list
        this._fields.forEach(f => {
            this.$parse(f).assign(modelValue, this.$parse(f)(value));
        });

        return modelValue;
    }

    _convertToExternal() {
        const copiedValue = angular.copy(this.chipsValue);
        let modelValue;
        if (this.single === true) {
            if (copiedValue.length > 0) {
                if (this._fields.length === 0) {
                    modelValue = copiedValue[0];
                } else {
                    modelValue = this.__modelWithFields(copiedValue[0]);
                }
            } else {
                modelValue = undefined;
            }
        } else {
            if (copiedValue.length > 0) {
                if (this._fields.length === 0) {
                    modelValue = copiedValue;
                } else {
                    // filter the array
                    const values = [ ];
                    copiedValue.forEach(v => {
                        values.push(this.__modelWithFields(v));
                    });
                    modelValue = values;
                }
            } else {
                this.$currentModelValue = undefined
            }
        }
        return modelValue;
    }

    $postLink() {

    }

    /**
     * Include infotext on messages
     */
    _errorObjects() {
        return _.extend({infotext: true}, this.ngModelCtrl.$error);
    }

    _onFocus() {
        this._pickerActive = true;
    }

    _onBlur() {
        this.hasClicked = true;
        this._pickerActive = false;
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    $doCheck() {

        // use deep comparison
        if (!_.isEqual(this.$currentModelValue, this.ngModelCtrl.$modelValue)) {
            this.$currentModelValue = angular.copy(this.ngModelCtrl.$modelValue);
            // convert to internal data storage
            let newChipsValue = this._convertToInternal();
            if (!_.isEqual(newChipsValue, this.chipsValue)) {
                this.$currentInternalValue = angular.copy(newChipsValue);
                this.chipsValue = newChipsValue;
            }
        }

        if (!_.isEqual(this.$currentInternalValue, this.chipsValue)) {
            this.$currentInternalValue = angular.copy(this.chipsValue);
            let newModelValue = this._convertToExternal();
            if (!_.isEqual(newModelValue, this.ngModelCtrl.$modelValue)) {
                this.$currentModelValue = angular.copy(newModelValue);
                this.ngModelCtrl.$setViewValue(newModelValue);
            }
        }
    }

    pickClick() {
        this._pickerDialogActive = true;
        this.$multipleObjs = {
            selectedCodes: { },
            selectedObjs: { }
        }
        if (this.chipsValue && this.chipsValue.length > 0) {
            this.chipsValue.forEach((item) => {
                this.$multipleObjs.selectedCodes[item._id] = true;
                this.$multipleObjs.selectedObjs[item._id] = item;
            })
        }
        const otherOptions = angular.extend({}, this.pickerOptions, { pickMultipleObj: this.$multipleObjs }, {dataFilter: this.filterFn});
        if (this.single !== true) {
            otherOptions.pickMultiple = true,
            otherOptions.okLabel = 'global.common.ok'
        } else {
            otherOptions.okLabel = '';
        }
        // put a delay to allow animation to happen
        this.$timeout(() => {
            this.dataPicker(this.label, this.collection, this.subscription, this.listLayout, otherOptions)
                .then((item) => {
                    if (this.single !== true) {
                        this.chipsValue = [ ];
                        angular.forEach(this.$multipleObjs.selectedCodes, (value, key) => {
                            if (value) {
                                this.chipsValue.push(this.$multipleObjs.selectedObjs[key]);
                            }
                        })
                    } else {
                        this.chipsValue = [ item ];
                    }
                })
                .catch(_.noop)  // ignore cancel
                .finally(() => {
                    this.$element.find('.chip-picker-input').focus();
                    this._pickerDialogActive = false;
                });
        }, 50);
    }

    removeItem($event, item, index) {
        $event.stopPropagation();   // only consider this as the only event handler for this
        Promise.resolve(this.beforeItemRemove({$event, $item: item, $index: index}))
            .then(() => {
                this.chipsValue.splice(index, 1);
                this.afterItemRemvoe({$event, $item: item, $index: index});
                this.$timeout(() => this.$element.find('.chip-picker-input').focus());
            })
            .finally(() => this._pickerActive = false);
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: ChipPickerCtrl,
        require: {
            ngModelCtrl: 'ngModel'
        },
        bindings: {
            readonly: '<chipReadonly',
            removable: '<',
            label: '@',
            btnLabel: '@',
            subscription: '@',
            collection: '<',
            listLayout: '&',
            chipTemplate: '<',
            single: '<',
            readOnly: '&',
            alwaysRed: '@',

            hint: '@',
            hintLabel: '@',
            infoText: '@',

            noLabel: '@',
            pickerOptions: '<',
            filterFn: '<',
            inline: '@',
            leftIcon: '@',
            rightIcon: '@',

            beforeItemRemove: '&',
            afterItemRemvoe: '&',

            fields: '@',        // comma separated list of fields to transfer to and from the model;
                                // otherwise the whole object will be moved
        }
    })
