import angular from 'angular'
import _ from 'underscore'
import _s from 'underscore.string'

import nbgenForm from './nbgenForm.js'

angular.module(nbgenForm)
.directive('tmvForm', function($compile, $templateCache, $tmvUtils) {
    'ngInject'

    return {
        restrict: 'E',
        require: ['^form', 'tmvForm'],
        controller: _controllerFn,
        link: _linkFn,
        transclude: 'element'
    };

    function _controllerFn($scope, $element, $attrs) {
        'ngInject'

        let tmvForm = this;

        // initialize controller properties
        tmvForm.$scope = $scope;
        tmvForm.formSchema = $scope.$eval($attrs.formSchema);
        tmvForm.formModelName = $attrs.formModel;
        tmvForm.translatePrefix = $attrs.translatePrefix || tmvForm.formSchema.translatePrefix || 'global.';
        if (!tmvForm.translatePrefix.endsWith(".")) {
            tmvForm.translatePrefix += ".";
        }

        tmvForm.formKey = _.uniqueId('tmvForm_');     // use as key to locate the mapped fields within the scope
        tmvForm.mappedFields = tmvForm.$scope[tmvForm.formKey] = { };          // will contains the mapped fields

        // entry point
        tmvForm._handleFormLayout = function(layoutDom, formLayout, formCtrl) {
            if (!angular.isObject(formLayout)) return;      // dont do anything if layout is not an object

            // check if there's a style or class specified
            if (angular.isObject(formLayout.cssStyle)) layoutDom.css(formLayout.cssStyle)
            if (angular.isString(formLayout.cssClass)) layoutDom.addClass(formLayout.cssClass)

            this._handleOperation(layoutDom, formLayout, formCtrl);
        };

        tmvForm._handleOperation = function(parentDom, schema, formCtrl) {
            let operationMap = {
                formGroups: angular.bind(this, this._handleFormGroups),
                template: angular.bind(this, this._handleTemplate),
                table: angular.bind(this, this._handleTable),
                formTabs: angular.bind(this, this._handleFormTabs),
                fields: angular.bind(this, this._handleFields)
            };

            angular.forEach(schema, function(subSchema, propName) {
                let fn = _.find(operationMap, function(operation, key) {
                    let re = new RegExp('^' + key);
                    return re.test(propName);
                });
                if (angular.isDefined(fn)) { // matching operation found
                    fn(parentDom, subSchema, formCtrl)
                }
            })
        };


        tmvForm._handleFormGroups = function(parentDom, formGroups, formCtrl) {
            if (!angular.isArray(formGroups)) {
                if (angular.isObject(formGroups)) {
                    formGroups = [formGroups]
                } else {
                    return;
                }
            }
            let _this = this;

            angular.forEach(formGroups, function(formGroup, index) { // eslint-disable-line
                let formGroupDom = angular.element('<div>')
                        .addClass('row tmv-form-group tmv-field-set');
                if (!formGroup.gridClass) formGroup.gridClass = "col-xs-12"
                if (formGroup.ngIf) formGroupDom.attr('ng-if', formGroup.ngIf)
                if (formGroup.ngShow) formGroupDom.attr('ng-show', formGroup.ngShow)

                let wrapperDom = formGroupDom;
                if (angular.isString(formGroup.gridClass)) {
                    wrapperDom = angular.element('<div>').addClass(formGroup.gridClass)
                        .append(formGroupDom);
                    if (formGroup.ngIf) wrapperDom.attr('ng-if', formGroup.ngIf)
                    if (formGroup.ngShow) wrapperDom.attr('ng-show', formGroup.ngShow)
                    if (angular.isObject(formGroup.gridAttrs)) {
                        angular.forEach(formGroup.gridAttrs, function(value, key) {
                            wrapperDom.attr(key, value)
                        })
                    }
                }

                if (angular.isString(formGroup.class)) formGroupDom.addClass(formGroup.class)
                if (angular.isObject(formGroup.cssStyle)) formGroupDom.css(formGroup.cssStyle)
                if (angular.isString(formGroup.cssClass)) formGroupDom.addClass(formGroup.cssClass)

                if (formGroup.preBorder) { parentDom.append('<md-divider>') }
                parentDom.append(wrapperDom);

                if (angular.isString(formGroup.label)) {
                    let labelDom = angular.element('<div>').addClass('tmv-form-group-label md-body-2')
                        .attr('tmv-color', 'accent').addClass('ellipsis')
                        .append(angular.element('<span>')
                            .attr('translate', _this.translatePrefix + formGroup.label))
                    formGroupDom.before(labelDom);
                    if (formGroup.labelDivider == true) {
                        labelDom.after(angular.element('<md-divider>'));
                    }
                }

                // traverse the items inside the form group
                _this._handleOperation(formGroupDom, formGroup, formCtrl);
                if (formGroup.postBorder) {
                    formGroupDom.append('<md-divider>')
                }
            })

        };

        tmvForm._handleTemplate = function(parentDom, template, formCtrl) { // eslint-disable-line
            if (angular.isString(template)) template = [ template ];    // convert to array
            if (!angular.isArray(template)) return; // accepts only array
            angular.forEach(template, function(value, key) { // eslint-disable-line
                if (angular.isString(value)) {
                    let templateStr = value;
                    if (templateStr.indexOf('url:') === 0) {
                        // it's a template URL, must be preloaded into templateCache
                        templateStr = $templateCache.get(value.substr(4).trim());
                    }
                    parentDom.append(templateStr);
                }
            })
        };

        tmvForm._handleTable = function(parentDom, schema, formCtrl) { // eslint-disable-line
            // TODO:
        };

        tmvForm._handleFormTabs = function(parentDom, formTabs, formCtrl) {
            if (angular.isArray(formTabs)) formTabs = { contents: formTabs } ;
            if (!angular.isObject(formTabs)) return;        // nothing to render
            let _this = this; // eslint-disable-line
            let numTabs = formTabs.length; // eslint-disable-line
            let defaultTabOptions = {
                'md-border-bottom': 'true',
                'md-swipe-content': 'false',
                'md-dynamic-height': 'true'
            };
            let tabOptions = angular.extend({}, defaultTabOptions, formTabs.options || {} );
            let tabContainer = angular.element('<md-tabs>').addClass('tmv-tabs-container');
            angular.forEach(tabOptions, function(value, key) { tabContainer.attr(key, value); });
            parentDom.append(tabContainer);

            let formTabContents = formTabs.contents;
            angular.forEach(formTabContents, function(formTab, idx) { // eslint-disable-line
                let tabDom = angular.element('<md-tab>');
                tabContainer.append(tabDom);
                if (formTab.disable) tabDom.attr('ng-disabled', formTab.disable);

                // setup the tab label
                let labelDom = angular.element('<md-tab-label>');
                tabDom.append(labelDom);
                if (formTab.icon) {
                    labelDom.append(angular.element('<md-icon>')
                        .attr('md-font-icon', formTab.icon));
                }
                if (formTab.label) {
                    let labelId = tmvForm.translatePrefix + formTab.label;
                    labelDom.append(angular.element('<span>')
                        .attr('translate', labelId));
                }


                let tabBodyDom = angular.element('<md-tab-body>');
                tabDom.append(tabBodyDom);

                // traverse the reset
                tmvForm._handleOperation(tabBodyDom, formTab, formCtrl);
            })
        };

        tmvForm._handleFields = function(parentDom, fieldSchemas, formCtrl) {
            let _this = this;
            if (!angular.isArray(fieldSchemas)) {
                if (angular.isObject(fieldSchemas)) {
                    fieldSchemas = [ fieldSchemas ];    // convert to array
                } else {
                    return
                }
            }
            angular.forEach(fieldSchemas, function(fieldSchema, idx) { // eslint-disable-line
                if (angular.isObject(fieldSchema.formGroups)) {
                    // it's a form group
                    _this._handleFormGroups(parentDom, fieldSchema.formGroups, formCtrl)
                } else if (angular.isArray(fieldSchema.fields)) {
                    // fields within a field
                    _this._handleFields(parentDom, fieldSchema.fields, formCtrl);
                } else {
                    if (!_this.mappedFields.hasOwnProperty(fieldSchema.fieldName)) {
                        _this.mappedFields[fieldSchema.fieldName] = fieldSchema;
                    } else {
                        angular.extend(_this.mappedFields[fieldSchema.fieldName], fieldSchema);
                    }

                    // prepare the dom for the field
                    let fieldDom = angular.element('<tmv-input>')
                        .attr('schema', _this.formKey + "['" + fieldSchema.fieldName + "']")
                        .attr('form-model', _this.formModelName)
                        .attr('translate-prefix', _this.translatePrefix)

                    if ($attrs.readOnly) {
                        fieldDom.attr('read-only', $attrs.readOnly)
                    }

                    parentDom.append(fieldDom);
                }
            })
        };

        // prepares the schema data for used in the form layout
        tmvForm._prepareSchemaData = function() {
            let _this = this;
            let formSchema = this.formSchema;

            if (angular.isArray(formSchema.fields)) {
                // there's a master schema for fields
                angular.forEach(formSchema.fields, function(fieldSchema) {
                    if (fieldSchema.fieldName) {
                        fieldSchema.$$type = 'field';
                        _this.mappedFields[fieldSchema.fieldName] = fieldSchema;
                    }
                })
            }

            if (angular.isArray(formSchema.relationships)) {
                angular.forEach(formSchema.relationships, function(fieldSchema) {
                    if (fieldSchema.relationshipName) {
                        fieldSchema.$$type = 'relation';
                        fieldSchema.fieldName = _s.camelize(fieldSchema.relationshipName, true);

                        if (fieldSchema.relationshipType === 'many-to-one') {
                            fieldSchema.fieldInputType = 'select2';
                            if (angular.isDefined(fieldSchema.valuesFromAPI)) {
                                fieldSchema.fieldOptions = 'api:' + fieldSchema.valuesFromAPI;
                            }
                            if (angular.isDefined(fieldSchema.fieldOptions)) {
                                fieldSchema.fieldOptions = 'service:' + _s.capitalize(fieldSchema.otherEntityName);
                            }
                            if (angular.isDefined(fieldSchema.displayExpression)) {
                                fieldSchema.fieldOptionsLabel = 'expr:' + fieldSchema.displayExpression;
                            }
                            if (angular.isUndefined(fieldSchema.fieldOptionsLabel)) {
                                if (angular.isUndefined(fieldSchema.otherEntityField)) {
                                    fieldSchema.otherEntityField = 'id';
                                }
                                fieldSchema.fieldOptionsLabel = fieldSchema.otherEntityField;
                            }
                        }

                        _this.mappedFields[fieldSchema.fieldName] = fieldSchema;
                    }
                })
            }

            return _this.mappedFields;
        };

        // for no layout handling
        tmvForm.__isVisibleInDetail = function __isVisibleInDetail(fieldSchema) {
            if (angular.isUndefined(fieldSchema)) return false;
            if (angular.isDefined(fieldSchema.relationshipName)) {
                // this is a relationship
                if (fieldSchema.relationshipType != 'many-to-one' || fieldSchema.isUserFilter == true) {
                    return false;
                }
            } else {
                if (fieldSchema.fieldType == 'CustomField') {
                    // by default custom fiels are not visible in the form
                    // need formLayout to maintain custom fields
                    return false;
                }
            }
            return true;
        };

        // no layout handling
        tmvForm._noLayoutHandling = function(parentDom, formSchema, formCtrl) {
            let _this = this;
            // prepare form groups for the fields
            let formGroups = [];

            // for fields
            angular.forEach(formSchema.fields, function(field, index) { // eslint-disable-line
                if (_this.__isVisibleInDetail(field)) {
                    formGroups.push({
                        fields: [field]
                    })
                }
            });

            // for relationships
            angular.forEach(formSchema.relationships, function(field, index) { // eslint-disable-line
                if (_this.__isVisibleInDetail(field)) {
                    formGroups.push({
                        fields: [field]
                    })
                }
            });

            _this._handleFormGroups(parentDom, formGroups, formCtrl);
        }
    }

    function _linkFn($scope, $element, $attrs, $ctrls, $transclude) {
        let formCtrl = $ctrls[0],
            tmvForm = $ctrls[1];

        $scope.$$inTmvForm = true

        tmvForm._prepareSchemaData();

        let mainFormDom = angular.element('<div>')
            .addClass('tmv-form-layout-container')

        if (angular.isObject(tmvForm.formSchema.formLayout)) {
            tmvForm._handleFormLayout(mainFormDom, tmvForm.formSchema.formLayout, formCtrl);
        } else {
            tmvForm._noLayoutHandling(mainFormDom, tmvForm.formSchema, formCtrl);
        }

        $transclude(function(clone, scope, param) { // eslint-disable-line
            $tmvUtils.copyElemAttrs($attrs, mainFormDom)
            $element.replaceWith(mainFormDom)

            $compile(mainFormDom)(scope);
        })
    }
})
