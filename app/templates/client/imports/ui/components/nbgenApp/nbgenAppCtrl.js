import angular from 'angular'

// for parsing browser's userAgent
import detect from '../../misc/detect.js'

import nbgenAppConfig from './nbgenAppConfig.js'
import nbgenAppMenu from './nbgenAppMenu.js'

import {Countries} from '/imports/common/countries/collection.js'

const loginState = 'nbgenLogin',
    signupState = 'nbgenSignup'


export default class NbGenAppCtrl {
    constructor($scope, $mdMedia, $mdSidenav, $reactive, $translate, $state,
        $translatePartialLoader, $nbgenIdentityService, $nbgenAuthProviderService,
        $tmvUiUtils, $timeout, $authUiService, $rootScope) {
        'ngInject';

        $reactive(this).attach($scope)
        this.$mdMedia = $mdMedia
        this.$mdSidenav = $mdSidenav
        this.$scope = $scope
        this.$state = $state

        this.$identityService = $nbgenIdentityService
        this.$authProviderService = $nbgenAuthProviderService
        this.$tmvUiUtils = $tmvUiUtils
        this.$timeout = $timeout
        this.$translate = $translate
        this.$authUiService = $authUiService
        this.$config = nbgenAppConfig
        this.$rootScope = $rootScope

        $rootScope.$authService = $nbgenAuthProviderService
        $rootScope.$identityService = $nbgenIdentityService

        this.$detect = detect

        // load the initial languages
        $translatePartialLoader.addPart('global')
        $translatePartialLoader.addPart('language')
        $translate.refresh().then(() => this.requiredResourcesLoaded = true, () => this.requiredResourcesLoaded = false)

        // application menu
        this.nbgenAppMenu = nbgenAppMenu

        this.checkMenuItemAccess = (menuItem) => {
            if (this.$identityService && angular.isDefined(menuItem.rolesAllowed)) {
                let roles;
                if (angular.isString(menuItem.rolesAllowed)) {
                    if (menuItem.rolesAllowed == '') return true;
                    roles = menuItem.rolesAllowed.split(",");
                } else if (angular.isArray(menuItem.rolesAllowed)) {
                    roles = menuItem.rolesAllowed;
                }
                if (roles) {
                    return this.$identityService.isInAnyRole(roles);
                }
            }
            return true;
        }

        // subscriptions
        this.subscribe('myAccount') // for getting details of the currently logged-in user
        this.subscribe('countries', () => {
            $rootScope.$$countries = Countries.find({}).fetch()
        })

        // setup for $state transition
        $scope.$on('$stateChangeStart', (event, toState, toStateParams, fromState, fromParams) => { // eslint-disable-line
            $rootScope.toState = toState;
            $rootScope.toStateParams = toStateParams;
            $rootScope.fromState = fromState;
            $rootScope.fromParams = fromParams;
        })

        $scope.$on('$viewContentLoading', function(event, viewConfig) { // eslint-disable-line

        });

        $scope.$on('$viewContentLoaded', function(event) { // eslint-disable-line

        })

        $scope.$on('$stateChangeError', function(event, toState, toStateParams, fromState, fromParams, error) {
            if (!error) return;     // just ignore if there's no error

            if (error.reason && error.reason === 'tx:responseErrors.401') {
                // redirect to home page
                $state.go('home', {}, {location: 'replace'})
            } else if (error.url === '/nbgenLogin' && error.name === 'nbgenLogin') {
                // redirection to login page
                $state.go(error.name, {}, {location: false})
            } else {
                $tmvUiUtils.error(error);
            }
        })

        $scope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams){ // eslint-disable-line
            // probably not implemented yet.
            $tmvUiUtils.error('tx:global.messages.notImplemented')

            event.preventDefault();
        })

        $scope.$on('$stateChangeSuccess',  function(event, toState, toParams, fromState, fromParams) { // eslint-disable-line

        })
    }

    /**
     * Open/close sidenav
     * @param  {String} componentId id of the sidenav component
     * @return {Promise}             resolves after sidenav is finally closed/opened
     */
    toggleSidenav(componentId) {
        if (!componentId) componentId = 'left-sidenav'
        return this.$mdSidenav(componentId).toggle()
    }

    gotoLogin() {
        this.$state.go(loginState)
    }

    gotoSignup() {
        this.$state.go(signupState)
    }

    performLogout() {
        this.$tmvUiUtils.showWaitDialog()
        this.$authProviderService.logout()
            .finally(() => {
                this.$tmvUiUtils.hideWaitDialog()
                this.$state.go('home', {})
            })
    }
}

