/**
 * Angular module for encapsulating meteor-specific services
 */
import angular from 'angular';
import ngMeteor from 'angular-meteor';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { Roles } from 'meteor/alanning:roles';
import { Tracker } from 'meteor/tracker';
import { Mongo } from 'meteor/mongo';
import { TimeSync } from 'meteor/mizzao:timesync';

/* do not import module from meteor/ on the client side so we can use babel */

const moduleName = 'nbgenMeteor';

export default moduleName;

angular.module(moduleName, [
    ngMeteor
])
    .factory('$Meteor', () => Meteor)
    .factory('$Accounts', () => Accounts)
    .factory('$Counts', () => Counts)
    .factory('$Roles', () => Roles)
    .factory('$Tracker', () => Tracker)
    .factory('$Mongo', () => Mongo)
    .factory('$TimeSync', () => TimeSync)
    .run(($rootScope, $reactive/* , $Meteor, $timeout, $tmvUiUtils */) => {
        'ngInject';
        $reactive(this).attach($rootScope);

        // this.autorun(() => {
        //     if ($Meteor.isCordova && (window.device && window.device.platform.toLowerCase() === 'android') && window.Reload && window.Reload.isWaitingForResume() === true) {
        //         $timeout(() => {
        //             if ($Meteor.isDevelopment) {
        //                 window.location.reload(true);
        //             } else {
        //                 $tmvUiUtils.confirm('There is a new version of this app. Would you want to reload the app?')
        //                     .then(() => {
        //                         window.location.reload(true);
        //                     })
        //             }
        //         })
        //     }
        // })
    });

export { Meteor, Accounts, Counts, Roles, Tracker, Mongo, TimeSync };
