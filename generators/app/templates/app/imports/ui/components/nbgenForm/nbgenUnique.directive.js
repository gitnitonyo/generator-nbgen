/**
 * For checking uniqueness of field. Collection name is passed as the value of the attribute
 */
import angular from 'angular';
import _ from 'underscore';
import moduleName from './nbgenForm.js';
import { Meteor } from '../nbgenMeteor';

const directiveName = 'nbgenUnique';
const ngModule = angular.module(moduleName);
const checkForUniquenessFn = 'utils.checkForUniqueness';
const validityKey = 'unique', validityChecking = 'unique.doneChecking';

ngModule.directive(directiveName, _directiveFn);

function _directiveFn($timeout) {
    'ngInject';
    return {
        restrict: 'A',
        require: '^ngModel',
        link: function($scope, $element, $attrs, $ngModelCtrl) {
            let collectionName, isReadOnly, isDisabled;
            let checkFunction = _.debounce(value => {
                // use the model name by default as the field to search against
                const fieldName = $attrs.field || $ngModelCtrl.$name;
                // comma separted ids to be excempted from uniqueness
                // normally use if checking on itself
                const exceptions = $attrs.exceptions && $attrs.exceptions.split(',');

                // set validity of model to checking while uniqueness is being checked on the server
                $scope.$apply(() => $ngModelCtrl.$setValidity(validityChecking, false));
                Meteor.call(checkForUniquenessFn, collectionName, fieldName, value, exceptions, (err, result) => {
                    $timeout(() => {
                        $ngModelCtrl.$setValidity(validityChecking, true);
                        if (err) { throw err; }
                        $ngModelCtrl.$setValidity(validityKey, result);
                    })
                });
            }, 500);

            // monitor any changes on the attribute value
            $attrs.$observe(directiveName, attrValue => {
                collectionName = attrValue;
            });

            $attrs.$observe('readonly', attrValue => {
                isReadOnly = attrValue;
            });

            $attrs.$observe('disabled', attrValue => {
                isDisabled = attrValue;
            })

            // monitor changes in model value
            $timeout(() => {
                $scope.$watch(() => $ngModelCtrl.$viewValue, value => {
                    if (!value || isReadOnly || isDisabled) {
                        // don't validate if no value or readonly or disabled
                        $ngModelCtrl.$setValidity(validityKey, true);
                        $ngModelCtrl.$setValidity(validityChecking, true);
                        return;
                    }
                    // invoke the debounced function
                    checkFunction(value);
                });
            })
        }
    }
}
