import angular from 'angular'

import _ from 'underscore';

// for parsing browser's userAgent
import { nbgenDetect as detect } from '../../components/nbgenComponents';

import nbgenAppConfig from './nbgenAppConfig.js'
import nbgenAppMenu from './nbgenAppMenu.js'

import { appRoles } from '../../../common/app.roles';

import { ApplicationParameters } from '../../../common/applicationParameters/collection';

import { Meteor } from '../../components/nbgenComponents';
import { TimeSync } from '../../components/nbgenComponents';

const loginState = 'nbgenLogin'

const supportedBrowsers = [{
    family: "Chrome",
    major: 49,
    minor: 0
}, {
    family: "Safari",
    major: 9,
    minor: 1
}, {
    family: "Chrome Mobile",
    major: 49,
    minor: 0
}, {
    family: "Mobile Safari",
    major: 9,
    minor: 0
}, {
    family: "Firefox",
    major: 47,
    minor: 0
}, {
    family: "IE",
    major: 11,
    minor: 0
}, {
    family: "Edge",
    major: 13,
    minor: 0
}, {
    family: "Firefox Mobile",
    major: 47,
    minor: 0
}, {
    family: "Opera Mobile",
    major: 0,
    minor: 0
}, {
    family: "Opera Mini",
    major: 0,
    minor: 0
}, {
    family: "Opera",
    major: 0,
    minor: 0
}];


export default class NbGenAppCtrl {
    constructor($scope, $mdMedia, $mdSidenav, $reactive, $translate, $state,
        $translatePartialLoader, $nbgenIdentityService, $nbgenAuthProviderService,
        $tmvUiUtils, $timeout, $authUiService, $rootScope, Language, $tmvUiData, $nbgenChat) {
        'ngInject';

        $reactive(this).attach($scope)
        this.$mdMedia = $mdMedia
        this.$mdSidenav = $mdSidenav
        this.$scope = $scope;
        this.$state = $state;

        this.$identityService = $nbgenIdentityService;
        this.$authProviderService = $nbgenAuthProviderService;
        this.$tmvUiUtils = $tmvUiUtils;
        this.$timeout = $timeout;
        this.$translate = $translate;
        this.$authUiService = $authUiService;
        this.$config = nbgenAppConfig;
        this.$rootScope = $rootScope

        this.$nbgenLanguage = Language;
        this.$tmvUiData = $tmvUiData;

        this.$nbgenChat = $nbgenChat;

        this.$translate = $translate;
        this.$translatePartialLoader = $translatePartialLoader;

        $rootScope.$authService = $nbgenAuthProviderService
        $rootScope.$identityService = $nbgenIdentityService

        this.$detect = detect;

        this.$isCordova = Meteor.isCordova;
        this.$absoluteUrl = Meteor.absoluteUrl();

        // application menu
        this.nbgenAppMenu = nbgenAppMenu

        this.checkMenuItemAccess = (menuItem) => {
            if (this.$identityService && this.$identityService.isInAnyRole([appRoles.TMP_ROLE])) {
                return false; // don't allow menu access if user info has not been completed
            }
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

        // setup application parameters
        this._processApplicationParameters();

        this._processCurrentUser();

        this._processUserLanguage();

        this._processServerTime();
    }

    _processUserLanguage() {
        this.autorun(() => {
            this.getReactively('$currentUser');
            if (!this.$currentUser) {
                // set language to the english by default
                this.$currentLanguage = 'en';
            } else {
                const userLanguage = this.$currentUser.profile && this.$currentUser.profile.lang || 'en';
                if (userLanguage !== this.$currentLanguage) {
                    this.$currentLanguage = userLanguage;
                }
            }
        })

        this.autorun(() => {
            // automatically adjust language
            const lang = this.getReactively('$currentLanguage');
            if (lang) {
                this.$translate.use(lang);
            }
        })
    }

    _processCurrentUser() {
        // subscribe to own account so own user info will be retrieve from the server
        this.subscribe('myAccount') // for getting details of the currently logged-in user
        this.autorun(() => {
            this.$currentUser = Meteor.user();
        });
    }

    _processServerTime() {
        this.autorun(() => {
            // update every 5 seconds
            let serverTime = TimeSync.serverTime(null, 5000)
            this.$serverDateTime = (serverTime && new Date(serverTime)) || new Date();
        });
    }

    _processApplicationParameters() {
        this.subscribe('$applicationParameters');
        this.autorun(() => {
            this.$applicationParameters = ApplicationParameters.find({}).fetch()[0];
            if (this.$applicationParameters) {

                this.$$currentAppVersion = this.$applicationParameters.version;
            }
        })
    }

    _processRequiredResources() {
        const promises = [];
        // preload images
        promises.push(this.$tmvUiUtils.loadImages(this.$config.imagesToPreload));
        promises.push(this.$tmvUiUtils.loadImages(this.$config.applicationBgs));

        // load initial language files
        this.$translatePartialLoader.addPart('global');
        this.$translatePartialLoader.addPart('language');
        this.$translatePartialLoader.addPart('appRoles');       // list of roles
        this.$translatePartialLoader.addPart('nbgenApp/nbgenMenu');      // menu

        promises.push(this.$translate.refresh());

        Promise.all(promises)
            .then(() => {
                this.requiredResourcesLoaded = true;
            }, (err) => {
                console.log(err);
                this.requiredResourcesLoaded = false;
            })
            .finally(() => {
                angular.element('body').addClass('nbgen-app-resources-processed');
            });
    }

    $onInit() {
        this.$$userAgent = this.$detect.parse(navigator.userAgent);
        const that = this;

        // check browser is supported
        this.$$browserSupported = !!(_.find(supportedBrowsers, (item) => {
            const browserDetails = that.$$userAgent.browser
            return browserDetails.family.toLowerCase().indexOf(item.family.toLowerCase()) >= 0 &&
                (!browserDetails.major || browserDetails.major >= item.major) &&
                (!browserDetails.minor || browserDetails.minor >= item.minor)
        }))


        this._processRequiredResources();

        this.$nbgenLanguage.getCurrent().then((lang) => {
            this.$currentLanguage = lang;
        })


        this.$rootScope.$nbgenApp = this;
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

    sideNavHref(sideNavId, sref, srefParams, srefOptions) {
        if (sideNavId && !this.$mdSidenav(sideNavId).isLockedOpen()) {
            return this.$mdSidenav(sideNavId).close().finally(() => {
                this.$state.go(sref, srefParams, srefOptions);
            })
        }

        return this.$state.go(sref, srefParams, srefOptions);
    }

    gotoLogin() {
        this.$state.go(loginState);
    }

    performLogout() {
        this.$tmvUiUtils.showWaitDialog()
        this.$state.go('home', {})
        this.$timeout(() => {
            this.$authProviderService.logout()
                .finally(() => {
                    this.$tmvUiUtils.hideWaitDialog()
                })
        });
    }

    canChangePassword() {
        const user = Meteor.users.findOne(Meteor.userId())
        if (user && user.services) return (!user.services.google && !user.services.twitter && !user.services.facebook);
    }

    changeLanguage() {
        const formModel = {
            language: this.$currentLanguage
        };

        const languages = [];

        this.$nbgenLanguage.getAll().then((langs) => {
            langs.forEach((lang) => {
                languages.push({
                    code: lang,
                    description: this.$translate.instant(`language.${lang}`),
                })
            })
        })

        this.$tmvUiData.formDialog({
            title: 'global.menu.language',
            formModel,
            formSchema: this.$tmvUiData.wrapsFieldsToFormLayout([{
                fieldName: 'language',
                fieldInputType: 'select',
                fieldOptions: 'vm.languages',
                fieldOptionsLabel: 'description',
                fieldOptionsValue: 'code'
            }], 'global.menu'),
            okLabel: 'global.common.ok',
            locals: {
                languages
            }
        }).then((formModel) => {
            this.$currentLanguage = formModel.language;
            // update user's language preference
            Meteor.users.update({ _id: Meteor.userId() }, { $set: { 'profile.lang': this.$currentLanguage } });
        })
    }

    isAdmin() {
        return this.$identityService.isInAnyRole([appRoles.SUPER_ADMIN, appRoles.USER_ADMIN]);
    }

    mainContentStyle() {
        if (this.$config.applicationBgs.length > 0) {
            return {
                backgroundImage: `url('${this.$config.applicationBgs[0]}')`
            }
        }
    }

    mainContentClass() {
        if (this.$config.applicationBgs.length > 0) {
            return "nbgen-background-image";
        }
    }

    isAuthenticated() {
        return this.$identityService.isAuthenticated()
    }

    /**
     * Returns true if config is for horizontal menu
     */
    isHorizontalMenu() {
        return this.$config.isHorizontalMenu
    }

    /**
     * Switch to hide menu
     */
    hideSideMenu() {
        return this.$state.current.name === 'nbgenRegister' || this.isHorizontalMenu()
    }
}
