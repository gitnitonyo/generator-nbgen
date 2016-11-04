import angular from 'angular'
import _ from 'underscore'

import nbgenForm from './nbgenForm.js'

angular.module(nbgenForm)
.directive('tmvSelect', function($compile, $tmvDynamicItems, $resource, $injector, $interpolate) {
    'ngInject'

    return {
        restrict: 'E',
        scope: false,
        require: ['^form', 'tmvSelect'],
        controller: _controllerFn,
        link: _linkFn
    };

    function _controllerFn($scope, $element, $attrs) {
        'ngInject'

        // initialize controller variables
        let tmvSelect = this;
        tmvSelect.$scope = $scope;
        tmvSelect.$element = $element;
        tmvSelect.$attrs = $attrs;

        tmvSelect.fieldSchema = $scope.$eval($attrs.schema);
        tmvSelect.formModelName = $attrs.formModel;
        tmvSelect.selectType = $attrs.selectType || 'select2';
        tmvSelect.translatePrefix = $attrs.translatePrefix;
        tmvSelect.fieldOptions = tmvSelect.fieldSchema.fieldOptions;
        tmvSelect.labelProperty = tmvSelect.fieldSchema.fieldOptionsLabel;
        tmvSelect.valueProperty = tmvSelect.fieldSchema.fieldOptionsValue;

        // for binding dynamic items to the scope for template to make it accessible
        tmvSelect.scopeVarName = _.uniqueId('tmvSelect_');
        tmvSelect.scopeVar = tmvSelect.$scope[tmvSelect.scopeVarName] = { };


        // create the dynamic items object
        if (angular.isArray(tmvSelect.fieldOptions)) {
            // it's an array
            tmvSelect.scopeVar.$items = tmvSelect.fieldOptions;
        } else {
            // dissect the string
            let optionDirectives = tmvSelect.fieldOptions.split(':');
            if (optionDirectives.length === 1) {
                tmvSelect.$scope.$watch(tmvSelect.fieldOptions, function(options) {
                    if (angular.isArray(options)) {
                        tmvSelect.scopeVar.$items = options;
                    }
                })
            } else if (optionDirectives.length > 1) {
                let optionDirective = optionDirectives[0];
                let dataService, queryCall;
                if (optionDirective === 'api') {        // api URL is specified
                    dataService = $resource(optionDirectives[1], {}, {
                        'query': {method: 'GET', isArray: true}
                    });
                    queryCall = 'query';
                } else if (optionDirective === 'service') { // an angular service is specified
                    // the specified service must exists to make this work
                    if ($injector.has(optionDirectives[1])) {
                        dataService = $injector.get(optionDirectives[1]);
                        queryCall = tmvSelect.fieldSchema.queryCall || 'query';
                    }
                } else {
                    // assume it's just a string bound to scope
                    tmvSelect.$scope.$watch(optionDirectives[1], function(options) {
                        if (angular.isArray(options)) {
                            tmvSelect.scopeVar.$items = options;
                        }
                    })
                }
                if (dataService) {
                    // there's a data service defined; create dynamic items out of this service
                    tmvSelect.scopeVar.$dataService = dataService;
                    tmvSelect.scopeVar.$queryCall = queryCall;
                }
            }
        }

        // define scope methods for getting label and values of each item in the selection
        tmvSelect.scopeVar.$getLabel = function(item) {
            if (!angular.isObject(item)) return item;       // item is not an object

            if (!angular.isString(tmvSelect.labelProperty)) {
                // no label property specified
                if (angular.isString(tmvSelect.valueProperty)) {
                    return tmvSelect.scopeVar.$getValue(item);
                }
                return item;
            }

            if (tmvSelect.labelProperty.indexOf('expr:') === 0) {
                // passed value needs to be interpolated
                return $interpolate(tmvSelect.labelProperty.substr(5))(item);
            } else if (tmvSelect.labelProperty.indexOf('computed:') === 0) {
                return tmvSelect.$scope.$eval(tmvSelect.labelProperty.substr(9));
            }

            return item[tmvSelect.labelProperty];
        };

        tmvSelect.scopeVar.$getValue = function(item) {
            if (!angular.isObject(item)) return item;

            if (!angular.isString(tmvSelect.valueProperty) || tmvSelect.valueProperty.indexOf('self:') === 0) {
                return item;
            }

            if (tmvSelect.valueProperty.indexOf('expr:') === 0) {
                // passed value needs to be interpolated
                return $interpolate(tmvSelect.valueProperty.substr(5))(item);
            } else if (tmvSelect.valueProperty.indexOf('computed:') === 0) {
                return tmvSelect.$scope.$eval(tmvSelect.valueProperty.substr(9));
            }

            let result = item[tmvSelect.valueProperty];

            return result;
        };

        tmvSelect.__putAttrs = function(elemDom, fieldSchema) {
            if (angular.isObject(fieldSchema.attrs)) {
                angular.forEach(fieldSchema.attrs, (attrValue, attrName) => {
                    elemDom.attr(attrName, attrValue)
                })
            }
        }

        tmvSelect.__putClassAndStyle = function(elemDom, fieldSchema) {
            if (fieldSchema.inputCssClass) {
                elemDom.addClass(fieldSchema.inputCssClass)
            }
            if (angular.isObject(fieldSchema.inputCssStyle)) {
                elemDom.css(fieldSchema.inputCssStyle)
            }
        }

        // construct DOM for select
        tmvSelect._constructSelectDom = function() {
            let ngModelStr = tmvSelect.formModelName + '.' + tmvSelect.fieldSchema.fieldName;
            let selectDom = angular.element('<md-select>')
                .attr('name', tmvSelect.fieldSchema.fieldName)
                .attr('ng-model', ngModelStr)
                .attr('md-no-asterisk', '');

            if (tmvSelect.fieldSchema.fieldOptionsValue) {
                // const trackStr = `{trackBy: '$value.${tmvSelect.fieldSchema.fieldOptionsValue}'}`
                // console.log(trackStr)
                // selectDom.attr('ng-model-options', trackStr)
            }

            tmvSelect.__putAttrs(selectDom, tmvSelect.fieldSchema)
            tmvSelect.__putClassAndStyle(selectDom, tmvSelect.fieldSchema)

            if (tmvSelect.fieldSchema.fieldValidateRulesRequired === true) {
                selectDom.attr('required', '')
                    // .attr('tmv-show-validation', '');
            }

            // set disabled condition
            let disabledCondition
            if (tmvSelect.fieldSchema.fieldDisable) {
                disabledCondition = `(${tmvSelect.fieldSchema.fieldDisable})`
            }
            if ($attrs.readOnly) {
                if (disabledCondition) {
                    disabledCondition = `${disabledCondition} || (${$attrs.readOnly})`
                } else {
                    disabledCondition = `(${$attrs.readOnly})`
                }
                selectDom.attr('ng-disabled', $attrs.readOnly);
            }
            if (disabledCondition) {
                selectDom.attr('ng-disabled', disabledCondition);
            }

            if (tmvSelect.scopeVar.$dataService) {
                // data service is used
                tmvSelect.scopeVar.$loadData = function() {
                    return tmvSelect.scopeVar.$dataService[tmvSelect.scopeVar.$queryCall](tmvSelect.fieldSchema.queryParams,
                        function(result) {
                            tmvSelect.scopeVar.$items = result;
                        }).$promise;
                };
                selectDom.attr('md-on-open', tmvSelect.scopeVarName + ".$loadData()")
            }


            let mdOptionDom = angular.element('<md-option>')
                .attr('ng-repeat', 'item in ' + tmvSelect.scopeVarName + '.$items')
                .attr('ng-value', tmvSelect.scopeVarName + '.$getValue(item)')
                .text("{{" + tmvSelect.scopeVarName + ".$getLabel(item)}}");

            selectDom.append(mdOptionDom);

            return selectDom;
        }
    }

    function _linkFn($scope, $element, $attrs, $ctrls) {
        let formCtrl = $ctrls[0],   // eslint-disable-line
            tmvSelect = $ctrls[1];

        let dom;

        if (tmvSelect.selectType === 'select') {
            // simple select
            dom = tmvSelect._constructSelectDom();
        } else {
            // TODO: select with search capability
        }

        if (dom) {
            $element.replaceWith(dom);
            $compile(dom)($scope);
        }
    }
})
