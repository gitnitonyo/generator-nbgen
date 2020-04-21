import angular from 'angular';
import moduleName from './nbgenAuth.js';
import zxcvbn from 'zxcvbn';

const directiveName = 'nbgenPassword';

const ngModule = angular.module(moduleName);
const errorKey = 'passwordSecure'

/**
 * Monitor password strengths of the ngModel value
 */
ngModule.directive(directiveName, function($parse) {
    'ngInject';
    return {
        restrict: 'A',
        require: '^ngModel',
        link: function($scope, $element, $attrs, $modelCtrl) {
            const parseFn = $parse($attrs[directiveName]);
            const minimumScore = parseInt($attrs.minScore) || 2;

            $scope.$watch(() => {
                return $modelCtrl.$modelValue;
            }, (value) => {
                let ps;
                if (!value) {
                    ps = null;
                } else {
                    ps = zxcvbn(value);
                }
                parseFn.assign($scope, ps);
                if (ps && ps.score < minimumScore) {
                    $modelCtrl.$setValidity(errorKey, false);
                } else {
                    $modelCtrl.$setValidity(errorKey, true);
                }
            })
        }
    }
});

/**
 * Component to display password strength meter
 */
const componentName = 'nbgenPasswordMeter';
import template from './nbgenPasswordMeter.html';
class NbgenPasswordMeterCtrl {
    constructor() {
        'ngInject';
    }
}

ngModule.component(componentName, {
    template,
    controller: NbgenPasswordMeterCtrl,
    controllerAs: componentName,
    bindings: {
        source: '<',    // where to get the data for the password meter
    }
})
