import angular from 'angular'

import template from './<%= componentName %>State.html'

const name = '<%= componentName %>'
const moduleName = '<%= moduleName %>'
const i18npart = `${moduleName}/${name}`

angular.module(moduleName)
    .config(function($stateProvider) {
        'ngInject';

        $stateProvider
            .state(name, {
                parent: 'site',
                url: `/${name}`,
                data: {
                    roles: [
                    ]
                },
                views: {
                    'content@': {
                        template,
                    }
                },
                resolve: {
                    translatePartialLoader: ['$translate', '$translatePartialLoader',
                        function ($translate,$translatePartialLoader) {
                            $translatePartialLoader.addPart(i18npart);
                            return $translate.refresh();
                        }]
                }
            })
    })
