import angular from 'angular'

import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'

import nbgenUtilsUi from './nbgenUtilsUi.js'

import template from './nbgenCollection.html'
import headingTemplate from './nbgenCollection.heading.html'
import headingTemplateList from './nbgenCollection.heading.list.html'
import headingTemplateDetails from './nbgenCollection.heading.details.html'

import _ from 'underscore'

const name = 'tmvCollection'

angular.module(nbgenUtilsUi)
    .directive(name, tmvCollectionDirective)


function tmvCollectionDirective($injector, $tmvUiUtils, $tmvUiData, $Counts, $rootScope,
    $reactive, $translate, $timeout, $tmvUtils, $state, $parse, $interpolate, $q) {
    'ngInject'

    return {
        scope: {
            title: '@', // title to be displayed at the title area
            translatePrefix: '@', // translation prefix to use, if not provided the one in uiLayout is used
            $subscription: '@subscription', // name of subscription where to subscibe
            $collection: '<collection', // the collection object
            $uiLayout: '<uiLayout', // ui layout object contaning list and form layout
            functions: '<', // optional object of functions which will be injected into the controller which can be invoked inside the list or form layout
        },
        restrict: 'E',
        transclude: true,
        template,
        controller: tmvCollectionController,
        bindToController: true,
        controllerAs: 'tmvCollection',
        link: tmvCollectionLinkFn
    }

    function tmvCollectionController($scope, $element) {
        'ngInject'

        let _this = this;
        $scope.$state = $state; // for convenient access
        this.$state = $state
        this.$translate = $translate // for convenient access
        this.$parse = $parse // for convenient access
        this.$injector = $injector
        this.$scope = $scope
        this.$element = $element
        this.$Counts = $Counts
        this.$Meteor = Meteor
        this.$Accounts = Accounts
        $scope.$tmvCollection = this // for convenient access
        this.$rootScope = $rootScope
        this.$q = $q
        this.$interpolate = $interpolate
        this.$tmvUiUtils = $tmvUiUtils
        this.$tmvUiData = $tmvUiData
        this.$tmvUtils = $tmvUtils
        this.$timeout = $timeout
        this.$headingViewTemplate = headingTemplate
        this._ = _ // for convenient access of underscore

        $scope.$ctrl = this // for convenient access in the view

        this.indexAt = (index) => {
            if (index < this.$items.length) return this.$items[index];

            // increment the number of items to loader
            let numItemsToLoad = (Math.floor(index / this.pageSize) + 1) * this.pageSize;
            if (numItemsToLoad != this.numItemsToLoad) {
                this.numItemsToLoad = numItemsToLoad
            }
        }

        this.itemCount = () => {
            return this.$collectionCount;
        }

        // for searching
        this.handleSearch = function(searchString) {
            // construct selectors
            if (_.isEmpty(searchString)) {
                this.searchFilter = {};
                return;
            }

            let selectors = [];
            this.layout.fields.forEach(function(fieldSchema) {
                if (fieldSchema.searchField) {
                    let searchField
                    if (angular.isString(fieldSchema.searchField)) {
                        searchField = [fieldSchema.searchField]
                    } else if (!angular.isArray(fieldSchema.searchField) && fieldSchema.searchField) {
                        searchField = [fieldSchema.fieldName]
                    } else {
                        searchField = fieldSchema.searchField
                    }
                    searchField.forEach((s) => {
                        let selector = {};
                        selector[s] = {
                            $regex: '.*' + searchString + '.*',
                            $options: 'i'
                        };
                        selectors.push(selector);
                    })
                }
            }.bind(this));
            if (selectors.length > 0) {
                if (selectors.length === 1) {
                    this.searchFilter = selectors[0]
                } else {
                    this.searchFilter = { $or: selectors };
                }
            } else {
                this.searchFilter = {};
            }
        };

        // update filter when search text has been changed
        $scope.$watch('tmvCollection.searchText', $tmvUtils.debounce(angular.bind(this, this.handleSearch), 300));

        // executed when an item in the list clicked
        this.detailsViewing = (isDirty) => {
            // $tmvUiUtils.showWaitDialog();
            $timeout(() => {
                this.showDetails = true;
                if (isDirty) {
                    $scope.editForm.$setDirty()
                } else {
                    $scope.editForm.$setPristine();
                }
            }) // .finally($tmvUiUtils.hideWaitDialog)
        }

        this.cancelDetailsViewing = () => {
            this.showDetails = false;
            this.currentItemId = undefined;
            this.viewMode = '';
            $timeout(function() {
                $scope.editForm.$setPristine();
            }.bind(this))
        }

        this.__itemSelected = function(event, item, index) {
            $timeout(() => {
                this.itemSelected(event, item, index)
            })
        }

        this.itemSelected = function(event, item, index) { // eslint-disable-line
            this.viewMode = 'view'
            this.currentItemId = item._id;
            this.detailsViewing();
        };

        this.closeDetailsView = () => {
            return $q((resolve, reject) => {
                if ($scope.editForm.$dirty) {
                    $tmvUiUtils.confirm($translate.instant('global.common.loseChangesConfirmation'))
                        .then(function() {
                            this.cancelDetailsViewing();
                            resolve()
                        }.bind(this), reject)
                } else {
                    this.cancelDetailsViewing();
                    resolve()
                }
            })
        }

        // executed when edit icon is pressed
        this.editSelected = function(event, item, index) { // eslint-disable-line
            // edit button clicked
            this.currentItemId = item._id;
            this.viewMode = 'edit';
            this.detailsViewing();
        }

        // this function can be overriden to provide initialization
        // value when creating an item
        this.initNewItem = function() {

        }

        // executed when creating new document
        this.createItem = function(event) { // eslint-disable-line
            this.$currentItem = this.initNewItem() || {}
            this.viewMode = 'new'

            this.detailsViewing()
        }

        // crud functions
        this.updateDoc = (selector, modifier, options, callback) =>
            this.$collection.update(selector, modifier, options, this.$bindToContext(angular.bind(this, callback)))

        this.insertDoc = (doc, callback) =>
            this.$collection.insert(doc, this.$bindToContext(angular.bind(this, callback)))

        this.removeDoc = (selector, callback) =>
            this.$collection.remove(selector, this.$bindToContext(angular.bind(this, callback)))

        this.__sanitizeItem = function(item) {
            const sanitizeItem = {}
            angular.forEach(item, (value, key) => {
                if (!angular.isFunction(value) && key !== '_id' && !key.startsWith('$$')) {
                    sanitizeItem[key] = value
                }
            })

            return sanitizeItem
        }

        this.saveDetails = (dontCancel, excludeFields, successCb, errorCb) => {
            // save the details
            if (this.viewMode === 'new') {
                // create new doc
                if ($rootScope.$authService) {
                    this.$currentItem.createdBy = $rootScope.$authService.userId();
                }
                $tmvUiUtils.meteorConnectionAdvice().then(() => {
                    this.$currentItem._group = $rootScope.$authService.user().profile._activeGroup
                    let cbResult = this.beforeInsert.call(this, this.$currentItem) || $q.resolve()
                    cbResult.then(() => {
                        this.insertDoc(this.__sanitizeItem(this.$currentItem), (err, _id) => {
                            if (err) {
                                $tmvUiUtils.error(err)
                                errorCb && errorCb.call(this, this.$currentItem)
                            } else {
                                this.$currentItem._id = _id
                                this.afterInsert.call(this, this.$currentItem)
                                successCb && successCb.call(this, this.$currentItem)
                            }
                        })
                        if (dontCancel !== true) this.cancelDetailsViewing()
                    })
                })
            } else if (this.$currentItem._id) {
                // save the updates
                let itemToSave = this.__sanitizeItem(this.$currentItem);
                if ($rootScope.$authService) {
                    itemToSave.modifiedBy = $rootScope.$authService.userId()
                }
                if (excludeFields) {
                    if (angular.isString(excludeFields)) {
                        excludeFields = [excludeFields]
                    }
                    excludeFields.forEach((f) => {
                        if (itemToSave[f]) delete itemToSave[f]
                    })
                }
                $tmvUiUtils.meteorConnectionAdvice().then(() => {
                    let cbResult = this.beforeUpdate.call(this, this.$currentItem, itemToSave) || $q.resolve()
                    cbResult.then(() => {
                        this.updateDoc({ _id: this.$currentItem._id }, { $set: itemToSave }, {}, (err) => {
                            if (err) {
                                $tmvUiUtils.error(err)
                                errorCb && errorCb.call(this, this.$currentItem)
                            } else {
                                this.afterUpdate.call(this, this.$currentItem, itemToSave)
                                successCb && successCb.call(this, this.$currentItem, itemToSave)
                            }
                        })
                        if (dontCancel !== true) this.cancelDetailsViewing()
                    })
                })
            }
        }

        this.confirmDelete = function(event, item) {
            let self = this;
            let confirmMessage = this.$labels.confirmDeleteMessage || `${this.translatePrefix}.home.deleteConfirmation`
            confirmMessage = $translate.instant(confirmMessage)
            $tmvUiUtils.confirm(confirmMessage).then(() => {
                let cbResult = this.beforeRemove.call(this, item) || $q.resolve()
                cbResult.then(() => {
                    self.removeDoc({ _id: item._id }, (err) => {
                        if (err) {
                            $tmvUiUtils.error(err)
                        } else {
                            this.afterRemove.call(this, item)
                        }
                    })
                })
            })
        }

        this.hideEdit = (item) => { // eslint-disable-line
            return false
        }

        this.hideDelete = (item) => { // eslint-disable-line
            return false
        }

        this.hideAction = (item) => { // eslint-disable-line
            return false
        }

        this.hideFormSaveAction = (item) => { // eslint-disable-line
            return false
        }

        this.titleDisplay = () => {
            let result

            if (this.viewMode == 'view' || this.viewMode == 'edit') {
                if (angular.isString(this.formSchema.detailsView)) {
                    result = $interpolate(this.formSchema.detailsView)(this.$currentItem)
                } else {
                    // display the first field in the list
                    if (this.layout && angular.isArray(this.layout.fields) && this.layout.fields.length > 0) {
                        result = $parse(this.layout.fields[0].fieldName)(this.$currentItem)
                    }
                }
            } else if (this.viewMode == 'new') {
                result = this.$translate.instant(this.translatePrefix + '.home.createNew')
            } else {
                result = this.$translate.instant(this.translatePrefix + '.home.title')
            }

            return result || ''
        }

        this.displaySearch = () => {
            return this.hasSearchField
        }

        // can be overriden to provide different
        // ui layout for different user
        this.getLayoutList = function() {
            return this.$uiLayout.listLayout
        }

        // can be overriden to provide different UI layout
        this.getFormSchema = function() {
            return this.$uiLayout
        }


        this.$$injectFn = (fnName, fn) => {
            if (angular.isDefined(fn)) {
                if (angular.isFunction(fn)) {
                    this[fnName] = angular.bind(this, fn)
                } else {
                    this[fnName] = angular.bind(this, function() {
                        return fn
                    })
                }
            }
        }

        // convenient method for checking if current user has the role
        this.$hasRole = function(roles) {
            return this.$rootScope.$identityService.isInRole(roles)
        }

        // process the options passed into this.$collection.$$options
        this.$$processOptions = () => {
            let options = this.$collection.$$options

            // labels
            this.$labels = options.labels || {}

            // action hooks
            this.beforeInsert = this.$collection.$$options.beforeInsert || angular.noop
            this.afterInsert = this.$collection.$$options.afterInsert || angular.noop
            this.beforeUpdate = this.$collection.$$options.beforeUpdate || angular.noop
            this.afterUpdate = this.$collection.$$options.afterUpdate || angular.noop
            this.beforeRemove = this.$collection.$$options.beforeRemove || angular.noop
            this.afterRemove = this.$collection.$$options.afterRemove || angular.noop

            this.$$injectFn('hideEdit', this.$collection.$$options.hideEdit)
            this.$$injectFn('hideDelete', this.$collection.$$options.hideDelete)
            this.$$injectFn('hideAdd', this.$collection.$$options.hideAdd)
            this.$$injectFn('hideAction', this.$collection.$$options.hideAction)
            this.$$injectFn('titleDisplay', this.$collection.$$options.titleDisplay)

            this.$resolveFns = options.$resolveFns

            // inject provided functions
            if (options.functions) {
                angular.forEach(options.functions, function(fn, fnName) {
                    if (this[fnName]) {
                        // there's already a function defined; so save it to $$fnName
                        this['$$_' + fnName] = angular.bind(this, this[fnName])
                    }
                    this[fnName] = angular.bind(this, fn) // inject the specified function
                }.bind(this))
            }

            // process options for hiding actions
            // check if there are services to be injected
            this.$services = {}
            if (angular.isArray(this.$collection.$$options.injectedServices)) {
                angular.forEach(this.$collection.$$options.injectedServices, (serviceName) => {
                    if ($injector.has(serviceName)) {
                        this.$services[serviceName] = $injector.get(serviceName)
                    }
                })
            }

            // check if there any declared locals
            if (angular.isObject(options.locals)) {
                angular.forEach(options.locals, (value, key) => {
                    if (angular.isFunction(value)) {
                        this[key] = angular.bind(this, value)
                    } else {
                        this[key] = value
                    }
                })
            }
        }

        // default headers and footers view
        this.tmvCollectionHeadingListView = headingTemplateList
        this.tmvCollectionHeadingDetailsView = headingTemplateDetails

        this.$$processOptions()

        // offer confirmation before leaving this route
        let unregister = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
            if ($scope.editForm.$dirty) {
                $tmvUiUtils.hideWaitDialog() // if not called blocking progress bar appears
                event.preventDefault(); // cancel routing and offer to confirm
                $tmvUiUtils.confirm($translate.instant('global.common.loseChangesConfirmation'))
                    .then(function() {
                        unregister();
                        options = options || { location: 'replace' };
                        // TODO: hopefully options get passed as 5th option
                        $state.transitionTo(toState, toParams, options);
                    }.bind(this))
            }
        })

        // setup properties and variables

        this.subsReady = false

        $reactive(this).attach($scope); // make the context reactive

        // UI configuration should be in *_UI
        this.formSchema = this.getFormSchema()
        if (!this.translatePrefix) {
            this.translatePrefix = this.formSchema.translatePrefix;
        }
        this.layout = this.getLayoutList()

        // check if there's at least 1 search field
        this.hasSearchField = false;
        if (this.layout && angular.isArray(this.layout.fields)) {
            this.hasSearchField = !_.isEmpty(_.find(this.layout.fields, function(field) {
                return field.searchField === true || angular.isString(field.searchField) || angular.isArray(field.searchField)
            }))
        }

        // define reactive variables
        if (angular.isObject(this.layout.initialSort)) {
            this.sort = this.layout.initialSort
        } else {
            // make the first field defined in the layout to be the initial sort
            this.sort = {}
            if (this.layout && this.layout.fields.length > 0) {
                this.sort[this.layout.fields[0].fieldName] = 1;
            }
        }

        this.searchText = '' // will be reactive in the tmvCollection directive
        this.pageSize = 30
        this.numItemsToLoad = this.pageSize
        this.filter = {}
        this.specialFilter = {}
        this.searchFilter = {}

        // starts subscribing to the collection
        this.$subsHandle = this.subscribe(this.$subscription, () => {
            return [
                { $and: [this.getReactively('filter'), this.getReactively('searchFilter'), this.getReactively('specialFilter')] },
                {
                    sort: this.getReactively('sort'),
                    limit: parseInt(this.getReactively('numItemsToLoad'))
                }
            ]
        }, {
            onStop: (err) => {
                if (err) {
                    $tmvUiUtils.error(err)
                }
            },
            onReady: () => {}
        })

        // setup reactive properties
        this.helpers({
            $items() {
                return this.$collection.find({ $and: [this.getReactively('filter'), this.getReactively('searchFilter'), this.getReactively('specialFilter')] }, {
                    sort: this.getReactively('sort'),
                    // limit: parseInt(this.getReactively('numItemsToLoad'))
                })
            },
            $collectionCount() {
                return $Counts.get(this.$subscription + '.count');
            },
            $currentItem() {
                let currentItemId = this.getReactively('currentItemId');
                if (currentItemId) {
                    let theItem = this.$collection.findOne({ _id: currentItemId })
                        // there's a currently loaded item, load the current value
                    if (this.$currentItem) theItem = angular.extend(this.$currentItem, theItem)
                    return theItem
                }
                return {}
            }
        })

        this.autorun(() => {
            this.subsReady = this.$subsHandle.ready()
        })

        if (angular.isObject(this.functions)) {
            // inject the included functions
            // bound them into the controller for possible call inside the form or list
            angular.forEach(this.functions, function(fn, key) {
                if (angular.isFunction(fn)) {
                    _this[key] = angular.bind(_this, fn);
                }
            })
        }
    }


    function tmvCollectionLinkFn($scope, $element, $attrs, $ctrl) {
        // TODO: include pre/post form utilities
        let parentController = $element.controller()
        if (parentController) {
            parentController.$tmvCollection = $ctrl // for convenient access
            $element.scope().$tmvCollection = $ctrl
        }
        // $element.addClass('layout-column flex')
        $element.replaceWith($element.children().addClass('tmv-collection'))
    }
}
