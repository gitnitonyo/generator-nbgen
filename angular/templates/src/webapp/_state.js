/* globals angular, _ */
(function(angular) {
    'use strict';

    angular.module('<%= angularAppName %>')
        /**
         * @ngdoc config
         * @name <%= _stateName %>
         * @module <%= angularAppName %>
         * @description
         * A state routing for <%= _stateName %>
         */
        .config(function($stateProvider) {
            'ngInject'

            $stateProvider
                .state('<%= _stateName %>', {
                    parent: 'secureContent',
                    url: '/<%= _stateName %>',
                    data: {
                        roles: [],
                        pageTitle: '<%=_stateName%>.home.title'
                    },
                    views: {
                        'content@site': {
                            templateUrl: 'views/app/<%= _artifactGroup %>/<%= _stateName %>.html',
                            controller: '<%= controllerName %>Controller'
                        }
                    },
                    resolve: {
                        translatePartialLoader: ['$translate', '$translatePartialLoader',
                            function ($translate,$translatePartialLoader) {
                                $translatePartialLoader.addPart('<%= _artifactGroup %>/<%=_stateName %>');
                                return $translate.refresh();
                            }]
                    }
                })
        })
})(angular);
