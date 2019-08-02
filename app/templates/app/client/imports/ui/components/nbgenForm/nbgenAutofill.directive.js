import angular from 'angular';
import _ from 'underscore';
import moduleName from './nbgenForm.js';

const directiveName = 'nbgenAutofill';

angular.module(moduleName)
    .directive(directiveName, function($parse) {
        'ngInject';
        return {
            restrict: 'A',
            require: '^ngModel',
            link: function($scope, $element, $attrs) {
                $element.keyup($event => {
                    $scope.$apply(() => {
                        // ignore backspace & delete
                        const ignoreCodes = [8, 9, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46];
                        if (ignoreCodes.indexOf($event.keyCode) >= 0) return;
                        const currentValue = $event.target && $event.target.value;
                        if (!currentValue) return;  // no value
                        const param = $parse($attrs[directiveName])($scope);
                        if (!param) return;     // there's no parameter passed
                        if (!param.matches) return; // there's no pattern to match;
                        const matches = param.matches;
                        const fillStr = param.fillStr || '-';   // default to dash
                        if (_.find(matches, re => re.test(currentValue))) {
                            // there's a match
                            let newModelValue = `${currentValue}${fillStr}`;
                            // apply to the input field
                            if ($event.target) { $event.target.value = newModelValue; }
                        }
                    })
                })
            }
        }
    });
