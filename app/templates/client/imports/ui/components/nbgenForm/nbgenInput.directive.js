import angular from 'angular'
import moment from 'moment'
import _ from 'underscore'

import nbgenForm from './nbgenForm.js'

angular.module(nbgenForm)
    .directive('tmvInput', function($compile, $templateCache, $timeout, $interpolate, $parse, $translate) {
        'ngInject'

        return {
            restrict: 'E',
            require: ['^form', 'tmvInput'],
            link: _linkFn,
            controller: _controllerFn,
            transclude: 'element'
        };

        function _linkFn($scope, $element, $attrs, $ctrls, $transclude) {
            const formCtrl = $ctrls[0];
            const tmvInput = $ctrls[1];

            $scope.$$inTmvInput = true

            let dom;

            if (tmvInput.fieldSchema.template) {
                dom = tmvInput._constructTemplateDom(formCtrl);
            } else {
                switch (tmvInput.fieldSchema.fieldInputType) {
                    case 'select':
                        // handle select style drop down list
                        dom = tmvInput._constructSelectDom(formCtrl);
                        break;
                    case 'select2':
                        // handle more dynamic dropdown list
                        dom = tmvInput._constructSelect2Dom(formCtrl);
                        break;
                    case 'radio':
                        // handle radio buttons
                        dom = tmvInput._constructRadioDom(formCtrl);
                        break;
                    case 'checkbox':
                        // handle checkboxes
                        dom = tmvInput._constructCheckboxDom(formCtrl);
                        break;
                    case 'textarea':
                        // handle text area
                        dom = tmvInput._constructTextDom(formCtrl);
                        break;
                    case 'button':
                        dom = tmvInput._constructButtonDom(formCtrl);
                        break;
                    case 'template':
                        // handle template
                        dom = tmvInput._constructTemplateDom(formCtrl);
                        break;
                    case 'date':
                        // handle date
                        // if (tmvInput.fieldSchema.inline === true) {
                        dom = tmvInput._constructDateDom(formCtrl);
                        // } else {
                        //    dom = tmvInput._constructTextDom(formCtrl)
                        // }
                        break;
                    case 'static':
                        // readonly field
                        tmvInput.fieldSchema.fieldReadOnly = true;
                        dom = tmvInput._constructStaticDom(formCtrl);
                        break
                    case 'hidden':
                        dom = tmvInput._constructHiddenDom(formCtrl)
                        break
                    default:
                        dom = tmvInput._constructTextDom(formCtrl);
                }
            }

            $transclude(function(el, scope) {
                $element.replaceWith(dom)
                $compile(dom)(scope);
            })

            // start the handler for numeric input
            tmvInput._handleNumericInput(dom);

            // handle for compyed value
            tmvInput._handleComputedValue();
        }

        function _errorsSpacer() {
            return angular.element('<div>').addClass('md-errors-spacer');
        }

        function _controllerFn($scope, $element, $attrs) {
            'ngInject'

            const tmvInput = this;
            tmvInput.$scope = $scope;

            // read the passed parameters
            tmvInput.translatePrefix = $attrs.translatePrefix || 'form.';
            tmvInput.fieldSchema = $scope.$eval($attrs.schema);
            tmvInput.modelName = $attrs.formModel;
            tmvInput.ngModelName = tmvInput.modelName + '.' + tmvInput.fieldSchema.fieldName;

            // set default type to 'text'
            if (!angular.isString(tmvInput.fieldSchema.fieldInputType)) {
                tmvInput.fieldSchema.fieldInputType = 'text';
            }

            // set default label
            if (angular.isUndefined(tmvInput.fieldSchema.fieldLabel)) {
                if (tmvInput.fieldSchema.$$type === 'relation') {
                    tmvInput.fieldSchema.fieldLabel = tmvInput.fieldSchema.relationshipName;
                } else {
                    tmvInput.fieldSchema.fieldLabel = tmvInput.fieldSchema.fieldName;
                }
            }

            tmvInput._computeDate = function(dateStr) {
                let result;

                if (angular.isString(dateStr) && dateStr.startsWith('now')) {
                    let defaultValue = tmvInput.$scope.$eval(tmvInput.fieldSchema.fieldDefaultValue);
                    const matches = defaultValue.match(/^now(\+|\-)(\d+)(\w*)$/);
                    if (matches && matches.length > 1) {
                        const oper = matches[1],
                            num = matches[2],
                            type = matches[3];
                        if (oper === '+') {
                            result = moment().add(parseInt(num), type).toDate()
                        } else {
                            result = moment().subtract(parseInt(num), type).toDate()
                        }
                    } else {
                        result = moment().toDate()
                    }
                }

                return result
            }

            // initialize to default values if specified
            if (angular.isString(tmvInput.fieldSchema.fieldDefaultValue)) {
                const valueParser = $parse(tmvInput.ngModelName);
                const currentValue = valueParser(tmvInput.$scope);
                if (_.isEmpty(currentValue)) {
                    let defaultValue = tmvInput.$scope.$eval(tmvInput.fieldSchema.fieldDefaultValue);
                    if (tmvInput.fieldSchema.fieldInputType === 'number') {
                        defaultValue = Number(defaultValue);
                    } else if (tmvInput.fieldSchema.fieldInputType == "date" || tmvInput.fieldSchema.fieldInputType == "datetime" || tmvInput.fieldSchema.fieldInputType == "datetime-local") {
                        if (angular.isString(defaultValue)) {
                            defaultValue = tmvInput._computeDate(defaultValue)
                        }
                    }

                    // assigned default value
                    $timeout(() => valueParser.assign($scope, defaultValue))
                }
            }

            // adds validation attributes to the specified element
            tmvInput._addValidation = function(element, formCtrl) {
                const _this = this;
                const inputElement = element;
                const fieldSchema = _this.fieldSchema;
                const translatePrefix = _this.translatePrefix;
                let errorExpression = formCtrl.$name + '[\'' + fieldSchema.fieldName + '\'].$invalid'
                if (element.attr('ng-readonly')) {
                    errorExpression += ` && !(${element.attr('ng-readonly')})`
                }
                if (element.attr('ng-disabled')) {
                    errorExpression += ` && !(${element.attr('ng-disabled')})`
                }

                const ngMessages = angular.element('<div>')
                    .attr('ng-messages', formCtrl.$name + '[\'' + fieldSchema.fieldName + '\'].$error')
                    .attr('role', 'alert')
                    // .attr('ng-if', errorExpression)

                let hasAttachedMessage = false,
                    constraintValue, errorMessage

                if (angular.isDefined(fieldSchema.fieldValidateRulesRequired)) {

                    inputElement.attr('ng-required', fieldSchema.fieldValidateRulesRequired)
                    ngMessages.append(angular.element('<div>')
                        .attr('ng-message', 'required').append(angular.element('<span>')
                            .attr('translate', 'form.validation.required')))
                    hasAttachedMessage = true
                }
                if (angular.isDefined(fieldSchema.fieldValidateRulesMinlength)) {
                    constraintValue = fieldSchema.fieldValidateRulesMinlength.toString()
                    errorMessage = $translate.instant('form.validation.minlength', { min: constraintValue })
                    inputElement.attr('ng-minlength', constraintValue);
                    ngMessages.append(angular.element('<div>')
                        .attr('ng-message', 'minlength').append(angular.element('<span>')
                            .append(errorMessage)))
                    hasAttachedMessage = true
                }
                if (angular.isDefined(fieldSchema.fieldValidateRulesMaxlength)) {
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
                    inputElement.attr('tmv-maxlength', constraintValue)
                }
                if (angular.isDefined(fieldSchema.fieldValidateRulesMin)) {
                    constraintValue = fieldSchema.fieldValidateRulesMin.toString()
                    errorMessage = $translate.instant('form.validation.min', { min: constraintValue })
                    ngMessages.append(angular.element('<div>')
                        .attr('ng-message', 'min').append(angular.element('<span>')
                            .append(errorMessage)))
                    hasAttachedMessage = true
                    inputElement.attr('min', constraintValue);
                }
                if (angular.isDefined(fieldSchema.fieldValidateRulesMax)) {
                    constraintValue = fieldSchema.fieldValidateRulesMax.toString()
                    errorMessage = $translate.instant('form.validation.max', { max: constraintValue })
                    ngMessages.append(angular.element('<div>')
                        .attr('ng-message', 'max').append(angular.element('<span>')
                            .append(errorMessage)))
                    hasAttachedMessage = true
                    inputElement.attr('max', constraintValue);
                }
                if (angular.isDefined(fieldSchema.fieldValidateRulesPattern)) {
                    constraintValue = fieldSchema.fieldValidateRulesPattern.toString()
                    const patternValidationMessage = fieldSchema.patternValidationMessage || 'form.validation.pattern'
                    errorMessage = $translate.instant(patternValidationMessage, { pattern: constraintValue })
                    ngMessages.append(angular.element('<div>')
                        .attr('ng-message', 'pattern').append(angular.element('<span>')
                            .append(errorMessage)))
                    hasAttachedMessage = true
                    inputElement.attr('ng-pattern', constraintValue);
                }
                if (angular.isDefined(fieldSchema.fieldValidateRulesCustom)) {
                    const errorId = fieldSchema.fieldValidateRulesCustom.errorId;
                    const ctrlErrorId = translatePrefix + 'custom.' + errorId;
                    const validationFnStr = fieldSchema.fieldValidateRulesCustom.validationFn;
                    _this.$scope.$watch(function() {
                        const fieldCtrl = formCtrl[fieldSchema.fieldName];
                        return fieldCtrl.$modelValue;
                    }, function(value) {
                        const fieldCtrl = formCtrl[fieldSchema.fieldName];
                        const validationFn = _this.$scope.$eval(validationFnStr);
                        fieldCtrl.$setValidity(ctrlErrorId, true);
                        if (angular.isFunction(validationFn)) {
                            const result = validationFn(value, fieldCtrl, formCtrl);
                            if (result == false) {
                                fieldCtrl.$setValidity(ctrlErrorId, false);
                            }
                        }
                    });
                    errorMessage = $translate.instant(ctrlErrorId)
                    ngMessages.append(angular.element('<div>')
                        .attr('ng-message', ctrlErrorId).append(angular.element('<span>')
                            .append(errorMessage)))
                    hasAttachedMessage = true
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

                if (hasAttachedMessage) {
                    element.after(ngMessages)
                        // add md-is-error in md-input-container if present
                    const mdInputContainer = element.closest('md-input-container')
                    if (mdInputContainer.size() > 0) {
                        if (fieldSchema.noErrorIndicator === true) {
                            mdInputContainer.attr('md-is-error', 'false')
                        } else {
                            mdInputContainer.attr('md-is-error', errorExpression)
                        }
                    }
                }
            };

            // returns the parent container dom for the field
            tmvInput.__createFieldContainer = function __createFieldContainer(clz) {
                const fieldSchema = this.fieldSchema;
                const fieldContainerDom = angular.element('<div>');
                clz = clz || 'tmv-field-container'
                fieldContainerDom.addClass(clz);
                if (angular.isString(fieldSchema.ngIf)) fieldContainerDom.attr('ng-if', fieldSchema.ngIf);
                if (angular.isString(fieldSchema.ngShow)) fieldContainerDom.attr('ng-show', fieldSchema.ngShow);
                if (angular.isString(fieldSchema.ngHide)) fieldContainerDom.attr('ng-hide', fieldSchema.ngShow);
                if (fieldSchema.class) fieldContainerDom.addClass(fieldSchema.class);
                if (fieldSchema.cssClass) fieldContainerDom.addClass(fieldSchema.cssClass);
                if (angular.isObject(fieldSchema.cssStyle)) fieldContainerDom.css(fieldSchema.cssStyle)
                if (angular.isString(fieldSchema.gridClass)) {
                    fieldContainerDom.addClass(fieldSchema.gridClass);
                }
                if (angular.isObject(fieldSchema.gridAttrs)) {
                    angular.forEach(fieldSchema.gridAttrs, function(value, key) {
                        fieldContainerDom.attr(key, value)
                    })
                }
                // check if we need to add class for xtra small screen
                const classNames = fieldContainerDom[0].className.split(' ');
                const xsClass = _.find(classNames, function(className) {
                    return className.indexOf('col-xs') === 0 });
                if (!xsClass) {
                    fieldContainerDom.addClass('col-xs-12');
                }

                return fieldContainerDom;
            };

            tmvInput.__createInputContainer = function(parentDom, extraClass, noLabel) {
                const fieldSchema = this.fieldSchema;
                const inputContainer = angular.element('<md-input-container>').addClass('md-block tmv-field-container')
                    .attr('md-no-float', '');
                if (extraClass) inputContainer.addClass(extraClass);

                // add label
                if (noLabel !== true && fieldSchema.fieldLabelDisable !== true) {
                    const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
                    inputContainer.append(angular.element('<label>').text("{{'" + label + "' | translate}}"));
                }

                // check if there's a left icon specified
                if (angular.isString(fieldSchema.leftIcon)) {
                    inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.leftIcon));
                }

                if (parentDom) parentDom.append(inputContainer);

                return inputContainer;
            };

            tmvInput.__putDisabled = function(elemDom) {
                let disabledFn = $attrs.readOnly || '';
                if (angular.isDefined(tmvInput.fieldSchema.fieldDisable)) {
                    if (disabledFn.length > 0) {
                        disabledFn += ' || '
                    }
                    disabledFn += tmvInput.fieldSchema.fieldDisable;
                }
                if (disabledFn.length > 0) {
                    elemDom.attr('ng-disabled', disabledFn);
                }
            };

            tmvInput.__putClassAndStyle = function(elemDom, fieldSchema) {
                if (fieldSchema.inputCssClass) {
                    elemDom.addClass(fieldSchema.inputCssClass)
                }
                if (angular.isObject(fieldSchema.inputCssStyle)) {
                    elemDom.css(fieldSchema.inputCssStyle)
                }
            }

            tmvInput.__putAttrs = function(elemDom, fieldSchema) {
                if (angular.isObject(fieldSchema.attrs)) {
                    angular.forEach(fieldSchema.attrs, (attrValue, attrName) => {
                        elemDom.attr(attrName, attrValue)
                    })
                }
            }

            // create dom for text input
            tmvInput._constructTextDom = function(formCtrl) {
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
                    if (fieldSchema.fieldRowSize) inputDom.attr('rows', fieldSchema.fieldRowSize);
                    inputDom.attr('md-no-autogrow', '').attr('md-no-resize', '');
                } else if (fieldSchema.fieldInputType === 'date') {
                    // date picker
                    inputDom = angular.element('<input>')
                        .attr('mdc-datetime-picker', '')
                        .attr('time', 'false')
                        .attr('date', 'true')
                } else {
                    inputDom = angular.element('<input>');
                }
                inputDom.attr('type', fieldSchema.fieldInputType === 'date' ? 'text' : fieldSchema.fieldInputType)
                    .attr('ng-model', this.ngModelName)
                    .attr('name', fieldSchema.fieldName)
                    .attr('md-no-asterisk', '');

                if (fieldSchema.toUpperCase) inputDom.attr('tmv-upper-case', '')

                inputContainer.append(inputDom);

                tmvInput.__putClassAndStyle(inputDom, fieldSchema)

                tmvInput.$inputDom = inputDom; // for access by controller functions
                if (angular.isDefined(fieldSchema.fieldReadOnly)) {
                    inputDom.attr('ng-readonly', fieldSchema.fieldReadOnly)
                } else {
                    inputDom.attr('ng-readonly', $attrs.readOnly);
                }

                if (angular.isDefined(fieldSchema.fieldSize)) inputDom.attr('size', fieldSchema.fieldSize.toString())
                this.__putAttrs(inputDom, fieldSchema)

                if (fieldSchema.fieldDisable) {
                    inputDom.attr('ng-disabled', fieldSchema.fieldDisable);
                    // inputContainer.attr('ng-class', "'tmv-disable-' + fieldSchema.fieldDisable");
                }

                // check if validation dom needed
                this._addValidation(inputDom, formCtrl);

                if (fieldSchema.placeholder) {
                    inputDom.attr('placeholder', "{{'" + this.translatePrefix + fieldSchema.placeholder + "' | translate}}");
                }

                // if there are other input attributes
                if (angular.isObject(fieldSchema.inputAttrs)) {
                    angular.forEach(fieldSchema.inputAttrs, function(attrValue, attrName) {
                        inputDom.attr(attrName, attrValue);
                    })
                }

                // TODO: special input validation for checking for unique input

                // check if there's a right icon specified
                if (angular.isString(fieldSchema.rightIcon)) {
                    inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
                }

                return containerDom;
            };

            tmvInput._constructDateDom = function(formCtrl) {
                const fieldSchema = this.fieldSchema;
                const containerDom = this.__createFieldContainer();
                const inputContainer = angular.element('<div>')
                    .addClass('tmv-input-date-container tmv-field-container')
                containerDom.append(inputContainer)

                // add label
                if (fieldSchema.fieldLabelDisable !== true) {
                    const label = this.translatePrefix + (fieldSchema.fieldLabel || fieldSchema.fieldName);
                    inputContainer.append(angular.element('<label>').text("{{'" + label + "' | translate}}"));
                }

                // construct the date dom
                const dateDom = angular.element('<md-datepicker>')
                    .attr('ng-model', this.ngModelName)
                    .attr('name', fieldSchema.fieldName)
                    .attr('md-open-on-focus', '')

                inputContainer.append(dateDom)

                if (fieldSchema.minDate) {
                    dateDom.attr('md-min-date', fieldSchema.minDate)
                }
                if (fieldSchema.maxDate) {
                    dateDom.attr('md-max-date', fieldSchema.maxDate)
                }
                if (fieldSchema.dateFilter) {
                    dateDom.attr('md-date-filter', fieldSchema.dateFilter)
                }

                tmvInput.__putClassAndStyle(dateDom, fieldSchema)

                if (angular.isObject(fieldSchema.attrs)) {
                    // additional attributes of the element
                    angular.forEach(fieldSchema.attrs, function(value, key) {
                        dateDom.attr(key, value);
                    })
                }

                if (fieldSchema.fieldReadOnly) {
                    dateDom.attr('ng-disabled', fieldSchema.fieldReadOnly)
                } else if (fieldSchema.fieldDsiable) {
                    dateDom.attr('ng-disabled', fieldSchema.fieldDisable);
                    // inputContainer.attr('ng-class', "'tmv-disable-' + fieldSchema.fieldDisable");
                } else {
                    dateDom.attr('ng-disabled', $attrs.readOnly)
                }
                // check if validation dom needed
                this._addValidation(dateDom, formCtrl);

                if (fieldSchema.placeholder) {
                    dateDom.attr('placeholder', "{{'" + this.translatePrefix + fieldSchema.placeholder + "' | translate}}");
                }

                // if there are other input attributes
                if (angular.isObject(fieldSchema.inputAttrs)) {
                    angular.forEach(fieldSchema.inputAttrs, function(attrValue, attrName) {
                        dateDom.attr(attrName, attrValue);
                    })
                }


                return containerDom
            }

            tmvInput._constructHiddenDom = function(formCtrl) { // eslint-disable-line
                const fieldSchema = this.fieldSchema;
                const inputDom = angular.element('<input>')
                    .attr('type', 'hidden')
                    .attr('ng-model', this.ngModelName)
                    .attr('name', fieldSchema.fieldName)

                return inputDom
            }

            // just displays a text stored on i18n
            tmvInput._constructStaticDom = function(formCtrl) { // eslint-disable-line
                const fieldSchema = this.fieldSchema
                const containerDom = this.__createFieldContainer('tmv-static-container md-body-1')
                const staticDom = angular.element('<div>').css('display', 'block').addClass('tmv-static')
                if (fieldSchema.isFiller === true) {
                    // just use as a filler
                } else if (angular.isString(fieldSchema.displayExpr)) {
                    staticDom.append(fieldSchema.displayExpr)
                } else if (angular.isString(fieldSchema.computedValue)) {
                    staticDom.append(`<span ng-bind-html="${this.ngModelName}"></span>`)
                } else {
                    staticDom.attr('translate', this.translatePrefix + fieldSchema.fieldName)
                }

                tmvInput.__putClassAndStyle(staticDom, fieldSchema)
                tmvInput.__putAttrs(staticDom, fieldSchema)
                containerDom.append(staticDom)

                return containerDom
            }

            tmvInput._constructSelect2Dom = function(formCtrl, selectType) {
                const fieldSchema = this.fieldSchema;
                const containerDom = this.__createFieldContainer();
                selectType = selectType || 'select2';

                const inputContainer = this.__createInputContainer(containerDom);

                const selectDom = angular.element('<tmv-select>')
                    .attr('schema', $attrs.schema)
                    .attr('form-model', $attrs.formModel)
                    .attr('translation-prefix', $attrs.translatePrefix)
                    .attr('select-type', selectType)
                    .attr('read-only', $attrs.readOnly);

                inputContainer.append(selectDom);
                // check if there's a right icon specified
                if (angular.isString(fieldSchema.rightIcon)) {
                    inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
                }
                inputContainer.append(_errorsSpacer());

                return containerDom;
            };

            tmvInput._constructSelectDom = function(formCtrl) {
                return this._constructSelect2Dom(formCtrl, 'select');
            };

            // construct radio buttons dom
            tmvInput._constructRadioDom = function(formCtrl) {
                const _this = this;
                const fieldSchema = this.fieldSchema;
                const containerDom = this.__createFieldContainer();

                const inputContainer = this.__createInputContainer(containerDom, 'md-input-has-value');

                if (angular.isUndefined(fieldSchema.fieldInputSelections) && angular.isDefined(fieldSchema.displayMap)) {
                    fieldSchema.fieldInputSelections = fieldSchema.displayMap;
                }
                fieldSchema.fieldInputSelections = fieldSchema.fieldInputSelections || {};

                const radioGroupDom = angular.element('<md-radio-group>')
                    .attr("layout", "row")
                    .attr('name', fieldSchema.fieldName)
                    .attr('ng-model', this.ngModelName);

                if (fieldSchema.radioClass) radioGroupDom.addClass(fieldSchema.radioClass)

                tmvInput.__putClassAndStyle(radioGroupDom, fieldSchema);
                inputContainer.append(radioGroupDom);
                _this.$inputDom = radioGroupDom; // for access by controller functions
                tmvInput.__putDisabled(radioGroupDom);

                if (fieldSchema.fieldValidateRulesRequired) {
                    tmvInput._addValidation(radioGroupDom, formCtrl)
                }

                angular.forEach(fieldSchema.fieldInputSelections, function(value, key) {
                    const radioDom = angular.element("<md-radio-button>")
                        .attr('value', key)
                        .attr('aria-label', "{{'" + _this.translatePrefix + value + "' | translate}}")
                        .append(angular.element('<span>')
                            .attr('translate', _this.translatePrefix + value));
                    tmvInput.__putDisabled(radioDom);
                    if (fieldSchema.fieldValidateRulesRequired) radioDom.attr('ng-required', fieldSchema.fieldValidateRulesRequired);
                    radioGroupDom.append(radioDom);
                });

                // check if there's a right icon specified
                if (angular.isString(fieldSchema.rightIcon)) {
                    inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
                }

                inputContainer.append(_errorsSpacer());

                return containerDom;
            };

            // construct a checkbox dom
            tmvInput._constructCheckboxDom = function(formCtrl) {
                const fieldSchema = this.fieldSchema;
                const containerDom = this.__createFieldContainer();
                const inputContainer = this.__createInputContainer(containerDom, 'md-input-has-value', true);

                const checkboxDom = angular.element('<md-checkbox>')
                    .attr('name', fieldSchema.fieldName)
                    .attr('ng-model', this.ngModelName)
                    .attr('aria-label', "{{'" + this.translatePrefix + fieldSchema.fieldName + "' | translate}}")
                    .append(angular.element('<span>')
                        .attr('translate', this.translatePrefix + fieldSchema.fieldName));
                tmvInput.__putClassAndStyle(checkboxDom, fieldSchema)
                tmvInput.__putAttrs(checkboxDom, fieldSchema)
                inputContainer.append(checkboxDom);
                tmvInput.$inputDom = checkboxDom; // for access by controller functions

                tmvInput.__putDisabled(checkboxDom);

                if (fieldSchema.fieldValidateRulesRequired) {
                    tmvInput._addValidation(checkboxDom, formCtrl)
                }

                // check if there's a right icon specified
                if (angular.isString(fieldSchema.rightIcon)) {
                    inputContainer.append(angular.element('<md-icon>').attr('md-font-icon', fieldSchema.rightIcon));
                }

                inputContainer.append(_errorsSpacer());

                return containerDom;
            };

            tmvInput._constructButtonDom = function() {
                const fieldSchema = this.fieldSchema;
                const containerDom = this.__createFieldContainer();

                const buttonDom = angular.element('<md-button>')
                    .addClass(fieldSchema.btnClass || 'md-raised'); // by default create a raised button

                tmvInput.__putClassAndStyle(buttonDom, fieldSchema);
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
                buttonDom.attr('tmv-label', "{{'" + this.translatePrefix + fieldSchema.fieldName + "' | translate}}");

                return containerDom;
            };

            tmvInput._constructTemplateDom = function() {
                const fieldSchema = this.fieldSchema;
                const containerDom = this.__createFieldContainer('tmv-template-container');
                const templateDom = angular.element('<div>').addClass('tmv-template')
                containerDom.append(templateDom)
                tmvInput.__putClassAndStyle(templateDom, fieldSchema)

                if (fieldSchema.template) {
                    templateDom.append(fieldSchema.template);
                }

                return containerDom;
            };

            // special handling for numeric input
            tmvInput._handleNumericInput = function(element) {
                const _this = this;
                const fieldSchema = this.fieldSchema;
                if (fieldSchema.fieldInputType !== 'number') return; // not applicable if not number

                const _decimalPlaces = function(num) {
                    const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
                    if (!match) {
                        return 0;
                    }
                    return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
                };

                $timeout(function() {
                    const numberDom = element.find('input[type=number]');
                    if (numberDom.size() > 0) {
                        let numDecimalPlaces;
                        if (fieldSchema.fieldType == 'Integer' || fieldSchema.fieldType == 'Long') {
                            numDecimalPlaces = 0;
                        } else {
                            if (!_.isUndefined(fieldSchema.decimalPlaces)) {
                                numDecimalPlaces = parseInt(fieldSchema.decimalPlaces)
                            } else {
                                numDecimalPlaces = 2;
                            }
                        }

                        // handle fields which are not readonly
                        if (angular.isDefined(numberDom.attr('readonly')) || angular.isDefined(numberDom.attr('disabled'))) {
                            numberDom.on('blur', function() {
                                if (this.value == null || this.value.length == 0) return;
                                this.value = Number(this.value).toFixed(numDecimalPlaces);
                            });
                        }
                        _this.$scope.$watch(function() {
                            return numberDom.val();
                        }, function(value) {
                            if (value == null || value.length == 0) return;
                            if (angular.isDefined(value) && !isNaN(Number(value)) && !numberDom.is(':focus')) {
                                if (_decimalPlaces(value) != numDecimalPlaces) {
                                    numberDom.val(Number(value).toFixed(numDecimalPlaces));
                                }
                            }
                        });
                    }
                })
            };

            // special handling for computed value
            tmvInput._handleComputedValue = function() {
                const _this = this;
                const fieldSchema = this.fieldSchema;
                if (!angular.isString(fieldSchema.computedValue)) return;
                if (fieldSchema.computedValue.indexOf('expr:') === 0) {
                    // need to interpolate
                    fieldSchema._strToInterpolate = fieldSchema.computedValue.substr(5).trim();
                }

                this.$scope.$watch(function() {
                    let value;
                    if (fieldSchema._strToInterpolate) {
                        value = $interpolate(fieldSchema._strToInterpolate)(_this.$scope.$eval(_this.modelName));
                    } else {
                        value = _this.$scope.$eval(fieldSchema.computedValue);
                    }
                    return value;
                }, function(value) {
                    $parse(_this.ngModelName).assign(_this.$scope, value);
                })
            }
        }
    })
    .directive('tmvShowValidation', function($translate, $compile, $sanitize, $mdColors) {
        /**
         * show validation message
         * @author: tmv
         */
        return {
            scope: false,
            restrict: 'A',
            require: ['^form', '^ngModel'],
            link: function($scope, $element, $attrs, $ctrls) {
                const form = $ctrls[0]; // eslint-disable-line
                const field = $ctrls[1]; // eslint-disable-line
                $element.removeAttr('tmv-show-validation');
                const fieldContainer = $element.closest('.tmv-field-container');

                // register a watch to check for validation
                $scope.$watchCollection(function() {
                    return field.$error;
                }, function(error) { // eslint-disable-line
                    const invalid = field.$invalid;
                    const dirty = field.$dirty; // eslint-disable-line
                    let disable = !!$element.attr('disabled') || !!$element.attr('readonly');
                    if ($element.attr('ng-disabled')) {
                        disable = disable || $scope.$eval($element.attr('ng-disabled'));
                    }
                    if ($element.attr('ng-readonly')) {
                        disable = disable || $scope.$eval($element.attr('ng-readonly'));
                    }
                    const element = $element;
                    let constraintValue = null;
                    if (invalid && field.$dirty && !disable) {
                        fieldContainer.addClass('tmv-has-error');
                    } else {
                        fieldContainer.removeClass('tmv-has-error');
                    }

                    if (invalid && field.$dirty && !disable) {
                        const _getErrorMessage = function() {
                            if (field.$error.email == true) {
                                return {
                                    type: 'email',
                                    text: $translate.instant('form.validation.email')
                                };
                            }
                            if (field.$error.required == true) {
                                return {
                                    type: 'required',
                                    text: $translate.instant('form.validation.required')
                                };
                            }
                            if (field.$error.minlength == true) {
                                constraintValue = element.attr('ng-minlength');
                                return {
                                    type: 'minlength',
                                    text: $translate.instant('form.validation.minlength', {
                                        min: constraintValue
                                    })
                                };
                            }
                            if (field.$error.maxlength == true) {
                                constraintValue = element.attr('ng-maxlength');
                                return {
                                    type: 'maxlength',
                                    text: $translate.instant('form.validation.maxlength', {
                                        max: constraintValue
                                    })
                                };
                            }
                            if (field.$error['md-maxlength'] == true) {
                                constraintValue = element.attr('md-maxlength');
                                return {
                                    type: 'md-maxlength',
                                    text: $translate.instant('form.validation.maxlength', {
                                        max: constraintValue
                                    })
                                };
                            }
                            if (field.$error.min == true) {
                                constraintValue = element.attr('min');
                                return {
                                    type: 'min',
                                    text: $translate.instant('form.validation.min', {
                                        min: constraintValue
                                    })
                                };
                            }
                            if (field.$error.max == true) {
                                constraintValue = element.attr('max');
                                return {
                                    type: 'max',
                                    text: $translate.instant('form.validation.max', {
                                        max: constraintValue
                                    })
                                };
                            }
                            if (field.$error.pattern == true) {
                                constraintValue = element.attr('ng-pattern');
                                return {
                                    type: 'pattern',
                                    text: $translate.instant('form.validation.pattern', {
                                        max: constraintValue
                                    })
                                };
                            }
                            if (field.$error.number == true) {
                                return {
                                    type: 'number',
                                    text: $translate.instant('form.validation.number')
                                };
                            }
                            if (field.$error.datetimelocal == true) {
                                return {
                                    type: 'datetimelocal',
                                    text: $translate.instant('form.validation.local')
                                };
                            }
                            if (field.$error.unique == true) {
                                return {
                                    type: 'unique',
                                    text: $translate.instant('form.validation.unique')
                                };
                            }

                            // check for custom messages
                            const errorKeys = Object.keys(field.$error);
                            let errorMessage;
                            _.find(errorKeys, function(key) {
                                if (key.indexOf('.custom.') !== -1) {
                                    errorMessage = {
                                        type: key,
                                        text: $translate.instant(key)
                                    };
                                    return true;
                                }
                                return false;
                            });
                            if (errorMessage) {
                                return errorMessage;
                            }

                            // return the first $error key
                            return {
                                type: errorKeys[0],
                                text: 'Invalid input'
                            };
                        };

                        // element has an error
                        fieldContainer.find('.tmv-error-message').remove();
                        const errorsSpacer = fieldContainer.find('.md-errors-spacer');
                        if (errorsSpacer.size() > 0) {
                            const warnColor = 'color: ' + $mdColors.getThemeColor('warn');
                            const errorMessage = _getErrorMessage();
                            const errorMessageDom = angular.element('<div>')
                                .addClass('md-caption tmv-error-message')
                                .attr('style', warnColor)
                                .append(angular.element('<span>').addClass('ellipsis')
                                    .html($sanitize(errorMessage.text)));
                            errorsSpacer.after(errorMessageDom)
                        }
                    } else {
                        fieldContainer.find('.tmv-error-message').remove();
                    }
                });
            }
        }
    })
