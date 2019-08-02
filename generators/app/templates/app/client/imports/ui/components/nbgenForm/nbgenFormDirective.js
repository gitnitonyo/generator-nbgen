/**
 * Directive for handling for based on the passed schema
 * Directive is used instead of Component so in prototypically inherit the parent score
 */
import angular from 'angular';
import _ from 'underscore';

import moduleName from './nbgenForm.js';
import { TmvFormUtils } from './nbgenFormUtils.js';

const directiveName = 'tmvForm';
const controllerAs = `$${directiveName}`;

// temporary template while dom is being processed for the form
import { WAITING_TEMPLATE as tmpTemplate } from './nbgenFormUtils.js';

const _defaultTabOptions = {
    'md-border-bottom': 'true',
    'md-swipe-content': 'false',
    'md-dynamic-height': 'false',
    'md-enable-disconnect': 'true',
};

class TmvFormController {
    constructor($scope, $element, $attrs, $compile, $parse, $templateCache, $q, $mdStepper, $timeout, $mdMedia) {   // eslint-disable-line
        'ngInject';

        TmvFormUtils.__injectNgServices(this, arguments);
    }

    $postLink() {
        // let's capture the formSchema here
        // retrieve the parameters passed as attributes
        this.formSchema = this.$parse(this.$attrs.formSchema)(this.$scope.$parent);
        if (!this.formSchema) throw "Form schema cannot be empty";
        this.formModelName = this.$attrs.formModel;

        this.translatePrefix = this.formSchema.translatePrefix || this.$attrs.translatePrefix || '';
        if (this.translatePrefix.length > 0 && !/\.$/.test(this.translatePrefix)) {
            this.translatePrefix += '.';    // append a dot if not present yet
        }

        this._fieldSchemas = { };       // to expose field schemas to the tmv-input

        // binding for the form model
        this.$scope.$watch(this.formModelName, value => this.formModel = value);

        // perfrom dom manipulation in async
                // this._bindLocalsAndFunctions();
        let mainFormDom = this._prepareSchema();
        mainFormDom.attr('ng-readonly', `${controllerAs}._isReadOnly()`);

        this.$compile(mainFormDom)(this.$scope, (cloneElem) => {
            this.$element.replaceWith(cloneElem);
        });
        this.$timeout(() => this.__isReady = true)
    }

    getStepper(id) {
        if (this.__steppers) return this.__steppers[id];
    }

    $doCheck() {
        if (this.__isReady && this.__steppers) {
            // retrieve stepper controller if not set yet
            _.each(this.__steppers, (v, k) => {
                if (!this.__steppers[k]) {
                    this.__steppers[k] = this.$mdStepper(k);
                }
            })
        }

        if (this.__steppers) {
            if (this.$mdMedia('xs')) {
                this.__stepperXs = true;
                this.__stepperSm = false;
            } else if (this.$mdMedia('sm')) {
                this.__stepperXs = false;
                this.__stepperSm = true;
            } else {
                this.__stepperXs = false;
                this.__stepperSm = false;
            }
        }
    }

    _isReadOnly() {
        return this.$parse(this.$attrs.readOnly)(this.$scope.$parent);
    }

    /**
     * This is the entry point function for processing
     */
    _handleFormLayout(layoutDom, formLayout) {
        if (!_.isObject(formLayout)) return;    // formLayout must be an object

        // check if formLayout only contains fields; then enclose in a form-group
        if (!formLayout.formGroups && !formLayout.template && !formLayout.formTabs && formLayout.fields) {
            // transfer all attributes of formLayout to formGroups
            const formGroups = [
                formLayout,
            ];
            formLayout = { formGroups };
        }

        TmvFormUtils.__domProperties(layoutDom, formLayout);
        let layoutKeys = _.keys(formLayout);
        if (layoutKeys[0] === 'formTabs') {
            layoutDom.addClass('tmv-has-tabs');
        } else if (layoutKeys[0] === 'formSteps') {
            layoutDom.addClass('tmv-has-steppers');
        }

        this._handleOperation(layoutDom, formLayout);
    }

    // traverse the form layout and executes appropriate handler
    _handleOperation(parentDom, schema) {
        let operationMap = {
            formGroups: this._handleFormGroups,
            template: this._handleTemplate,
            table: this._handleTable,
            formTabs: this._handleFormTabs,
            fields: this._handleFields,
            formSteps: this._handleSteppers,
        };

        _.each(schema, (subSchema, propName) => {
            let fn = _.find(operationMap, (operation, key) => {
                let re = new RegExp('^' + key);
                return re.test(propName);
            });

            if (_.isFunction(fn)) {
                fn.call(this, parentDom, subSchema);
            }
        })
    }

    __setPages(dom, pages) {
        if (!this.__pages) this.__pages = { };
        let pagesId = _.uniqueId('__pages')
        this.__pages[pagesId] = pages;
        dom.attr('tmv-pages', `${controllerAs}.__pages.${pagesId}`);
        return pagesId;
    }

    __setPage(dom, page) {
        if (!this.__page) this.__page = { };
        let pageId = _.uniqueId('__page');
        this.__page[pageId] = page;
        dom.attr('tmv-page', `${controllerAs}.__page.${pageId}`);
        return pageId;
    }

    // handle form groups
    _handleFormGroups(parentDom, formGroups) {
        if (!_.isArray(formGroups)) {
            // convert to array if only object
            if (_.isObject(formGroups)) {
                formGroups = [formGroups];
            } else {
                return;
            }
        }

        _.each(formGroups, (formGroup) => {

            // build the form group dom
            let formGroupDom = angular.element('<div>')
                    .addClass('row tmv-form-group tmv-field-set');
            // if (!formGroup.gridClass) formGroup.gridClass = "col-xs-12";        // default grid class
            if (formGroup.gridClass && !/col\-xs/.test(formGroup.gridClass)) {
                formGroup.gridClass += ' col-xs-12';
            }

            let wrapperDom = formGroupDom;
            wrapperDom = angular.element('<div>').addClass(formGroup.gridClass).addClass('tmv-form-group-outer tmv-fold-animation')
                .append(formGroupDom);
            TmvFormUtils.__domVisibilityProperties(wrapperDom, formGroup)
            TmvFormUtils.__putAttrs(wrapperDom, formGroup.gridAttrs);
            TmvFormUtils.__domProperties(formGroupDom, formGroup);
            TmvFormUtils.__flexProperties(wrapperDom, formGroup);
            TmvFormUtils.__layoutProperties(formGroupDom, formGroup);
            if (_.isObject(formGroup.pages)) {
                this.__setPages(wrapperDom, formGroup.pages);
            }

            if (_.isObject(formGroup.page)) {
                this.__setPage(wrapperDom, formGroup.page);
            }

            if (formGroup.preBorder) { wrapperDom.prepend('<md-divider class="tmv-preborder">') }
            parentDom.append(wrapperDom);

            if (_.isString(formGroup.label)) {
                let label = formGroup.label;
                if (formGroup.label.startsWith('tx:')) {
                    label = label.substr(3);
                } else {
                    label = `${this.translatePrefix}${label}`;
                }
                let labelDom = angular.element('<div>').addClass('tmv-form-group-label md-body-2')
                    .attr('tmv-color', 'primary')
                    .append(angular.element('<span>')
                        .attr('translate', label))
                formGroupDom.before(labelDom);
                if (formGroup.hint) {
                    let hintDom = angular.element('<nbgen-hint>')
                            .attr('value', `${this.translatePrefix}${formGroup.hint}`);
                    if (formGroup.hintLabel !== undefined) {
                        hintDom.attr('hint-label', `${this.translatePrefix}${formGroup.hintLabel}`)
                    }
                    labelDom.append(hintDom);
                }
                if (formGroup.labelDivider == true) {
                    labelDom.after(angular.element('<md-divider>'));
                }
            }

            // traverse the items inside the form group
            this._handleOperation(formGroupDom, formGroup);
            if (formGroup.postBorder) {
                formGroupDom.after('<md-divider class="post-border">')
            }
        })
    }

    // handle template
    _handleTemplate(parentDom, template) {
        if (_.isString(template)) template = [ template ];    // convert to array
        if (!_.isArray(template)) return; // accepts only array
        _.forEach(template, (value, key) => { // eslint-disable-line
            if (_.isString(value)) {
                let templateStr = value;
                if (templateStr.indexOf('url:') === 0) {
                    // it's a template URL, must be preloaded into templateCache
                    templateStr = this.$templateCache.get(value.substr(4).trim());
                }
                parentDom.append(templateStr);
            }
        })
    }

    _handleTable(parentDom, tableSchema) {  // eslint-disable-line
        // TODO:
    }

    _handleFormTabs(parentDom, formTabs) {
        if (_.isArray(formTabs)) formTabs = { contents: formTabs } ;
        if (!_.isObject(formTabs)) return;        // nothing to render

        let numTabs = formTabs.length; // eslint-disable-line
        let defaultTabOptions = _defaultTabOptions;

        let tabOptions = _.extend({}, defaultTabOptions, formTabs.options || {} );
        let tabContainer = angular.element('<md-tabs>').addClass('tmv-tabs-container').attr('ng-cloak', '');
        if (formTabs.options.stretchVertically === true) {
            tabContainer.addClass('tmv-tabs-stretch');
            tabOptions['md-dynamic-height'] = 'false';  // for dynamic height to be false
        }
        _.each(tabOptions, (value, key) => { tabContainer.attr(key, value); });
        parentDom.append(tabContainer);

        let formTabContents = formTabs.contents;
        _.each(formTabContents, (formTab, idx) => { // eslint-disable-line
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
                let labelId = this.translatePrefix + formTab.label;
                labelDom.append(angular.element('<span>')
                    .attr('translate', labelId));
            }

            let tabBodyDom = angular.element('<md-tab-body>');
            // put up a placeholder where we can put temporary viewer like image viewer
            if (formTab.tabId) {
                // it will cover the whole tab, but initially hidden
                tabBodyDom.append(angular.element('<md-content>')
                    .attr('id', `${formTab.tabId}`).css({
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        bottom: '0',
                        right: '0',
                        'z-index': '1',
                    })
                    .addClass('ng-hide'));
            }

            let tabBodyContent = angular.element('<div>').addClass('tmv-tabs-content');
            tabBodyDom.append(tabBodyContent);
            tabDom.append(tabBodyDom);

            // traverse the reset
            this._handleOperation(tabBodyContent, formTab);
        })
    }

    _handleSteppers(parentDom, steppers) {
        // construct the main dom
        const stepperId = steppers.id || _.uniqueId('mdStepper_');
        this.__steppers = this.__steppers || { };
        this.__steppers[stepperId] = null;

        const dom = angular.element('<md-stepper>').attr('id', stepperId);
        parentDom.append(dom);
        const domProperties = ['mobileStepText', 'vertical', 'linear', 'alternative'];
        TmvFormUtils.__putProperties(dom, steppers, domProperties, 'md-');
        if (steppers.mobileStepText === undefined) {
            dom.attr('md-vertical', `${controllerAs}.__stepperXs`);
        }
        if (steppers.alternative === undefined) {
            dom.attr('md-alternative', `${controllerAs}.__stepperSm`);
        }
        if (_.isArray(steppers.contents)) {
            _.each(steppers.contents, (content) => {
                const domStep = angular.element('<md-step>');
                TmvFormUtils.__domVisibilityProperties(domStep, content.conditions || { });
                dom.append(domStep);
                TmvFormUtils.__domProperties(domStep, content);
                if (_.isString(content.label)) {
                    domStep.attr('md-label', `{{'${this.translatePrefix}${content.label}' | translate}}`)
                }

                // construct the body
                const domStepBody = angular.element('<md-step-body>');
                const domStepBodyContainer = angular.element('<div>').addClass('tmv-stepper-body-container');
                domStepBody.append(domStepBodyContainer);
                TmvFormUtils.__domVisibilityProperties(domStepBodyContainer, content);
                domStep.append(domStepBody);
                if (_.isObject(content.body)) {
                    this._handleOperation(domStepBodyContainer, content.body);
                } else if (_.isString(content.body)) {
                    domStepBodyContainer.attr('nbgen-template', content.body);
                }

                // construct actions
                const domStepActions = angular.element('<md-step-actions>');
                TmvFormUtils.__domVisibilityProperties(domStepActions, content);
                domStep.append(domStepActions);
                if (_.isArray(content.actions)) {
                    let actionsDom = angular.element('<div>').addClass('tmv-stepper-actions-container')
                        .attr('layout', 'row').attr('layout-align', 'end center');
                    domStepActions.append(actionsDom);
                    _.each(content.actions, btn => {
                        let btnDom = angular.element('<md-button>');
                        actionsDom.append(btnDom);
                        TmvFormUtils.__domProperties(btnDom, btn);
                        TmvFormUtils.__domVisibilityProperties(btnDom, btn);
                        let label = `tx:${this.translatePrefix}${btn.btnLabel || btn.label}`
                        btnDom.attr('tmv-label', label);
                        let icon = btn.btnIcon || btn.icon;
                        if (icon) btnDom.attr('tmv-icon', icon);
                        let onClick = btn.btnClick || btn.onClick;
                        if (onClick) btnDom.attr('ng-click', onClick);
                    })
                } else if (_.isString(content.actions)) {
                    domStepActions.attr('nbgen-template', content.actions);
                }
            });
        }
    }


    _handleFields(parentDom, fieldSchemas) {
        if (!_.isArray(fieldSchemas)) {
            if (_.isObject(fieldSchemas)) {
                fieldSchemas = [ fieldSchemas ];    // convert to array
            } else {
                return;
            }
        }

        // apply filler first
        _.forEach(fieldSchemas, (fieldSchema, idx) => { // eslint-disable-line
            if (_.isObject(fieldSchema.formGroups)) {
                // it's a form group
                this._handleFormGroups(parentDom, fieldSchema.formGroups)
            } else if (_.isArray(fieldSchema.fields)) {
                // fields within a field
                this._handleFields(parentDom, fieldSchema.fields);
            } else {
                const scopeVar = _.uniqueId('_fieldName_');
                if (!fieldSchema.fieldName) {
                    fieldSchema.fieldName = scopeVar;
                }
                this._fieldSchemas[scopeVar] = fieldSchema;     // expose fieldSchema to tmv-input

                // prepare the dom for the field
                let fieldDom = angular.element('<tmv-input>')
                    .attr('schema', `${controllerAs}._fieldSchemas.${scopeVar}`)
                    .attr('form-model', this.formModelName)
                    .attr('translate-prefix', this.translatePrefix)

                if (this.$attrs.readOnly) {
                    fieldDom.attr('read-only', this.$attrs.readOnly)
                }

                parentDom.append(fieldDom);
            }
        })
    }

    _prepareSchema() {
        let mainFormDom = angular.element('<div>')
            .addClass('tmv-form-layout-container row ng-cloak')
            // set ng-model-options
            .attr('ng-model-options', "{allowInvalid: true, debounce: 0}")

        this._handleFormLayout(mainFormDom, this.formSchema.formLayout);

        return mainFormDom;
    }

    // find the functions and locas specified in the form schema
    _bindLocalsAndFunctions() {
        if (_.isObject(this.formSchema.locals)) {
            _.each(this.formSchema.locals, (v, k) => {
                this[k] = v;
            })
        }
        if (_.isObject(this.formSchema.functions)) {
            _.each(this.formSchema.functions, (v, k) => {
                if (_.isFunction(v)) {
                    this[k] = v.bind(this);
                }
            })
        }
    }
}

angular.module(moduleName)
    .directive(directiveName, () => {
        'ngInject';

        return {
            restrict: 'E',
            require: '^form',
            controller: TmvFormController,
            controllerAs: controllerAs,
            template: tmpTemplate,
            scope: true,
        }
    })
