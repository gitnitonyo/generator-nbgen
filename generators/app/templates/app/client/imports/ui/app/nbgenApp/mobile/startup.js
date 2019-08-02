import { Meteor } from '/client/imports/ui/components/nbgenComponents';
import angular from 'angular';

import nbgenApp from '../nbgenApp';

let __$state;

angular.module(nbgenApp)
    .run(($state) => {
        'ngInject';
        __$state = $state;
    })


export function cordovaPluginsInit() {
    if (Meteor.isCordova) {
        document.addEventListener("backbutton", function(e) { // eslint-disable-line
            if (__$state && __$state.current && __$state.current.name === 'home') {
                navigator.Backbutton.goBack(function() {
                    // back succeeded
                }, function() {
                    // back failed
                });
            }
        }, false);
    }
}
