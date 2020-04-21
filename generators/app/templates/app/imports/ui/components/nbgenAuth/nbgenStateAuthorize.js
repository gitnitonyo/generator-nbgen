import angular from 'angular'
import _ from 'underscore';

import { Meteor } from '../nbgenMeteor';
import { Tracker } from '../nbgenMeteor';

import nbgenAuth from './nbgenAuth.js'

const serviceName = '$nbgenStateAuthorize'
const loginStateName = 'nbgenLogin'

angular.module(nbgenAuth)
// override behaviour of $state.transitionTo
.config(($provide) => {
    'ngInject'

    $provide.decorator('$state', _decoratorFn);

    // override transition to provide security based
    // on configured roles for the specified state route
    function _decoratorFn($delegate, $nbgenIdentityService, $rootScope, $nbgenWaitDialog) {
        'ngInject';

        // let's locally use 'state' name
        let state = $delegate;

        // let's extend this object with new function
        state.baseTansitionTo = state.transitionTo;

        function _resolveUserIdentity() {
            return new Promise((_resolve) => {
                Tracker.autorun((ctx) => {
                    const currentUser = Meteor.user();
                    if ( currentUser !== undefined ) {
                        // stop if no user is logged in or if roles for user has been resolved
                        if (currentUser === null || currentUser.roles) {
                            ctx.stop();
                            _resolve();
                        }
                    }
                })
            })
        }

        // define a state.gotoPrevious function
        state.gotoPrevious = function() {
            if (state.previousState && !state.previousState.abstract) {
                return state.go(state.previousState, state.previousParams);
            } else {
                return state.go('home');
            }
        }


        // assign new 'go', right now decorating the old 'go'
        state.transitionTo = function (to, params, options) {
            return new Promise((_resolve, _reject) => {
                $nbgenWaitDialog.showDialog();
                let toState = to;
                if (angular.isString(toState)) {
                    toState = this.get(to);
                }

                let optionsToUse = _.extend({}, options);
                // if (Meteor.isProduction && !_.isEmpty(params)) {
                //     // do not replace location if there are parameters
                //     _.extend(optionsToUse, {location: false});
                // }
                if (Meteor.isProduction) {
                    // do not replace location bar
                    _.extend(optionsToUse, {location: false});
                }

                // check if route has role restrictions
                if (toState && toState.data && toState.data.roles && toState.data.roles.length > 0) {
                    _resolveUserIdentity().then(() => {
                        if (!$nbgenIdentityService.isInAnyRole(toState.data.roles)) {
                            if ($nbgenIdentityService.isAuthenticated()) {
                                // not authorize to access the destination state
                                const errorData = {reason: 'tx:responseErrors.401', data: toState};
                                $nbgenWaitDialog.hideDialog();
                                _reject(errorData);
                                // simulate the state change error
                                $rootScope.$broadcast('$nbgenStateUnauthorized', errorData);
                            } else {
                                // not authenticated
                                const loginState = this.get(loginStateName)
                                // there should always be a login state
                                if (!loginState.data) loginState.data = { };
                                loginState.data.returnToState = toState;
                                loginState.data.returnToStateParams = params;
                                loginState.data.returnToStateOptions = options;
                                this.baseTansitionTo(loginState, undefined, {location: false})
                                    .then((d) => _resolve(d), (e) => _reject(e))
                                    .finally(() => $nbgenWaitDialog.hideDialog());
                            }
                        } else {
                            // usual processing
                            this.baseTansitionTo(toState, params, _.extend({}, optionsToUse))
                                .then((d) => _resolve(d), (e) => _reject(e))
                                .finally(() => $nbgenWaitDialog.hideDialog());
                        }
                    })
                } else if (toState) {
                    // usual processing
                    this.baseTansitionTo(toState, params, optionsToUse)
                        .then((d) => _resolve(d), (e) => _reject(e))
                        .finally(() => $nbgenWaitDialog.hideDialog());
                } else {
                    $nbgenWaitDialog.hideDialog();
                    _reject("This is not implemented yet.");
                    $rootScope.$broadcast('$nbgenStateNotImplemented');
                }
            })
        };

        return $delegate;
    }
})
.run(($rootScope, $state, $tmvUiUtils) => {
    'ngInject';

    // keeps the connection status and store in $rootScope
    Tracker.autorun(() => {
        $rootScope.__mtrConnectionStatus = Meteor.status();
    });

    _setupStateEvents();

    function _setupStateEvents() {
        // setup $state events
        $rootScope.$on('$stateChangeStart', (event, toState, toStateParams, fromState, fromParams) => { // eslint-disable-line

        })

        $rootScope.$on('$viewContentLoading', function(event, viewConfig) { // eslint-disable-line

        });

        $rootScope.$on('$viewContentLoaded', function(event) { // eslint-disable-line

        })

        $rootScope.$on('$stateChangeError', function(event, toState, toStateParams, fromState, fromParams, error) {
            if (!$rootScope.__mtrConnectionStatus.connected) {
                $tmvUiUtils.error("You are not connected to the server.");
            } else {
                if (!error) return;     // just ignore if there's no error

                if (error.reason && error.reason === 'tx:responseErrors.401') {
                    // redirect to home page
                    $tmvUiUtils.error("Unauthorized");
                } else if (error.url === '/nbgenLogin' && error.name === 'nbgenLogin') {
                    // redirection to login page
                    $state.go(error.name, {}, {location: false})
                } else {
                    $tmvUiUtils.error(error);
                }
            }

        });

        $rootScope.$on('$nbgenStateUnauthorized', () => {
            $tmvUiUtils.error("Unauthorized access");
            $state.go('home');
        });

        $rootScope.$on('$nbgenStateNotImplemented', () => {
            $tmvUiUtils.error('tx:global.messages.notImplemented');
        })

        $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams){ // eslint-disable-line
            // probably not implemented yet.
            $tmvUiUtils.error('tx:global.messages.notImplemented')

            event.preventDefault();
        })

        $rootScope.$on('$stateChangeSuccess',  function(event, toState, toParams, fromState, fromParams) { // eslint-disable-line
            $state.previousState = fromState;
            $state.previousParams = fromParams;
        })
    }
})
// deprecated
.factory(serviceName, ($state, $nbgenIdentityService, $rootScope) => {
    'ngInject';

    return nbgenStateAuthorizeFn

    function nbgenStateAuthorizeFn() {

        return new Promise(_fn);

        function _fn(resolve, reject) {
            let toState = $rootScope.toState;
            if (toState && toState.data && toState.data.roles && toState.data.roles.length > 0) {
                if (!$nbgenIdentityService.isInAnyRole(toState.data.roles)) {
                    if ($nbgenIdentityService.isAuthenticated()) {
                        // not authorize to access the destination state
                        reject({reason: 'tx:responseErrors.401', data: toState})
                    } else {
                        // not authenticated
                        $rootScope.returnToState = $rootScope.toState;
                        $rootScope.returnToStateParams = $rootScope.toStateParams;

                        const loginState = $state.get(loginStateName)
                        // there should always be a login state
                        if (!loginState.data) loginState.data = { };
                        loginState.data.returnToState = $rootScope.returnToState;
                        loginState.data.returnToStateParams = $rootScope.returnToStateParams;
                        reject({'reason': 'tx:responseErrors.401', data: toState});
                    }
                } else {
                    resolve()
                }
            } else {
                resolve()
            }
        }
    }
})
