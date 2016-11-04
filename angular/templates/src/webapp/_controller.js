/* globals angular, _ */
(function(angular) {
    'use strict';

    angular.module('<%= angularAppName %>')
        /**
         * @ngdoc controller
         * @name <%= controllerName %>Controller
         * @module <%= angularAppName %>
         * @description
         * A controller for the app
         */
        .controller('<%= controllerName %>Controller', function($scope) {
            'ngInject'
            
            var $ctrl = $scope.$ctrl = this;    // to conveniently access ctrl in the view

        })
})(angular);
