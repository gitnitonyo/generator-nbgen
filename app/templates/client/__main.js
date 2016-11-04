/**
 * This is the entry point for the client app
 */

import angular from 'angular'
import { Meteor } from 'meteor/meteor'

import nbgenApp from './imports/ui/components/nbgenApp/nbgenApp.js';

import './imports/imports.js';

const origOnLoad = window.onload
window.onload = function(event) {
    // call the original onload fn
    origOnLoad && origOnLoad(event)
    angular.element('body').addClass('loaded')

    // let's remove the loader from the dom tree after 2s
    setTimeout(function() {
        angular.element('#loader-wrapper.tmv-loading').remove();
    }, 2000)
}

const name = '<%= configOptions.angularAppName %>';
export default name;

angular.module(name, [
    nbgenApp,
])

function onReady() {
    angular.bootstrap(document, [name], { strictDi: true })
}

if (Meteor.isCordova) {
    window.$$isMobile = true // globally set for checking
    angular.element(document).on('deviceready', onReady)
} else {
    angular.element(document).ready(onReady)
}
