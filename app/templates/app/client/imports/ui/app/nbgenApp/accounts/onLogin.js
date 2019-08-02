/**
 * Routines executed when a user has login
 */
// import { Meteor } from '/client/imports/ui/components/nbgenComponents';

// import angular from 'angular';

// import moduleName from '../nbgenApp.js';
// import { appRoles } from '/imports/common/app.roles.js';

// const registerState = 'nbgenRegister';

// angular.module(moduleName).run(handleLogin);


// function handleLogin($state, $timeout, $nbgenAuthProviderService, $tmvUiUtils, $reactive,
//     $rootScope, $nbgenIdentityService) {
//     'ngInject';

//     $reactive(this).attach($rootScope);

//     this.autorun(() => {
//         // stop any pending autorun for jobs completion
//         const loggedInUser = Meteor.user();
//         if (loggedInUser === undefined) return;     // user hasn't been initialized yet

//         if (!loggedInUser) {
//             $timeout(() => $state.go('home'));
//             return;     // no one's logged in
//         }

//         if (loggedInUser && $nbgenIdentityService.isInRole(appRoles.SUPER_ADMIN)) return;

//         if (loggedInUser.emails && loggedInUser.emails[0].verified !== true) {
//             if ($state.current.name !== registerState) $timeout(() => $state.go(registerState));
//             return;
//         }

//         if (loggedInUser.profile.pendingInfo !== false) {
//             if ($state.current.name !== registerState) $timeout(() => $state.go(registerState));
//             return;
//         }

//         // retrieve info of the currently logged in user
//         if (loggedInUser.profile.pendingApproval === true) {
//             // user accounts still need approval
//             $nbgenAuthProviderService.logout();
//             $timeout(() => {
//                 $tmvUiUtils.alert('tx:global.login.accountsNeedApproval');
//             })
//             return;
//         }
//         if (loggedInUser.profile.isApproved === false) {
//             $nbgenAuthProviderService.logout();
//             $timeout(() => {
//                 $tmvUiUtils.alert('Your account was not approved.<br/>' + loggedInUser.profile.approvalComments);
//             })
//             return;
//         }
//     })
// }

