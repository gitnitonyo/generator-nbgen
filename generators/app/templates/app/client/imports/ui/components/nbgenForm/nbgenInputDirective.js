/**
 * Directive for input used in forms as described in the specified field schema
 */
import angular from 'angular';
import _ from 'underscore';
import _s from 'underscore.string';
import moment from 'moment';
import moduleName from './nbgenForm.js';
import { TmvFormUtils } from './nbgenFormUtils.js';

import nbgenPasswordShowTemplate from './nbgenPasswordShow.html';

const directiveName = 'tmvInput';
const controllerAs = `$${directiveName}`;


const _dateFormats = {
    DEFAULT_DATE_FORMAT: moment.localeData().longDateFormat('L'),
    DEFAULT_TIME_FORMAT: moment.localeData().longDateFormat('LT'),
    DEFAULT_DATE_TIME_FORMAT: moment.localeData().longDateFormat('lll')
}

const _inputSettings = {
    RED_INDICATOR: false,
}

class TmvInputController {
    constructor($scope, $element, $attrs, $parse, $compile, $q, $translate, $timeout, $interpolate) {
        'ngInject';

        this.$scope = $scope;
        this.$element = $element;
        this.$attrs = $attrs;
        this.$parse = $parse;
        this.$compile = $compile;
        this.$q = $q;
        this.$translate = $translate;
        this.$timeout = $timeout;
        this.$interpolate = $interpolate;
    }

    $onInit() {

    }

    $postLink() {
        // initialize data
        this._initialize();

        // let's do this asynchronously
        this._setDefaultValue();
        const dom = this._constructInputDom();

        // make invalid fields read
        if (_inputSettings.RED_INDICATOR === true) {
            const mdInputContainer = dom.find('md-input-container');
            if (mdInputContainer.length > 0) {
                let errorExpression = `${controllerAs}.modelCtrl.$invalid`;
                mdInputContainer.attr('md-is-error', errorExpression);
            }
        }

        this.$compile(dom)(this.$scope, (cloneElem) => {
            this.$element.replaceWith(cloneElem);
        });

        this.$timeout(() => {
            this.modelCtrl = this.formCtrl[this.$fieldName];
        });
    }

    _constructInputDom() {
        if (this.fieldSchema.template !== undefined) {
            return this._constructTemplateDom();
        }
        let fieldInputType = this.fieldSchema.fieldInputType = (_.isString(this.fieldSchema.fieldInputType) && this.fieldSchema.fieldInputType.toLowerCase()) || 'text';
        fieldInputType = _s.capitalize(fieldInputType);
        let domConstructionFn = `_construct${fieldInputType}Dom`;
        if (!_.isFunction(this[domConstructionFn])) {
            domConstructionFn = '_constructTextDom';    // default dom construction function
        }
        domConstructionFn = this[domConstructionFn];

        return domConstructionFn.call(this);
    }

    // common functions for constucting dom

    // for creating container for the input elements
    __createFieldContainer(clz) {
        const fieldSchema = this.fieldSchema;
        const tmvFieldType = `tmv-field-${fieldSchema.fieldInputType || 'text'}`;
        const fieldContainerDom = angular.element(`<${tmvFieldType}>`).addClass(`tmv-field-${fieldSchema.fieldInputType || 'text'}`);
        clz = clz || 'tmv-field-container';
        fieldContainerDom.addClass(clz);
        fieldContainerDom.addClass('tmv-fold-animation');       // for animating ng-if
        this.__domVisibilityProperties(fieldContainerDom, fieldSchema);
        TmvFormUtils.__putClass(fieldContainerDom, fieldSchema.cssClass);
        TmvFormUtils.__putStyle(fieldContainerDom, fieldSchema.cssStyle);
        TmvFormUtils.__putGrid(fieldContainerDom, fieldSchema.gridClass);
        this.__putAttrs(fieldContainerDom, fieldSchema.gridAttrs);
        TmvFormUtils.__layoutProperties(fieldContainerDom, fieldSchema);
        TmvFormUtils.__flexProperties(fieldContainerDom, fieldSchema);

        // check if we need to add class for xtra small screen
        const classNames = fieldContainerDom[0].className.split(' ');
        const xsClass = _.find(classNames, (className) => className.indexOf('col-xs') === 0);
        if (!xsClass) {
            // make width to 100% when small screen
            fieldContainerDom.addClass('col-xs-12');
        }

        return fieldContainerDom;
    }

    __createInputContainer(parentDom, extraClass, noLabel) {
        const fieldSchema = this.fieldSchema;
        const inputContainer = angular.element('<md-input-container>')
            .addClass('tmv-field-input-container')
            .attr('md-no-float', '');
        extraClass = extraClass || fieldSchema.inputContainerClass;
        if (extraClass) inputContainer.addClass(extraClass);
        if (fieldSchema.inputInline !== true) {
            inputContainer.addClass('md-block');
        }

        let labelDom = angular.element('<label>');
        inputContainer.append(labelDom);
        TmvFormUtils.__putClass(labelDom, fieldSchema.labelClass);
        TmvFormUtils.__putClass(labelDom, fieldSchema.labelStyle);
        if (noLabel !== true && fieldSchema.fieldLabelDisable !== true) {
            if (fieldSchema.fieldLabelLiteral) {
                labelDom.append(fieldSchema.fieldLabelLiteral);
            } else if (fieldSchema.fieldLabelFull) {
                labelDom.append(`<span translate="${fieldSchema.fieldLabelFull}"></span>`)
            } else if (fieldSchema.fieldLabel) {
                const label = this.$translate.instant(`${this.translatePrefix}${fieldSchema.fieldLabel}`);
                if (label) {
                    labelDom.append(label)
                } else {
                    labelDom.addClass('tmv-no-label');
                }
            }
        } else {
            fieldSchema.fieldLabelDisable = true;
            labelDom.addClass('tmv-no-label');
        }

        // check if there's a left icon specified
        if (!fieldSchema.leftIcon) {
            if (fieldSchema.fieldInputType === 'date') {
                fieldSchema.leftIcon = 'mdi-calendar mdi';
            } else if (fieldSchema.fieldInputType === 'time') {
                fieldSchema.leftIcon = 'mdi-clock mdi';
            } else if (fieldSchema.fieldInputType === 'datetime') {
                fieldSchema.leftIcon = 'mdi-calendar-clock mdi';
            }
        }

        if (_.isString(fieldSchema.leftIcon)) {
            inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.leftIcon));
            if (fieldSchema.fieldInputType === 'static') {
                inputContainer.addClass('md-icon-left');
            }
        }

        if (parentDom) parentDom.append(inputContainer);

        return inputContainer;
    }

    __readOnlyStr() {
        let fieldSchema = this.fieldSchema;
        let readOnlyStr;
        if (fieldSchema.readOnlyOverride !== undefined) {
            readOnlyStr = `${fieldSchema.readOnlyOverride}`;
        } else {
            let readOnlyExprs = [ ];
            if (this.$attrs.readOnly) {
                readOnlyExprs.push(`(${this.$attrs.readOnly})`);
            }
            if (fieldSchema.fieldReadOnly) {
                const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldReadOnly');
                readOnlyExprs.push(`(${attrValue})`);
            }
            if (fieldSchema.readOnly) {
                const attrValue = this.__generateAttrValue(fieldSchema, true, 'readOnly');
                readOnlyExprs.push(`(${attrValue})`);
            }
            readOnlyStr = readOnlyExprs.join(' || ');
        }

        return readOnlyStr;
    }

    __putAttrs(domObj, attrs) {
        if (_.isObject(attrs)) {
            _.each(attrs, (v, k) => {
                domObj.attr(k, this.__generateAttrValue(attrs, true, k));
            });
        }
    }

    __domVisibilityProperties(domObj, schema) {
        this.__setAttribute(domObj, schema, 'ngIf');
        this.__setAttribute(domObj, schema, 'ngShow');
        this.__setAttribute(domObj, schema, 'ngHide');
    }

    __generateAttrValue(sourceObj, invoked=true, objKey) {
        let sourceValue = sourceObj[objKey];
        if (sourceValue !== undefined) {
            let attrValue;
            if (_.isString(sourceValue)) {
                attrValue = sourceValue;
            } else if (_.isObject(sourceValue) || _.isFunction(sourceValue)) {
                // store the object on the controller
                let ctrlKey = _.uniqueId('$__var');
                this[ctrlKey] = sourceValue;
                if (_.isFunction(sourceValue) && invoked) {
                    if (invoked === 'interpolate') {
                        attrValue = `{{${controllerAs}.__invokeFunction(${controllerAs}.${ctrlKey}, $event)}}`;    
                    } else {
                        attrValue = `${controllerAs}.__invokeFunction(${controllerAs}.${ctrlKey}, $event)`;
                    }
                } else {
                    attrValue = `${controllerAs}.${ctrlKey}`;
                }
            } else {
                attrValue = sourceValue.toString();
            }
            return attrValue;
        }
    }

    __invokeFunction(func, $event) {
        const context = this.$scope.$tmvCollection || this;
        return func.call(context, context.$currentItem || {}, $event);
    }

    __setAttribute(dom, sourceObj, attrName, invoked=true, objKey) {
        if (objKey === undefined) objKey = attrName;
        let attrDashed = _s.dasherize(attrName);
        let attrValue = this.__generateAttrValue(sourceObj, invoked, objKey);
        if (attrValue) {
            dom.attr(attrDashed, attrValue);
        }
    }

    __putReadOnly(elemDom, attrName) {
        let readOnlyStr = this.__readOnlyStr();

        if (readOnlyStr.length > 0) {
            let _attrName = attrName || 'read-only';
            elemDom.attr(_attrName, readOnlyStr);
        }
    }

    __putDisabled(elemDom) {
        let disabledFn = this.$attrs.readOnly || '';
        if (angular.isDefined(this.fieldSchema.fieldDisable)) {
            if (disabledFn.length > 0) {
                disabledFn += ' || '
            }
            disabledFn += this.fieldSchema.fieldDisable;
        }
        if (disabledFn.length > 0) {
            elemDom.attr('ng-disabled', disabledFn);
        }
    }

    __putHint(elemDom) {
        let fieldSchema = this.fieldSchema;
        if (fieldSchema.infoText !== undefined) {
            elemDom.attr('info-text', `${this.translatePrefix}${fieldSchema.infoText}`);
        } else if (fieldSchema.hint !== undefined) {
            elemDom.attr('hint', `${this.translatePrefix}${fieldSchema.hint}`);
            if (fieldSchema.hintLabel) {
                elemDom.attr('hint-label', `${this.translatePrefix}${fieldSchema.hintLabel}`);
            }
        }
    }

    __customValidation() {
        let validationFn = this.fieldSchema.fieldValidateRulesCustom && this.fieldSchema.fieldValidateRulesCustom.validationFn;
        if (validationFn) {
            let result = this.$parse(validationFn)(this.$scope.$parent);
            let errorId = this.fieldSchema.fieldValidateRulesCustom && this.fieldSchema.fieldValidateRulesCustom.errorId;
            this.modelCtrl.$setValidity(errorId, result);
        }
    }

    __getErrors(ignoredErrors) {
        let modelCtrl = this.modelCtrl;
        if (modelCtrl) {
            let result = { };

            if (ignoredErrors) {
                ignoredErrors = ignoredErrors.split(',')
            } else {
                ignoredErrors = [ ];
            }
            _.each(modelCtrl.$error, (v, k) => {
                if (ignoredErrors.indexOf(k) < 0 || this.__hasInfoText !== true) {
                    result[k] = v;
                }
            });

            if (this.__hasInfoText) {
                result.infotext = true;
            }

            return result;
        }
    }

    __addInfoText(inputContainer) {
        const fieldSchema = this.fieldSchema;
        let ngMessagesDom = inputContainer.find('[ng-messages]');
        if (ngMessagesDom.length > 0) {
            if (fieldSchema.infoText !== undefined) {
                ngMessagesDom.append(angular.element('<div>').attr('ng-message', 'infotext')
                    .append(TmvFormUtils.__infoText(`${this.translatePrefix}${fieldSchema.infoText}`)));
                this.__hasInfoText = true;
            } else if (fieldSchema.hint !== undefined) {
                let hintLabel;
                if (fieldSchema.hintLabel) {
                    hintLabel = `${this.translatePrefix}${fieldSchema.hintLabel}`;
                }
                ngMessagesDom.append(angular.element('<div>').attr('ng-message', 'infotext')
                    .append(TmvFormUtils.__hintText(`${this.translatePrefix}${fieldSchema.hint}`, hintLabel)));
                this.__hasInfoText = true;
            } else {
                this.__hasInfoText = false;
            }
        }
    }

    // adds validation attributes to the specified element; applicable only for input dom
    __addValidation(element, mesgClass) {
        const inputElement = element;
        const fieldSchema = this.fieldSchema;
        const translatePrefix = this.translatePrefix;
        const $translate = this.$translate;
        //const mdInputContainer = element.closest('md-input-container');
        let ignoredErrors = '';
        //if (!mdInputContainer.hasClass('md-no-asterisk')) {
        //   ignoredErrors = 'required';
        //}

        const ngMessages = angular.element('<div>')
            .attr('ng-messages', `${controllerAs}.__getErrors('${ignoredErrors}')`)
            // .attr('md-auto-hide', 'false')
            .attr('role', 'alert');
        if (mesgClass) ngMessages.addClass(mesgClass);

        let hasAttachedMessage = false,     // eslint-disable-line
            constraintValue, errorMessage

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            inputElement.attr('ng-required', attrValue);
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'required').append(angular.element('<span>')
                    .attr('translate', 'form.validation.required')))
            hasAttachedMessage = true
        }

        if (fieldSchema.fieldValidateRulesMinlength !== undefined) {
            constraintValue = fieldSchema.fieldValidateRulesMinlength.toString()
            errorMessage = $translate.instant('form.validation.minlength', { min: constraintValue })
            inputElement.attr('ng-minlength', constraintValue);
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'minlength').append(angular.element('<span>')
                    .append(errorMessage)))
            hasAttachedMessage = true
        }

        if (fieldSchema.fieldValidateRulesMaxlength !== undefined) {
            constraintValue = fieldSchema.fieldValidateRulesMaxlength.toString()
            errorMessage = $translate.instant('form.validation.maxlength', { max: constraintValue })
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'maxlength').append(angular.element('<span>')
                    .append(errorMessage)))
            hasAttachedMessage = true
            if (fieldSchema.useMdMaxlength !== false) {
                inputElement.attr('md-maxlength', constraintValue)
            } else {
                inputElement.attr('ng-maxlength', constraintValue)
            }
            inputElement.attr('nbgen-maxlength', constraintValue);      // for preventing input to maxlength
        }

        if (fieldSchema.fieldValidateRulesMin !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesMin');
            errorMessage = `<span translate="form.validation.min" translate-values="{min: '{{${attrValue}}}'}"></span>`;
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'min').append(errorMessage));
            hasAttachedMessage = true
            inputElement.attr('min', `{{${attrValue}}}`);
        }

        if (fieldSchema.fieldValidateRulesMax !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesMax');
            errorMessage = `<span translate="form.validation.max" translate-values="{max: '{{${attrValue}}}'}"></span>`;
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'max').append(errorMessage));
            hasAttachedMessage = true
            inputElement.attr('max', `{{${attrValue}}}`);
        }

        if (fieldSchema.fieldValidateRulesPattern !== undefined) {
            constraintValue = fieldSchema.fieldValidateRulesPattern.toString()
            const patternValidationMessage = fieldSchema.patternValidationMessage || 'form.validation.pattern'
            errorMessage = $translate.instant(patternValidationMessage, { pattern: constraintValue })
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'pattern').append(angular.element('<span>')
                    .append(errorMessage)))
            hasAttachedMessage = true
            inputElement.attr('ng-pattern', constraintValue);
        }

        if (fieldSchema.fieldValidateRulesUnique !== undefined) {
            let validationObj = angular.isString(fieldSchema.fieldValidateRulesUnique) ?
                { collectionName: fieldSchema.fieldValidateRulesUnique } :
                fieldSchema.fieldValidateRulesUnique;
            const collectionName = validationObj.collectionName;

            // register the unique directive and corresponsing error messages
            inputElement.attr('nbgen-unique', collectionName);
            if (validationObj.field) {
                inputElement.attr('field', validationObj.field);
            }
            if (validationObj.exceptions) {
                inputElement.attr('exceptions', validationObj.exceptions);
            }

            if (validationObj.field) inputElement.attr('field', validationObj.field);
            const checkingMessage = validationObj.checkingMesg || 'form.validation.checking';
            const uniqueErrorMessage = validationObj.errorMessage || 'form.validation.unique';
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'unique.doneChecking')
                .append(angular.element('<span>').attr('translate', checkingMessage)));
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'unique')
                .append(angular.element('<span>').attr('translate', uniqueErrorMessage)));
            hasAttachedMessage = true;
        }

        if (fieldSchema.fieldValidateRulesCustom !== undefined) {
            const errorId = fieldSchema.fieldValidateRulesCustom.errorId;
            const ctrlErrorId = translatePrefix + errorId;
            const validationFnStr = fieldSchema.fieldValidateRulesCustom.validationFn;

            // check if there's already an existing ng-change attr for the current input dom
            let ngChangeAttr = inputElement.attr('ng-change');
            if (ngChangeAttr) {
                ngChangeAttr = `${ngChangeAttr} && ${validationFnStr}`;
            } else {
                ngChangeAttr = `${controllerAs}.__customValidation()`;
            }
            // put it as ng-change handler
            inputElement.attr('ng-change', ngChangeAttr);

            // prepare error message for this custom validation
            errorMessage = $translate.instant(ctrlErrorId)
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', errorId).append(angular.element('<span>')
                    .append(errorMessage)))
            hasAttachedMessage = true
        }

        // for custom error messages
        if (fieldSchema.errorMessages !== undefined) {
            if (!angular.isArray(fieldSchema.errorMessages)) {
                fieldSchema.errorMessages = [fieldSchema.errorMessages];
            }
            fieldSchema.errorMessages.forEach((error) => {
                ngMessages.append(angular.element('<div>')
                    .attr('ng-message', error.key).append(angular.element('<span>')
                        .attr('translate', error.message)));
                hasAttachedMessage = true;
            });
        }

        // process type validations
        const fieldInputType = fieldSchema.fieldInputType.toLowerCase();
        if (fieldInputType == 'email') {
            errorMessage = $translate.instant('form.validation.email')
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'email').append(angular.element('<span>')
                    .append(errorMessage)))
            hasAttachedMessage = true
        }
        if (fieldInputType == 'number') {
            errorMessage = $translate.instant('form.validation.number')
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'number').append(angular.element('<span>')
                    .append(errorMessage)))
            hasAttachedMessage = true
        }
        if (fieldInputType == 'datetimelocal' || fieldInputType == 'date' || fieldInputType == 'datetime') {
            errorMessage = $translate.instant('form.validation.local')
            ngMessages.append(angular.element('<div>')
                .attr('ng-message', 'datetimelocal').append(angular.element('<span>')
                    .append(errorMessage)))
            hasAttachedMessage = true
        }

        if (angular.isArray(fieldSchema.fieldCustomValidations)) {
            fieldSchema.fieldCustomValidations.forEach((errorId) => {
                errorMessage = $translate.instant(errorId);
                ngMessages.append(angular.element('<div>')
                    .attr('ng-message', errorId).append(angular.element('<span>')
                        .append(errorMessage)))
            })
            hasAttachedMessage = true;
        }

        if (fieldSchema.noErrorIndicator === true) {
            ngMessages.css({'display': 'none'});
        }
        element.after(ngMessages);

        /**
         * Comment out to make input red at the start
        // add md-is-error in md-input-container if present
        const mdInputContainer = element.closest('md-input-container')
        if (mdInputContainer.length > 0) {
            let errorExpression = formCtrl.$name + '[\'' + fieldSchema.fieldName + '\'].$invalid'
            if (element.attr('ng-readonly')) {
                errorExpression += ` && !(${element.attr('ng-readonly')})`
            }
            if (element.attr('ng-disabled')) {
                errorExpression += ` && !(${element.attr('ng-disabled')})`
            }
            if (fieldSchema.noErrorIndicator === true) {
                mdInputContainer.attr('md-is-error', 'false')
            } else {
                mdInputContainer.attr('md-is-error', errorExpression)
            }
        }
        */
    }

    // special components dom creation helpers

    __createChipsDom(parentDom) {
        const fieldSchema = this.fieldSchema;
        const chipsDom = angular.element('<chip-picker>')
            .attr('ng-model', this.ngModelName)
            .attr('name', this.$fieldName);

        parentDom.append(chipsDom);

        const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
        chipsDom.attr('label', `{{'${label}' | translate}}`)

        if (fieldSchema.fieldLabelDisable === true) {
            chipsDom.attr('no-label', 'true');
        }

        if (fieldSchema.subscription) {
            chipsDom.attr('subscription', fieldSchema.subscription);
        }

        // if listFields is specified instead
        if (!fieldSchema.listLayout) {
            if (fieldSchema.listFields) {
                fieldSchema.listLayout = { fields: fieldSchema.listFields }
            }
        }

        this.__setAttribute(chipsDom, fieldSchema, 'collection');
        this.__setAttribute(chipsDom, fieldSchema, 'listLayout');
        this.__setAttribute(chipsDom, fieldSchema, 'chipTemplate', false);
        this.__setAttribute(chipsDom, fieldSchema, 'single');

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            chipsDom.attr('ng-required', attrValue);
        }

        this.__setAttribute(chipsDom, fieldSchema, 'pickerOptions');

        if (fieldSchema.leftIcon !== undefined) {
            chipsDom.attr('left-icon', fieldSchema.leftIcon);
        }

        if (fieldSchema.rightIcon !== undefined) {
            chipsDom.attr('right-icon', fieldSchema.rightIcon);
        }

        this.__setAttribute(chipsDom, fieldSchema, 'beforeItemRemove');
        this.__setAttribute(chipsDom, fieldSchema, 'afterItemRemove');

        this.__setAttribute(chipsDom, fieldSchema, 'fields');

        this.__putHint(chipsDom);
        this.__putReadOnly(chipsDom);

        if (_inputSettings.RED_INDICATOR === true) {
            chipsDom.attr('always-red', 'true');
        }

        return chipsDom;
    }

    __createTimeDom(parentDom) {
        const fieldSchema = this.fieldSchema;

        const fieldDom = angular.element('<tmv-time-picker>')
            .attr('ng-model', this.ngModelName)
            .attr('name', this.$fieldName);
        parentDom.append(fieldDom);

        if (fieldSchema.fieldLabelDisable !== true) {
            const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
            fieldDom.attr('label', `{{'${label}' | translate}}`)
        }

        fieldDom.attr('translate-prefix', this.translatePrefix)

        this.__setAttribute(fieldDom, fieldSchema, 'minDate');
        this.__setAttribute(fieldDom, fieldSchema, 'maxDate');

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            fieldDom.attr('ng-required', attrValue);
        }

        this.__putHint(fieldDom);
        this.__putReadOnly(fieldDom);

        return fieldDom;
    }

    __createDateDom(parentDom) {
        const fieldSchema = this.fieldSchema;

        const fieldDom = angular.element('<tmv-date-picker>')
            .attr('ng-model', this.ngModelName)
            .attr('name', this.$fieldName);
        parentDom.append(fieldDom);

        if (fieldSchema.fieldLabelDisable !== true) {
            const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
            fieldDom.attr('label', `{{'${label}' | translate}}`)
        }

        fieldDom.attr('translate-prefix', this.translatePrefix)

        this.__setAttribute(fieldDom, fieldSchema, 'minDate');
        this.__setAttribute(fieldDom, fieldSchema, 'maxDate');

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            fieldDom.attr('ng-required', attrValue);
            fieldDom.attr('ng-required', fieldSchema.fieldValidateRulesRequired)
        }

        this.__putHint(fieldDom);
        this.__putReadOnly(fieldDom);

        return fieldDom;
    }

    __createLineitemsDom(parentDom) {
        const fieldSchema = this.fieldSchema;
        const fieldDom = angular.element('<nbgen-line-items>')
            .attr('ng-model', this.ngModelName)
            .attr('name', this.$fieldName);

        parentDom.append(fieldDom);

        if (fieldSchema.fieldLabelDisable !== true) {
            const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
            fieldDom.attr('label', `{{'${label}' | translate}}`)
        }

        fieldDom.attr('translate-prefix', this.translatePrefix)

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            fieldDom.attr('ng-required', attrValue);
        }

        // store line schema to a unique scope variable
        if (fieldSchema.lineSchema !== undefined) {
            const scopeVar = _.uniqueId('_lineItemsSchema_');
            this[scopeVar] = fieldSchema.lineSchema;
            fieldDom.attr('line-schema', `${controllerAs}.${scopeVar}`);
        }

        if (fieldSchema.footer !== undefined) {
            fieldDom.attr('footer', fieldSchema.footer);
            fieldDom.attr('has-footer', 'true');
        }

        if (fieldSchema.onChange !== undefined) {
            fieldDom.attr('on-change', `${controllerAs}.__handleLineItemsChange($item)`);
            this.__handleLineItemsChange = function($item) {
                this.$parse(fieldSchema.onChange)(this.$scope.$parent, {$item: $item});
            }
        }

        if (fieldSchema.noAction !== undefined) {
            fieldDom.attr('no-action', fieldSchema.noAction);
        }

        if (fieldSchema.noItemNo !== undefined) {
            fieldDom.attr('no-item-no', fieldSchema.noItemNo);
        }

        if (fieldSchema.otherData !== undefined) {
            const scopeVar = _.uniqueId('_otherData_');
            this[scopeVar] = fieldSchema.otherData;
            fieldDom.attr('other-data', `${controllerAs}.${scopeVar}`);
        }

        this.__putHint(fieldDom);
        this.__putReadOnly(fieldDom);

        if (_inputSettings.RED_INDICATOR === true) {
            fieldDom.attr('always-red', 'true');
        }

        return fieldDom;
    }

    __createItemsDom(parentDom) {
        const fieldSchema = this.fieldSchema;
        const fieldDom = angular.element('<tmv-line-items>')
            .attr('ng-model', this.ngModelName)
            .attr('name', this.$fieldName);

        parentDom.append(fieldDom);

        // label
        if (fieldSchema.fieldLabelDisable !== true) {
            const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
            fieldDom.attr('label', `{{'${label}' | translate}}`)
        }

        // translation prefix
        fieldDom.attr('translate-prefix', this.translatePrefix)

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            fieldDom.attr('ng-required', attrValue);
        }

        this.__setAttribute(fieldDom, fieldSchema, 'lineSchema');

        this.__setAttribute(fieldDom, fieldSchema, 'formLayout');
        
        this.__setAttribute(fieldDom, fieldSchema, 'formSchema');
        
        this.__setAttribute(fieldDom, fieldSchema, 'actionEvents');

        this.__setAttribute(fieldDom, fieldSchema, 'noAction');

        this.__setAttribute(fieldDom, fieldSchema, 'noItemNo');

        // custom action template
        this.__setAttribute(fieldDom, fieldSchema, 'actionTemplate');

        // events
        this.__setAttribute(fieldDom, fieldSchema, 'beforeAdd');
        this.__setAttribute(fieldDom, fieldSchema, 'afterAdd');
        this.__setAttribute(fieldDom, fieldSchema, 'beforeEdit');
        this.__setAttribute(fieldDom, fieldSchema, 'afterEdit');
        this.__setAttribute(fieldDom, fieldSchema, 'beforeRemove');
        this.__setAttribute(fieldDom, fieldSchema, 'afterRemove');
        
        this.__setAttribute(fieldDom, fieldSchema, 'formTitle');
        this.__setAttribute(fieldDom, fieldSchema, 'allowAddOnly');
        this.__setAttribute(fieldDom, fieldSchema, 'prependOnAdd');
        this.__setAttribute(fieldDom, fieldSchema, 'preFormAdd');
        this.__setAttribute(fieldDom, fieldSchema, 'preFormEdit');
        this.__setAttribute(fieldDom, fieldSchema, 'noDirty');
        this.__setAttribute(fieldDom, fieldSchema, 'formDialogCss');
        this.__setAttribute(fieldDom, fieldSchema, 'formActionTemplate');
        this.__setAttribute(fieldDom, fieldSchema, 'editIn');

        // hint
        this.__putHint(fieldDom);
        this.__putReadOnly(fieldDom);

        if (_inputSettings.RED_INDICATOR === true) {
            fieldDom.attr('always-red', 'true');
        }

        return fieldDom;
    }

    __createFilepickerDom(parentDom) {
        const fieldSchema = this.fieldSchema;
        const fieldDom = angular.element('<nbgen-file-upload>')
            .attr('ng-model', this.ngModelName)
            .attr('name', this.$fieldName);

        parentDom.append(fieldDom);

        if (fieldSchema.fieldLabelDisable !== true) {
            const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
            fieldDom.attr('label', `{{'${label}' | translate}}`)
        }

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            fieldDom.attr('ng-required', attrValue);
        }

        if (fieldSchema.multiple !== undefined) {
            fieldDom.attr('multiple', fieldSchema.multiple);
        }

        if (fieldSchema.filters !== undefined) {
            fieldDom.attr('filters', fieldSchema.filters);
        }
        if (fieldSchema.maxSize !== undefined) {
            fieldDom.attr('max-size', fieldSchema.maxSize);
        }
        if (fieldSchema.limit !== undefined) {
            fieldDom.attr('limit', fieldSchema.limit);
        }
        if (fieldSchema.noAdd !== undefined) {
            fieldDom.attr('no-add', fieldSchema.noAdd);
        }
        if (fieldSchema.noRemove !== undefined) {
            fieldDom.attr('no-remove', fieldSchema.noRemove);
        }
        if (fieldSchema.canView !== undefined) {
            fieldDom.attr('can-view', fieldSchema.canView);
        }
        if (fieldSchema.noDescription !== undefined) {
            fieldDom.attr('no-description', fieldSchema.noDescription);
        }
        if (fieldSchema.description !== undefined) {
            let transDesc;
            if (/\{\{/.test(fieldSchema.description)) {
                transDesc = fieldSchema.description;
            } else {
                transDesc = this.$translate.instant(`${this.translatePrefix}${fieldSchema.description}`);
            }
            fieldDom.attr('description', transDesc);
        }

        if (fieldSchema.descriptionPrompt !== undefined) {
            fieldDom.attr('description-prompt', `${this.translatePrefix}${fieldSchema.descriptionPrompt}`);
        }

        if (fieldSchema.descriptionOnly !== undefined) {
            fieldDom.attr('description-only', fieldSchema.descriptionOnly);
        }

        if (fieldSchema.onAdd !== undefined) {
            fieldDom.attr('on-add', fieldSchema.onAdd);
        }
        if (fieldSchema.onRemove !== undefined) {
            fieldDom.attr('on-remove', fieldSchema.onRemove);
        }

        if (fieldSchema.noDirty !== undefined) {
            fieldDom.attr('no-dirty', fieldSchema.noDirty);
        }

        if (fieldSchema.viewerLocation !== undefined) {
            fieldDom.attr('viewer-location', fieldSchema.viewerLocation);
        }

        this.__putReadOnly(fieldDom);
        this.__putHint(fieldDom);

        if (_inputSettings.RED_INDICATOR === true) {
            fieldDom.attr('always-red', 'true');
        }

        return fieldDom;
    }

    // create a select dom
    __createSelectDom(parentDom) {
        const fieldSchema = this.fieldSchema;
        const fieldDom = angular.element('<md-select>')
            .attr('name', this.$fieldName)
            .attr('aria-label', fieldSchema.fieldName)
            .attr('ng-model', this.ngModelName)
            .attr('md-on-open', `${controllerAs}.__loadSelectItems()`);
        parentDom.append(fieldDom);

        // lay out the md-option
        fieldDom.append(
            angular.element('<md-option>')
                .attr('ng-repeat', `selectItem in ${controllerAs}._fieldOptions`)
                .attr('ng-value', `${controllerAs}.__selectValue(selectItem, $index)`)
                .append(angular.element('<span>')
                    .attr('ng-bind-html', `${controllerAs}.__selectLabel(selectItem, $index)`))
        )

        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            fieldDom.attr('ng-required', attrValue);
            this.__addValidation(fieldDom);
        }

        this.__putDisabled(fieldDom);
        TmvFormUtils.__putClass(fieldDom, fieldSchema.inputCssClass);
        TmvFormUtils.__putStyle(fieldDom, fieldSchema.inputCssStyle);
        this.__putAttrs(fieldDom, fieldSchema.inputAttrs);

        this.__loadSelectItems();   // initial load

        return fieldDom;
    }

    // for selecting label of select options
    __selectLabel(selectItem, $index) {
        if (!_.isArray(selectItem) && !_.isObject(selectItem)) return selectItem;

        if (!this.fieldSchema.fieldOptionsLabel) {
            if (_.isArray(selectItem)) return selectItem.join(' ');
            if (!_.isObject(selectItem)) return selectItem;
            // return the first key of the object
            return selectItem[_.keys(selectItem)[0]];
        }

        return this.$parse(this.fieldSchema.fieldOptionsLabel)(selectItem, {$index: $index});
    }

    // use for determining select value
    __selectValue(selectItem, $index) {
        if (!this.fieldSchema.fieldOptionsValue) {
            return selectItem;
        }
        if (this.fieldSchema.fieldOptionsValue === '$index') {
            return $index;
        }
        return this.$parse(this.fieldSchema.fieldOptionsValue)(selectItem);
    }

    // use for selecting items
    __loadSelectItems() {
        const fieldSchema = this.fieldSchema;
        if (_.isArray(fieldSchema.fieldOptions)) {
            this._fieldOptions = fieldSchema.fieldOptions;
        } else if (_.isString(fieldSchema.fieldOptions)) {
            this._fieldOptions = this.$parse(fieldSchema.fieldOptions)(this.$scope.$parent, {[controllerAs]: this});
        } else {
            this._fieldOptions = [ ];
        }
        return this.$q.when(this._fieldOptions);
    }

    __onFocus($event) {
        let inputContainer = angular.element($event.target).closest('md-input-container');
        inputContainer.addClass('md-input-focused');
    }

    __onBlur($event) {
        let target = angular.element($event.target);
        if (!target.hasClass('ng-touched')) {
            this._hasBeenTouched = true;
            target.addClass('ng-touched');
        }
        let inputContainer = target.closest('md-input-container');
        inputContainer.removeClass('md-input-focused');
    }

    /////////////////////////////////////////

    // fieldInputType: text
    _constructTextDom() {
        const fieldSchema = this.fieldSchema;
        if (!fieldSchema || !fieldSchema.fieldName) {
            // probably just a filler for new line
            return angular.element('<div>').append('&nbsp;')
        }
        const containerDom = this.__createFieldContainer();
        const inputContainer = this.__createInputContainer(containerDom);

        // construct the input dom
        let inputDom;
        if (fieldSchema.fieldInputType === 'textarea') {
            inputDom = angular.element('<textarea>');
            if (fieldSchema.fieldRowSize) inputDom.attr('rows', fieldSchema.fieldRowSize + '');
            if (fieldSchema.autoGrow !== true) {
                inputDom.attr('md-no-autogrow', '');
            }
            if (fieldSchema.autoResize !== true) {
                inputDom.attr('md-no-resize', '');
            }
        } else if (fieldSchema.fieldInputType === 'date') {
            // date picker
            inputDom = angular.element('<input>')
                .attr('mdc-datetime-picker', '')
                .attr('time', 'false')
                .attr('date', 'true')
                .attr('format', _dateFormats.DEFAULT_DATE_FORMAT);

        } else if (fieldSchema.fieldInputType === 'time') {
            // time picker
            inputDom = angular.element('<input>')
                .attr('mdc-datetime-picker', '')
                .attr('time', 'true')
                .attr('date', 'false')
                .attr('short-time', 'true')
                .attr('format', _dateFormats.DEFAULT_TIME_FORMAT);
        } else if (fieldSchema.fieldInputType === 'datetime') {
            inputDom = angular.element('<input>')
                .attr('mdc-datetime-picker', '')
                .attr('time', 'true')
                .attr('date', 'true')
                .attr('short-time', 'true')
                .attr('format', _dateFormats.DEFAULT_DATE_TIME_FORMAT);
        } else if (fieldSchema.fieldInputType === 'static') {
            inputDom = angular.element('<div>').addClass('tmv-input-static md-input')
                .attr('tabindex', '0')
                .attr('ng-focus', `${controllerAs}.__onFocus($event)`)
                .attr('ng-blur', `${controllerAs}.__onBlur($event)`);
        } else {
            inputDom = angular.element('<input>');
            // handling for numeric input
            if (fieldSchema.fieldInputType === 'number') {
                // put number handling directive
                let decimalPlaces = fieldSchema.decimalPlaces || 0;     // default to 0 decimal places
                inputDom.attr('tmv-input-number', `${decimalPlaces}`);
            }
        }

        if (fieldSchema.fieldInputType !== 'static') {
            inputDom.attr('type', /^(date|time|datetime)$/.test(fieldSchema.fieldInputType) ? 'text' : fieldSchema.fieldInputType)
                .attr('ng-model', this.ngModelName)
                .attr('name', this.$fieldName);
                // .attr('md-no-asterisk', '');
            if (fieldSchema.toUpperCase) inputDom.attr('tmv-upper-case', '');
        }

        if (fieldSchema.fieldLabelDisable === true) {
            // add the aria-label
            const label = (fieldSchema.fieldLabel || fieldSchema.fieldName);
            inputDom.attr('aria-label', label);
        }

        inputContainer.append(inputDom);
        if (fieldSchema.fieldInputType === 'static') {
            inputDom.after(TmvFormUtils.__errorsSpacer());
            inputContainer.addClass('md-input-has-value');  // assume that it has value
        }

        TmvFormUtils.__putClass(inputDom, fieldSchema.inputCssClass);
        TmvFormUtils.__putStyle(inputDom, fieldSchema.inputCssStyle);

        if (/^(date|time|datetime)$/.test(fieldSchema.fieldInputType)) {
            if (fieldSchema.fieldReadOnly !== undefined) {
                this.__setAttribute(inputDom, fieldSchema, 'mdcReadOnly', 'interpolate', 'fieldReadOnly');
            } else {
                inputDom.attr('mdc-read-only', `{{${this.$attrs.readOnly}}}`)
            }
            if (fieldSchema.minDate !== undefined) {
                inputDom.attr('min-date', fieldSchema.minDate);
            }
            if (fieldSchema.maxDate !== undefined) {
                inputDom.attr('max-date', fieldSchema.maxDate);
            }
        } else if (fieldSchema.fieldInputType !== 'static') {
            this.__putReadOnly(inputDom, 'ng-readonly');
        }

        if (fieldSchema.fieldInputType !== 'static') {
            if (fieldSchema.fieldSize !== undefined) inputDom.attr('size', fieldSchema.fieldSize.toString());
        }

        if (fieldSchema.fieldDisable && fieldSchema.fieldInputType !== 'static') {
            inputDom.attr('ng-disabled', fieldSchema.fieldDisable);
        }

        if (fieldSchema.placeholder && fieldSchema.fieldInputType !== 'static') {
            inputDom.attr('placeholder', "{{'" + this.translatePrefix + fieldSchema.placeholder + "' | translate}}");
        } else if (fieldSchema.fieldInputType === 'date') {
            // inputDom.attr('placeholder', DEFAULT_DATE_FORMAT.toUpperCase());
        } else if (fieldSchema.fieldInputType === 'time') {
            // inputDom.attr('placeholder', DEFAULT_TIME_FORMAT.toUpperCase());
        } else if (fieldSchema.fieldInputType === 'datetime') {
            // inputDom.attr('placeholder', DEFAULT_DATE_TIME_FORMAT.toUpperCase());
        }

        // if there are other input attributes
        this.__putAttrs(inputDom, fieldSchema.inputAttrs || fieldSchema.attrs);

        // check if there's a right icon specified
        if (_.isString(fieldSchema.rightIcon)) {
            inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
            if (fieldSchema.fieldInputType === 'static') {
                inputContainer.addClass('md-icon-right');
            }
        }

        // check if there's a computed value attached to the schema
        if (_.isString(fieldSchema.computedValue)) {
            inputDom.attr('tmv-computed', fieldSchema.computedValue);
        } else if (fieldSchema.fieldInputType === 'static') {
            if (fieldSchema.fieldValue) {
                inputDom.append(fieldSchema.fieldValue);
            } else {
                inputDom.attr('ng-bind-html', this.ngModelName);
            }
        }

        // check if validation dom needed
        if (fieldSchema.fieldInputType !== 'static') {
            this.__addValidation(inputDom);
        }

        this.__addInfoText(inputContainer);

        return containerDom;
    }

    // specially useful for model properties not to be displayed but save / updated
    _constructHiddenDom () {
        const inputDom = angular.element('<input>')
            .attr('type', 'hidden')
            .attr('ng-model', this.ngModelName)
            .attr('name', this.$fieldName);

        if (this.fieldSchema.computedValue) {
            inputDom.attr('tmv-computed', this.fieldSchema.computedValue);
        }

        return inputDom
    }

    // for displaying input like text, but always in read-only
    _constructStaticDom() {
        return this._constructTextDom();
    }

    _constructSelect2Dom(selectType) {
        const fieldSchema = this.fieldSchema;
        const containerDom = this.__createFieldContainer();
        selectType = selectType || 'select2';

        const inputContainer = this.__createInputContainer(containerDom);

        const fieldDom = this.__createSelectDom(inputContainer, selectType);
        fieldDom.after(TmvFormUtils.__errorsSpacer());

        // check if there's a right icon specified
        if (angular.isString(fieldSchema.rightIcon)) {
            inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
        }
        // inputContainer.append(TmvFormUtils.__errorsSpacer());

        // inputContainer.attr('md-is-error', errorExpression);

        return containerDom;
    }

    _constructSelectDom() {
        return this._constructSelect2Dom.call(this, 'select');
    }

    // construct radio buttons dom
    _constructRadioDom() {
        const fieldSchema = this.fieldSchema;
        const containerDom = this.__createFieldContainer();

        const inputContainer = this.__createInputContainer(containerDom, 'md-input-has-value');

        if (angular.isUndefined(fieldSchema.fieldInputSelections) && angular.isDefined(fieldSchema.displayMap)) {
            fieldSchema.fieldInputSelections = fieldSchema.displayMap;
        }
        fieldSchema.fieldInputSelections = fieldSchema.fieldInputSelections || {};

        let domContainer = angular.element('<div>')
            .addClass('md-input tmv-radio-group-container').attr('tabindex', '0')
            .attr('ng-focus', `${controllerAs}.__onFocus($event)`)
            .attr('ng-blur', `${controllerAs}.__onBlur($event)`);
        inputContainer.append(domContainer);

        const radioGroupDom = angular.element('<md-radio-group>')
            .attr('name', this.$fieldName)
            .attr('ng-model', this.ngModelName);

        if (fieldSchema.verticalStyle !== true) {
            radioGroupDom.attr('layout-gt-xs', 'row');
            radioGroupDom.attr('layout-wrap-gt-xs', '');
        }

        TmvFormUtils.__domProperties(radioGroupDom, fieldSchema);

        domContainer.append(radioGroupDom);
        this.__putDisabled(radioGroupDom);

        if (fieldSchema.fieldValidateRulesRequired) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            radioGroupDom.attr('ng-required', attrValue);
            inputContainer.find('label').attr('ng-class', `{'md-required': ${fieldSchema.fieldValidateRulesRequired}}`);
        }
        let fieldInputSelections = fieldSchema.fieldInputSelections;
        if (_.isObject(fieldInputSelections) && !_.isArray(fieldInputSelections)) {
            // transform to comply with new format
            let newFieldInputSelections = [ ];
            _.each(fieldInputSelections, (value, key) => {
                newFieldInputSelections.push({
                    label: value,
                    value: key,
                })
            })
            fieldInputSelections = newFieldInputSelections;
        }

        _.each(fieldInputSelections, (schema) => {
            const radioDom = angular.element('<md-radio-button>')
                .attr('value', schema.value)
                .attr('aria-label', `{{'${this.translatePrefix}${schema.label}' | translate}}`);
            if (schema.template) {
                radioDom.append(schema.template);
            } else {
                radioDom.append(angular.element('<div>').addClass('md-body-1')
                    .attr('translate', `${this.translatePrefix}${schema.label}`));
            }
            radioGroupDom.append(radioDom);
            TmvFormUtils.__domProperties(radioDom, schema);
            this.__domVisibilityProperties(radioDom, schema);
            if (schema.disabled !== undefined) {
                radioDom.attr('ng-disabled', schema.disabled);
            }
        })

        // check if there's a right icon specified
        if (angular.isString(fieldSchema.rightIcon)) {
            inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
        }

        inputContainer.append(TmvFormUtils.__errorsSpacer());

        return containerDom;
    }

    // construct a checkbox dom
    _constructCheckboxDom() {
        const fieldSchema = this.fieldSchema;
        const containerDom = this.__createFieldContainer();
        const inputContainer = this.__createInputContainer(containerDom, 'md-input-has-value', true);

        const checkboxContainer = angular.element('<div>').addClass('md-input tmv-checkbox-container')
            .attr('ng-focus', `${controllerAs}.__onFocus($event)`)
            .attr('ng-blur', `${controllerAs}.__onBlur($event)`);
        inputContainer.append(checkboxContainer);

        let checkboxDom;

        if (fieldSchema.useSwitch === true) {
            checkboxDom = angular.element('<md-switch>');
        } else {
            checkboxDom = angular.element('<md-checkbox>');
        }
        const fieldLabel = fieldSchema.fieldLabel || fieldSchema.fieldName;
        checkboxDom.attr('name', this.$fieldName)
            .attr('ng-model', this.ngModelName)
            .attr('aria-label', "{{'" + this.translatePrefix + fieldLabel + "' | translate}}")
            .append(angular.element('<div>').addClass('md-body-1')
                .attr('translate', this.translatePrefix + fieldLabel));

        this.__putAttrs(checkboxDom, fieldSchema.inputAttrs);
        TmvFormUtils.__putClass(checkboxDom, fieldSchema.inputClass);
        TmvFormUtils.__putStyle(checkboxDom, fieldSchema.inputStyle);
        if (fieldSchema.fieldValidateRulesRequired !== undefined) {
            const attrValue = this.__generateAttrValue(fieldSchema, true, 'fieldValidateRulesRequired');
            checkboxDom.attr('ng-class', `{'tmv-true': ${attrValue}}`);
        }
        checkboxContainer.append(checkboxDom);

        this.__putDisabled(checkboxDom);

        // check if there's a right icon specified
        if (angular.isString(fieldSchema.rightIcon)) {
            inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
        }
        this.__addValidation(checkboxContainer, 'ng-hide');
        checkboxContainer.after(TmvFormUtils.__errorsSpacer());
        return containerDom;
    }

    _constructButtonDom() {
        const fieldSchema = this.fieldSchema;
        const containerDom = this.__createFieldContainer();

        const buttonDom = angular.element('<md-button>')
            .addClass(fieldSchema.btnClass || 'md-raised'); // by default create a raised button

        this.__putAttrs(buttonDom, fieldSchema.btnAttrs);
        containerDom.append(buttonDom);

        if (angular.isString(fieldSchema.fieldDisable)) {
            buttonDom.attr('ng-disabled', fieldSchema.fieldDisable);
        } else if (angular.isString(fieldSchema.btnDisabled)) {
            buttonDom.attr('ng-disabled', fieldSchema.btnDisabled);
        }
        if (angular.isString(fieldSchema.btnClick)) {
            buttonDom.attr('ng-click', fieldSchema.btnClick);
        }
        if (angular.isString(fieldSchema.btnIconClass)) {
            buttonDom.attr('tmv-icon', fieldSchema.btnIconClass);
        }
        const label = fieldSchema.fieldLabel;
        buttonDom.attr('tmv-label', `{{'${this.translatePrefix}${label}' | translate}}`);

        return containerDom;
    }

    _constructTemplateDom() {
        const fieldSchema = this.fieldSchema;
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const templateDom = angular.element('<div>').addClass('tmv-template')
        containerDom.append(templateDom)

        if (fieldSchema.template) {
            templateDom.append(fieldSchema.template);
        }

        TmvFormUtils.__domProperties(templateDom, fieldSchema);

        return containerDom;
    }

    // construction of dom for special components

    _constructDatapickerDom() {
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const chipsDom = this.__createChipsDom(containerDom);

        TmvFormUtils.__domProperties(chipsDom, this.fieldSchema);

        return containerDom;
    }

    _constructFilepickerDom() {
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const fieldDom = this.__createFilepickerDom(containerDom);

        TmvFormUtils.__domProperties(fieldDom, this.fieldSchema);

        return containerDom;
    }

    _constructLineitemsDom() {
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const fieldDom = this.__createLineitemsDom(containerDom);

        TmvFormUtils.__domProperties(fieldDom, this.fieldSchema);

        return containerDom;
    }

    _constructItemsDom() {
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const fieldDom = this.__createItemsDom(containerDom);

        TmvFormUtils.__domProperties(fieldDom, this.fieldSchema);

        return containerDom;
    }

    /**
     * For constructing time picker field
     */
    _constructTimeDom() {
        if (this.fieldSchema.inputInline !== true) return this._constructTextDom();
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const fieldDom = this.__createTimeDom(containerDom);

        TmvFormUtils.__domProperties(fieldDom, this.fieldSchema);

        return containerDom;
    }

    /**
     * For constructing date picker field
     */
    _constructDateDom() {
        if (this.fieldSchema.inputInline !== true) return this._constructTextDom();
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const fieldDom = this.__createDateDom(containerDom);

        TmvFormUtils.__domProperties(fieldDom, this.fieldSchema);

        return containerDom;
    }

    /**
     * For autocomplete component
     */
    _constructAutocompleteDom() {
        const fieldSchema = this.fieldSchema;
        const containerDom = this.__createFieldContainer('tmv-template-container');
        const fieldDom = angular.element('<md-autocomplete>').addClass('tmv-autocomplete')
            .attr('md-input-name', this.$fieldName)
            .attr('md-search-text', this.ngModelName);
        containerDom.append(fieldDom);
        TmvFormUtils.__domProperties(fieldDom, fieldSchema);

        return containerDom;
    }

    // this should called inside the link to setup the form controller where this directive is attached
    __setupFormCtrl(formCtrl) {
        this.formCtrl = formCtrl;
    }

    // initialization routines
    _initialize() {
        // retrieve parameters
        this.translatePrefix = this.$attrs.translatePrefix || '';
        this.fieldSchema = this.$parse(this.$attrs.schema)(this.$scope.$parent);
        if (!this.fieldSchema) throw "Field schema is missing";
        this.formModelName = this.$attrs.formModel;
        if (!this.formModelName) throw "Model is missing";

        this.formModelValue = this.$parse(this.formModelName)(this.$scope.$parent);

        // determine the model name where the input will be bound to
        this.$fieldName = this.$tmvModelName = this.fieldSchema.fieldName;
        if (this.fieldSchema.bindTo !== undefined) {
            this.ngModelName = this.fieldSchema.bindTo
            this.$tmvModelName = this.ngModelName;
        } else if (this.fieldSchema.fieldModel !== undefined) {
            this.ngModelName = `${this.formModelName}.${this.fieldSchema.fieldModel}`;
            this.$tmvModelName = this.fieldSchema.fieldModel;
        } else {
            this.ngModelName = `${this.formModelName}.${this.fieldSchema.fieldName}`;
        }

        // set the default fieldInputType
        if (!_.isString(this.fieldSchema.fieldInputType)) {
            this.fieldSchema.fieldInputType = 'text';
        }

        // set the default fieldLabel
        if (!_.isString(this.fieldSchema.fieldLabel)) {
            this.fieldSchema.fieldLabel = this.fieldSchema.fieldName;
        }

        this.fullLabel = this.fieldSchema.fieldLabelLiteral || `${this.translatePrefix}${this.fieldSchema.fieldLabel}`;
    }

    // set default value for the input
    _setDefaultValue() {
        if (_.isString(this.fieldSchema.fieldDefaultValue)) {
            // check if current value of model is undefined
            const modelValueParser = this.$parse(this.ngModelName);
            const modelValue = modelValueParser(this.$scope.$parent);
            if (modelValue !== undefined) return;       // there's an existing value so don't set
            let defaultValue;
            if (/^(date|datetime|time|datetime\-local)$/.test(this.fieldSchema.fieldInputType)) {
                // parse the default value string
                const dateStr = this.fieldSchema.fieldDefaultValue;
                if (dateStr.startsWith('now')) {
                    const matches = dateStr.match(/^now(\+|\-)(\d+)(\w*)$/);
                    if (matches && matches.length > 1) {
                        const oper = matches[1],
                            num = matches[2],
                            type = matches[3];
                        if (oper === '+') {
                            defaultValue = moment().add(parseInt(num), type).toDate()
                        } else {
                            defaultValue = moment().subtract(parseInt(num), type).toDate()
                        }
                    } else {
                        defaultValue = moment().toDate()
                    }
                } else {
                    defaultValue = this.$parse(this.fieldSchema.fieldDefaultValue)(this.$scope.$parent);
                }
            } else {
                defaultValue = this.$parse(this.fieldSchema.fieldDefaultValue)(this.$scope.$parent);
                if (defaultValue !== undefined && this.fieldSchema.fieldInputType === 'number') {
                    defaultValue = Number(defaultValue);    // convert default value to number
                }
            }
            if (defaultValue === undefined) return;         // nothing to assigned

            modelValueParser.assign(this.$scope.$parent, defaultValue);
        }
    }

}

angular.module(moduleName)
    .directive(directiveName, function($timeout) {
        'ngInject';

        return {
            require: ['^form', 'tmvInput'],
            restrict: 'E',
            controller: TmvInputController,
            controllerAs: controllerAs,
            scope: true,
            link: function($scope, $element, $attrs, $ctrls) {
                let tmvInput = $ctrls[1];
                tmvInput.__setupFormCtrl($ctrls[0]);
                $timeout(() => {
                    let ngModelCtrl = $ctrls[0][tmvInput.$fieldName];
                    if (ngModelCtrl) {
                        ngModelCtrl.$tmvModelName = tmvInput.$tmvModelName;
                    }
                })
            }
        }
    })
    /**
     * Directive to be attached to an input element with number type to automatically
     * insert decimal places
     */
    .directive('tmvInputNumber', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function($scope, $element, $attrs, $ngModel) {
                // only apply if input type is numeric
                if ($element[0].nodeName === 'INPUT' && $element.attr('type').toLowerCase() === 'number') {
                    // setup attributes observer
                    let decimalPlaces = parseInt($attrs.tmvInputNumber) || 0;   // default to 0 decimal places
                    // overwrite the model options to update only upon blurring
                    let unregister = $scope.$watch(function() {
                        return $ngModel.$modelValue;
                    }, function(value, oldValue) {
                        if (value === oldValue) return;
                        if (value === undefined || value === null || value.length === 0) return;    // nothing to change
                        if (!$element.is(':focus')) {
                            // don't update if in focus
                            let viewValue = $ngModel.$viewValue;
                            let numDecimalPlaces = _decimalPlaces(viewValue);
                            if (decimalPlaces !== numDecimalPlaces) {
                                const newValue = Number(viewValue).toFixed(decimalPlaces);
                                $element.val(newValue);
                            }
                        }
                        // rely on the watch if field is readonly or disabled
                        if ($element.attr('readonly') === undefined && $element.attr('disabled') === undefined) {
                            unregister();   // the on change event will handle the reset
                            // setup handler for succedding changes
                            $element.on('change', function() {
                                _changeDecimalPlaces($element, decimalPlaces);
                            });
                        }
                    });
                }
            }
        }

        // returns how many decimal places the specified number has
        function _decimalPlaces(num) {
            const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
            if (!match) {
                return 0;
            }
            return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
        }

        function _changeDecimalPlaces(numberDom, numDecimalPlaces) {
            const value = numberDom.val();
            if (value === undefined || value === null || value.length == 0) return;
            if (angular.isDefined(value) && !isNaN(Number(value))) {
                if (_decimalPlaces(value) !== numDecimalPlaces) {
                    numberDom.val(Number(value).toFixed(numDecimalPlaces));
                }
            }
        }
    })
    /**
     * directive for computed value handling
     */
    .directive('tmvComputed', function($parse, $interpolate, $compile) {
        'ngInject';

        return {
            require: '?ngModel',
            restrict: 'A',
            link: function($scope, $element, $attrs, ngModel) {
                let computedValueStr = $attrs.tmvComputed;
                let formModelExpr = computedValueStr.startsWith('expr:');   // context is the form model
                let context = $scope;
                if (formModelExpr) {
                    computedValueStr = computedValueStr.substr(5).trim();
                    // << >> is used as interpolation marker to avoid being evaluated by angular
                    if (!/\<\</.test(computedValueStr)) {
                        computedValueStr = `{{${computedValueStr}}}`;
                    } else {
                        // replace the << with proper interpolation marker
                        computedValueStr = computedValueStr.replace(/\<\</g, '{{');
                        computedValueStr = computedValueStr.replace(/\>\>/g, '}}');
                    }
                }
                let computedParser = formModelExpr ? $interpolate(computedValueStr) : $parse(computedValueStr);
                let isInput = ($element[0].nodeName === 'INPUT' || $element[0].nodeName === 'TEXTAREA');       // directive is attach to an input element
                let isHidden = isInput && $element.attr('type') === 'hidden';
                $scope.$watch(function() {
                    return computedParser(context);
                }, function(newValue) {
                    let valueToPut = newValue;
                    if (isInput) {
                        if (isHidden) {
                            // set the value via model
                            ngModel && ngModel.$setViewValue(valueToPut);
                        } else {
                            // change value of the input
                            $element.val(String(valueToPut));
                            $element.change();      // trigger the change event
                        }
                    } else {
                        $element.empty();
                        if (valueToPut !== undefined && valueToPut !== null) {
                            let elm = angular.element(`<span>${valueToPut}</span>`);
                            $element.append(elm);
                            $compile(elm)($scope);
                        }
                    }
                })
            }
        }
    })
    /**
     * directive for ng model which should evaluate to true to be valid
     */
    .directive('tmvTrue', function() {
        return {
            restrict: 'AC',
            require: 'ngModel',
            link: function($scope, $element, $attrs, ngModelCtrl) {
                $scope.$watch(function() {
                    return ngModelCtrl.$modelValue;
                }, function(value) {
                    if (value === true) {
                        ngModelCtrl.$setValidity('required', true);
                    } else {
                        ngModelCtrl.$setValidity('required', false);
                    }
                })
            }
        }
    })
    .directive('nbgenPasswordShow', function($compile) {
        'ngInject';

        class NbgenPasswordShowCtrl {
            constructor($scope, $element) {
                'ngInject';

                this.$element = $element;
                this.showPassword = false;
                this.templateDom = angular.element(nbgenPasswordShowTemplate);
                $element.after(this.templateDom);
                $compile(this.templateDom)($scope);
            }

            toggleShowPassword() {
                this.showPassword = !this.showPassword;
                if (this.showPassword) {
                    this.$element[0].type = 'text';
                } else {
                    this.$element[0].type = 'password';
                }
                this.$element.focus();
            }

            inputHasValue() {
                return this.$element && this.$element[0].value && this.$element[0].value.length > 0;
            }
        }

        return {
            restrict: 'AC',
            controller: NbgenPasswordShowCtrl,
            controllerAs: '$nbgenPasswordShow'
        }
    })
    .constant('$tmvDateFormats', _dateFormats)
    .constant('$tmvInputSettings', _inputSettings)
