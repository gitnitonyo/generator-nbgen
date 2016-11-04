/* globals angular, _ */
(function(angular) {
    'use strict';

    angular.module('<%=angularAppName%>')
        .directive('<%=_directiveName%>', function() {
            'ngInject'

            function controllerFn($scope, $element, $attrs, $transclude) {
                // put controller programs here
            }

            function preLinkFn(scope, element, attrs, controllers, transcludeFn) {
                // put prelink fn
            }

            function postLinkFn(scope, element, attrs, controllers, transcludeFn) {
                // put postlink fn here
            }

            function compileFn(element, attrs, transclude) {
                return {
                    pre: preLinkFn,
                    post: postLinkFn
                }
            }

            return {
                // uncomment applicable options
                // scope: true,                 // create a new scope inherited from parent
                // transclude: true,
                // requires: '',                // if this directive requires another controller from element or parent
                restrict: 'E',                 // by default applicable as element, attribue and class
                bindToController: true,
                controllerAs: '$ctrl',
                controller: controllerFn,
                compile: compileFn
                // templateUrl: 'views/<%=_artifactGroup%>/<%=_directiveName%>.html',
            }
        });
})(angular);
