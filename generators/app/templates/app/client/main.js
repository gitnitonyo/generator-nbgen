/**
 * This is the entry point for the client app
 */

import angular from 'angular';
import { Meteor } from 'meteor/meteor';

import nbgenApp from '../imports/ui/app/nbgenApp/nbgenApp';
import '../imports/ui/imports';
import { cordovaPluginsInit } from '../imports/ui/app/nbgenApp/mobile/startup.js';

const name = 'nubevision';
export default name;

const origOnLoad = window.onload
window.onload = function(event) {
    // call the original onload fn
    origOnLoad && origOnLoad(event);
    setTimeout(function() {
        angular.element('body').addClass('loaded');
    }, 500);

    // let's remove the loader from the dom tree after 3s
    setTimeout(function() {
        angular.element('#loader-wrapper').remove();
    }, 3000)
}

angular.module(name, [
    nbgenApp,
])

function onReady() {
    angular.bootstrap(document, [name], { strictDi: true });
    if (Meteor.isCordova) {
        cordovaPluginsInit();
    }
}

if (Meteor.isCordova) {
    window.$$isMobile = true // globally set for checking
    angular.element(document).on('deviceready', onReady)
} else {
    angular.element(document).ready(onReady)
}
