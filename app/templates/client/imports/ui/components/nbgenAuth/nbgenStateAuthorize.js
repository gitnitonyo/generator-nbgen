import angular from 'angular'

import nbgenAuth from './nbgenAuth.js'

const serviceName = '$nbgenStateAuthorize'
const loginStateName = 'nbgenLogin'

angular.module(nbgenAuth)
.factory(serviceName, ($state, $nbgenIdentityService, $q, $rootScope) => {
    'ngInject';

    return nbgenStateAuthorizeFn

    function nbgenStateAuthorizeFn() {
        return $q(_fn)

        function _fn(resolve, reject) {
            const toState = $rootScope.toState
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
                        resolve()
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
