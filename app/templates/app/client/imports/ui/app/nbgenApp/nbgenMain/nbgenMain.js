import angular from 'angular'
import nbgenApp from '..'

// import { appRoles } from '/imports/common/app.roles.js';
import { Meteor } from '/client/imports/ui/components/nbgenComponents';


import template from './nbgenMain.html'

const name = 'nbgenMain'
const i18npart = `${nbgenApp}/${name}`
// const registerState = 'nbgenRegister';

class NbgenMainCtrl {
    constructor($tmvUiUtils, $timeout, $scope, $element, $reactive, $nbgenIdentityService, $state, $interval) {
        'ngInject';

        this.$tmvUiUtils = $tmvUiUtils
        this.$timeout = $timeout
        this.$identityService = $nbgenIdentityService;
        this.$state = $state;
        this.$interval = $interval;
        this.$element = $element;
        $reactive(this).attach($scope);
        this.$backgroundIndex = 0;
        this.applicationMainBg = "./assets/images/application-bg1.jpg";
        this.$meteor = Meteor;
    }

    $onInit() {
        this.$backgroundStyles = [ ];
        this.nbgenApp.$config.applicationBgs.forEach((bg) => {
            this.$backgroundStyles.push({
                opacity: "0",
                backgroundImage: bg
            })
        });

        this.$backgroundStyles[this.$backgroundIndex].opacity = "1";

        // iterate through the background
        // this.$backgroundInterval = this.$interval(() => {
        //     this.$backgroundIndex = (this.$backgroundIndex + 1) % this.nbgenApp.$config.applicationBgs.length;
        //     this.$backgroundStyles.forEach((bgStyle, idx) => {
        //         if (idx === this.$backgroundIndex) {
        //             bgStyle.opacity = "1";
        //         } else {
        //             bgStyle.opacity = "0";
        //         }
        //     });
        // }, 5000);
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
        this.$backgroundInterval && this.$interval.cancel(this.$backgroundInterval);
    }

    isAuthenticated() {
        return this.nbgenApp && this.nbgenApp.$identityService.isAuthenticated()
    }

    _gotoState(stateName, stateOperation, stateParams) {
        const state = this.$state.get(stateName);
        if (!state) return;
        if (stateOperation) {
            state.data = state.data || { };
            state.data.stateOperation = stateOperation;
        }
        this.$state.go(state, stateParams);
    }

    $postLink() {

    }
}

// function homeUserCheck($q, $reactive, $rootScope, $state, $timeout, $nbgenIdentityService) {
//     'ngInject';
//     $reactive(this).attach($rootScope);
//     return $q((_resolve, _reject) => {
//         this.autorun((c) => {
//             let user = Meteor.user();
//             if (user === undefined) return;     // user has not been resolved yet
//             c.stop();   // user has been resolved
//             if (user && $nbgenIdentityService.isInRole([appRoles.SUPER_ADMIN])) {
//                 _resolve();
//             } else if (user && user.emails && user.emails[0].verified !== true) {
//                 _reject();
//                 $timeout(() => $state.go(registerState));
//             } else if (user && user.profile.pendingInfo !== false) {
//                 _reject();
//                 $timeout(() => $state.go(registerState));
//             } else {
//                 _resolve();
//             }
//         })
//     })
// }

angular.module(nbgenApp)
// the component
.component(name, {
    template,
    controllerAs: name,
    controller: NbgenMainCtrl,
    require: {
        nbgenApp: '^nbgenApp'
    }
})
.config(function($stateProvider) {
    'ngInject'

    $stateProvider
        .state('home', {
            parent: 'site',
            url: '/',
            data: {
                roles: [ ]
            },
            views: {
                'content@': {
                    template: '<nbgen-main class="app-content" layout="column"></nbgen-main>',
                }
            },
            resolve: {
                translatePartialLoader: ['$translate', '$translatePartialLoader',
                    function ($translate,$translatePartialLoader) {
                        $translatePartialLoader.addPart(i18npart);
                        return $translate.refresh();
                    }],
                // userCheck: homeUserCheck,
            }
        })
})
