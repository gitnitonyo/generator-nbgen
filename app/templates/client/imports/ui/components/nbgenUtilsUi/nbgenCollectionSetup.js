import angular from 'angular'
import {Meteor} from 'meteor/meteor'
import {Mongo} from 'meteor/mongo'

import {appRoles} from '/imports/common/app.roles.js'

import _s from 'underscore.string'
import _ from 'underscore'

const baseModuleName = 'nbgenApp'

export default function(options) {
    /**
     * options can be:
     * `name` - required; base name to use
     *          - s.captialize(name) will be used as serviceName to get the Mongo collection
     *          - s.capitalize(name) + 'Controller' will be the name of the controller to be constructed
     *          - template will be determined by `views/app/${name}/${name}.html`
     * `moduleName` - required;the module name to use to create the angular servies/controllers/config
     * `routeFn` - override the routingFn config function
     * `controllerFn` - override the controllerFn
     * `functions` - an object where each properties is a function which can override the behaviour of
     *                tmvCollection directive; careful - must understand how tmvCollection behaves to override
     *                the overriden functions will still be available in $$functionName;
     *                all functions will be bound to the controller of tmvCollection, so you have access to
     *                the tmvCollection properties
     *      `handleSearch` - for composing the filter to used for searching, searchString is passed
     *      `detailsViewing` - activate the viewing of details; work with the template used
     *      `cancelDetailsViewing` - deactiveate the viewing of details
     *      `itemSelected` - executed when a item is selected
     *      `closeDetailsView` - executed when close icon is pressed
     *      `editSelected` - executed when edit pencil icon is pressed
     *      `createItem` - executed when create fab is pressed
     *      `saveDetails` - executed when save icon is pressed; must check viewMode to determine if for creating, updating
     *      `confirmDelete` - executed when delete icon is pressed
     *      `insertDoc` - called when inserting a document into the collection
     *      `updateDoc` - called when updating a document
     *      `removeDoc` - called when removing a document
     *
     * `hideEdit` - whether to hide or show the edit button; (function or boolean)
     * `hideDelete` - whether to hide or show the delete button; (function or boolean)
     * `hideAction` - whether to hide or show the action are containing edit and delete icon
     * `titleDisplay` - string or function to determine the title string to display in title area
     * `displaySearch` - boolean or function to determine if to display the search box in search area
     * `searchTemplate` - override the template to used for search box
     * `template` - override the template to used
     * `preListTemplate` - to display before the list
     * `postListTemplate` - to display after the list
     * `preFormTemplate` - to display before the form
     * `postFormTemplate` - to display after the form
     * `i18nPart` - override the i18n part file to
     * `i18nAddition` - additional i18n part t load
     * `rolesAllowed` - roles allowed to access the constructed route/state
     * `serviceName` - override the service name to used for mongo collection
     * `controllerName` - override the controller name to used
     */
    const name = options.name
    const collectionName = options.collectionName || name
    const stateName = options.stateName || name
    const moduleName = options.moduleName || baseModuleName
    const serviceName = options.serviceName || _s.capitalize(name)
    const controllerName = options.controllerName || serviceName + 'Controller'
    const template = options.template
    const i18nPart = options.i18nPart || `${baseModuleName}/${name}`
    const routeFn = options.routeFn || _routeFn
    const controllerFn = options.controllerFn || _controllerFn
    const rolesAllowed = options.rolesAllowed
    const resolveFns = options.resolveFns || { }
    resolveFns.translatePartialLoader = _translatePartialLoader
    let i18nAddition = [];
    if (options.i18nAddition) {
        if (angular.isString(options.i18nAddition)) {
            i18nAddition = [options.i18nAddition]
        } else if (angular.isArray(options.i18nAddition)) {
            i18nAddition = options.i18nAddition
        }
    }

    const mongoCollection = options.collectionInstance || (collectionName === 'users' ? Meteor.users : new Mongo.Collection(collectionName))

    angular.module(moduleName)
        .factory(serviceName, serviceFn)
        .config(routeFn)
        .controller(controllerName, controllerFn)

    function serviceFn() {
        'ngInject'
        if (serviceName === 'Users') {
            return Meteor.users;
        }

        return mongoCollection
    }

    /**
     * Routing configuration for `vendors`
     * @param $stateProvider
     * @param USER_ROLES
     */
    function _routeFn($stateProvider) {
        'ngInject'

        $stateProvider
            .state(stateName, {
                parent: 'secureContent',
                url: `/${stateName}/:extra`,
                views: {
                    'content@': {
                        template,
                        controller: `${controllerName} as $ctrl`
                    }
                },
                data: {
                    roles: rolesAllowed || [ appRoles.NORMAL_USER ],
                    pageTitle: `${name}.home.title`
                },
                resolve: resolveFns
            })
    }

    function _translatePartialLoader($translate, $translatePartialLoader) {
        'ngInject'

        $translatePartialLoader.addPart(i18nPart);
        i18nAddition.forEach((i18n) => {
            $translatePartialLoader.addPart(i18n);
        })
        return $translate.refresh();
    }

    _controllerFn.$inject = ['$scope', '$injector']
    const _resolveFnKeys = _.keys(resolveFns)
    _resolveFnKeys.forEach((k) => _controllerFn.$inject.push(k))
    function _controllerFn($scope, $injector) {
        const ctrlArgs = arguments
        this.collectionName = serviceName
        this.collection = $injector.get(this.collectionName)
        this.collection.$$options = options     // tmvCollection will used this to get custom options specified
        options.$resolveFns = { }
        _resolveFnKeys.forEach((k, i) => {
            options.$resolveFns[k] = ctrlArgs[i+3]
        })
        this.subscription = options.subscription || name
        this.uiLayout = options.config.uiLayout
        this.translatePrefix = options.translatePrefix || name
        // define any functions you want to be injected into

        this.$scope = $scope
        options.controllerInit && options.controllerInit.apply(this, arguments)
    }
}
