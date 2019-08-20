/**
 * Main app
 */

import { Meteor } from '/client/imports/ui/components/nbgenComponents';

// import common components
import _ from 'underscore';
import 'moment'
import 'moment-timezone'

// npm dependencies
import angular from 'angular'
import ngSanitize from 'angular-sanitize'
import ngAnimate from 'angular-animate'
import ngResource from 'angular-resource'
import ngCookies from 'angular-cookies'
import ngMessages from 'angular-messages'

import ngMaterial from 'angular-material'
import ngMeteor from 'angular-meteor'

// angular translate npm modules
import 'angular-translate'
import 'angular-translate-storage-cookie'
import 'angular-translate-storage-local'
import 'angular-translate-loader-partial'

// angular-ui-router
import ngUiRouter from 'angular-ui-router'

import template from './nbgenApp.html'
import nbgenComponents from '/client/imports/ui/components/nbgenComponents';

import nbgenAppConfig from './nbgenAppConfig.js'
import NbGenAppCtrl from './nbgenAppCtrl.js'

const name = 'nbgenApp'
export default name

const ngTranslate = 'pascalprecht.translate'

angular.module(name, [
    ngSanitize,
    ngAnimate,
    ngResource,
    ngCookies,
    ngMessages,
    ngMaterial,
    ngMeteor,
    ngTranslate,
    ngUiRouter,
    nbgenComponents,
])
    // main nbgen app component
    .component(name, {
        template,
        controllerAs: name,
        controller: NbGenAppCtrl,
    })
    .run(($rootScope, $reactive) => {
        'ngInject';

        const $nbgenReactive = { };
        $reactive($nbgenReactive).attach($rootScope)
        $nbgenReactive.autorun(function() {
            this.$currentUserId = Meteor.userId();
        }.bind($nbgenReactive));


    })
    .run(($tmvInputSettings) => {
        'ngInject';

        $tmvInputSettings.RED_INDICATOR = true;     // turn the red indicator for invalid input on
    })
    // for configuring application color theme
    .config(($mdThemingProvider) => {
        'ngInject';
        const paletteSet = {
            "primary": {
                default: "indigo",
                darkHues: {
                    default: "50",
                    'hue-1': "100",
                    'hue-2': "200",
                    'hue-3': "300",
                },
                lightHues: {
                    default: "800",
                    'hue-1': "700",
                    'hue-2': "600",
                    'hue-3': "500",
                }
            },
            "accent": {
                default: "amber",
                darkHues: {
                    default: "A200",
                    'hue-1': "A100",
                    'hue-2': "A400",
                    'hue-3': "A700",
                },
                lightHues: {
                    default: "500",
                    'hue-1': "300",
                    'hue-2': "800",
                    'hue-3': 'A100',
                }
            },
            "warn": {
                default: "red",
                darkHues: {
                    default: "50",
                    'hue-1': "A100",
                    'hue-2': "100",
                    'hue-3': "300",
                },
                lightHues: {
                    default: "A400",
                    'hue-1': "800",
                    'hue-2': "900",
                    'hue-3': 'A200',
                }
            },
            "background": {
                default: "grey",
                darkHues: {
                    default: "50",
                    'hue-1': "A100",
                    'hue-2': "100",
                    'hue-3': "300",
                },
                lightHues: {
                    default: "A400",
                    'hue-1': "800",
                    'hue-2': "900",
                    'hue-3': 'A200',
                }
            }
        };

        const appTheme = nbgenAppConfig.colorTheme;
        const secondaryAppTheme = nbgenAppConfig.secondaryColorTheme;

        // define 2 themes: 'light' & 'dark'
        let lightTheme = $mdThemingProvider.theme('default'),
            darkTheme = $mdThemingProvider.theme('dark');

        darkTheme.dark();

        let secondaryTheme, secondaryDarkTheme;
        if (secondaryAppTheme) {
            secondaryTheme = $mdThemingProvider.theme('secondary');
            secondaryDarkTheme = $mdThemingProvider.theme('secondaryDark');
            secondaryDarkTheme.dark();
        }

        _.each(paletteSet, (v, k) => {
            if (appTheme[k]) {
                lightTheme[`${k}Palette`](appTheme[k] || v.default, v.lightHues);
                darkTheme[`${k}Palette`](appTheme[k] || v.default, v.darkHues);
            }
            if (secondaryAppTheme && secondaryAppTheme[k]) {
                secondaryTheme[`${k}Palette`](secondaryAppTheme[k] || v.default, v.lightHues);
                secondaryDarkTheme[`${k}Palette`](secondaryAppTheme[k] || v.default, v.darkHues);
            }
        });
    })
    // configure i18n for used by app
    .config(($translateProvider) => {
        'ngInject';

        // provide workaround for deprecating function in angular 1.7
        angular.lowercase = text => text.toLowerCase();

        $translateProvider.useSanitizeValueStrategy('sanitizeParameters')
        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: 'i18n/{lang}/{part}.json'
        })

        $translateProvider.preferredLanguage('en');
        $translateProvider.fallbackLanguage(['en']);
        $translateProvider.useCookieStorage();
    })
    // configure routing
    .config(($stateProvider, $urlRouterProvider/*, $locationProvider*/) => {
        'ngInject';

        // this is a workaround for deploying the not on the root path
        // parse the Meteor's absoluteUrl
        // const baseNode = document.createElement('BASE');
        // baseNode.setAttribute('href', Meteor.absoluteUrl());
        // document.getElementsByTagName("HEAD")[0].appendChild(baseNode);

        // $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('site', {
                abstract: true,
                resolve: {
                }
            })
            .state('secureContent', {
                abstract: true,
                parent: 'site',
            })
    })
    .config(($mdGestureProvider) => {
        'ngInject';
        $mdGestureProvider.skipClickHijack();
    })
    .constant('$nbgenAppConfig', nbgenAppConfig)
    // for upgrade to ng 1.6
    .config(($locationProvider) => {
        'ngInject';
        $locationProvider.hashPrefix('');
    })
    .config(function($compileProvider) {
        'ngInject'
        $compileProvider.preAssignBindingsEnabled(true);
    })
    .config(function($qProvider) {
        'ngInject'
        $qProvider.errorOnUnhandledRejections(false);
    })

