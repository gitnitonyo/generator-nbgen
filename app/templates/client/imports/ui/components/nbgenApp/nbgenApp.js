/**
 * Main app
 */

import { Meteor } from 'meteor/meteor'

// npm dependencies
import angular from 'angular'
import ngSanitize from 'angular-sanitize'
import ngAnimate from 'angular-animate'
import ngResource from 'angular-resource'
import ngCookies from 'angular-cookies'
import ngMessages from 'angular-messages'

import ngMaterial from 'angular-material'
import ngMeteor from 'angular-meteor'

import _ from 'underscore'

// angular translate npm modules
import 'angular-translate'
import 'angular-translate-storage-cookie'
import 'angular-translate-storage-local'
import 'angular-translate-loader-partial'

import ngAnimOut from 'angular-ui-router-anim-in-out'

// angular-ui-router
import ngUiRouter from 'angular-ui-router'

import template from './nbgenApp.html'

import nbgenUtilsUi from '../nbgenUtilsUi/nbgenUtilsUi.js'
import nbgenAuth from '../nbgenAuth/nbgenAuth.js'
import nbgenForm from '../nbgenForm/nbgenForm.js'
import nbgenSocial from '../nbgenSocial/nbgenSocial.js'

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
    ngAnimOut,
    nbgenUtilsUi,
    nbgenAuth,
    nbgenForm,
    nbgenSocial,
])
    // main nbgen app component
    .component(name, {
        template,
        controllerAs: name,
        controller: NbGenAppCtrl,
    })
    .run(($rootScope, $reactive) => {
        'ngInject'

        const $nbgenReactive = { };
        $reactive($nbgenReactive).attach($rootScope)
        $nbgenReactive.autorun(function() {
            this.$currentUserId = Meteor.userId();
        }.bind($nbgenReactive))
    })
    // for configuring application color theme
    .config(($mdThemingProvider) => {
        'ngInject';
        const paletteSet = ["primary", "accent", "warn", "background"]
        const appThemes = nbgenAppConfig.appThemes

        _.each(appThemes, (theme, themeName) => {
            const theTheme = $mdThemingProvider.theme(themeName)
            paletteSet.forEach((p) => {
                if (theme[p]) {
                    theTheme[`${p}Palette`](theme[p].palette, theme[p].hues || { "default": "500" })
                }
            })
            if (theme.dark === true) {
                theTheme.dark()
            }
        })
    })
    // configure i18n for used by app
    .config(($translateProvider) => {
        'ngInject';

        $translateProvider.useSanitizeValueStrategy('sanitizeParameters')
        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: 'i18n/{lang}/{part}.json'
        })

        $translateProvider.preferredLanguage('en');
        $translateProvider.fallbackLanguage(['en']);
        $translateProvider.useCookieStorage();
    })
    // configure routing
    .config(($stateProvider, $urlRouterProvider) => {
        'ngInject';

        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('site', {
                abstract: true,
                resolve: {
                    translatePartialLoader: ['$translate', '$translatePartialLoader', function($translate, $translatePartialLoader) {
                        $translatePartialLoader.addPart('global');
                        $translatePartialLoader.addPart('language');
                        $translatePartialLoader.addPart('appRoles');
                        return $translate.refresh();
                    }],
                }
            })
            .state('secureContent', {
                abstract: true,
                parent: 'site',
                resolve: {
                    authorize: ['$nbgenStateAuthorize', ($nbgenStateAuthorize) => {
                        return $nbgenStateAuthorize()
                    }]
                }
            })
    })
