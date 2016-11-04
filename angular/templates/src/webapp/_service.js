/* globals angular, _ */
(function(angular) {
    'use strict';

    angular.module('<%=angularAppName%>')
        /**
         * @ngdoc factory
         * @name <%=serviceName%>Service
         * @module <%=angularAppName%>
         * @description
         * For accessing REST
         */
        .factory('<%=serviceName%>Service', function(<% if (serviceUrl) {%>$resource, $tmvUtils<%}%>) {<% if (serviceUrl) {%>
            'ngInject'
            var service = $resource('api/something/:id', {}, {
                'query': { method: 'GET', isArray: true},
                'get': {
                    method: 'GET',
                    transformResponse: function (data) {
                        data = angular.fromJson(data);
                        $tmvUtils.convertObjectWithDates(data);
                        return data;
                    }
                },
                'update': { method:'PUT' },
                'create': { method:'POST'}
            });<% } else { %>
            'ngInject'
            var service = {
                // define the properties and methods which will be offered by this here
            };<% } %>

            return service;
        })
})(angular);
