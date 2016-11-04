import _ from 'underscore';
import _s from 'underscore.string';
import angular from 'angular';

import nbgenUtilsUi from './nbgenUtilsUi.js';

import template from './nbgenCollectionv2.html';
import headingTemplate from './nbgenCollection.heading.html'
import headingTemplateList from './nbgenCollection.heading.list.html'
import headingTemplateDetails from './nbgenCollection.heading.details.html'

const controllerAs = '$tmvCollection';

/**
 * Base class which needs to be extended by
 */
export class NbgenCollectionBaseCtrl {
    constructor($scope, $injector) {
        'ngInject';

        this.setupInjectedServices(arguments);
        this.$scope = $scope;
        this.$injector = $injector;

        this.$reactive = this._getService('$reactive');
        this.$timeout = this._getService('$timeout');
        this.$q = this._getService('$q');
        this.$interpolate = this._getService('$interpolate');
        this.$parse = this._getService('$parse');
        this.$state = this._getService('$state');
        this.$translate = this._getService('$translate');
        this.$tmvUtils = this._getService('$tmvUtils');
        this.$tmvUiUtils = this._getService('$tmvUiUtils');
        this.$identityService = this._getService('$nbgenIdentityService') && $injector.get('$nbgenIdentityService');
        this.$Counts = this._getService('$Counts');

        // create a reactive context
        this.$reactive(this).attach($scope);

        this._bindSelectedFunctions();
    }

    _getService(serviceName) {
        return this.$injector.has(serviceName) && this.$injector.get(serviceName);
    }

    _bindSelectedFunctions() {
        // ensure that these functions are bound to this controller
        // when called on other controllers
        const funcs = [
            'getInitials'
        ]
        funcs.forEach((funcName) => {
            if (angular.isFunction(this[funcName])) {
                this[funcName] = this[funcName].bind(this);
            }
        })
    }

    setupInjectedServices(args) {
        const injectedServices = this.constructor.$inject
        if (angular.isArray(injectedServices)) {
            this.$services = { $injector: this.$injector }
            injectedServices.forEach((serviceName, idx) => {
                this.$services[serviceName] = args[idx];
            })
        }
    }

    $onInit() {
        // check proper bindings have been passed
        if (!this.options) {
            this.options = { };
        }

        this.$$processOptions();

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
        // initialize properties used for displaying the list
        this.showDetails = false;
        this.searchText = '';
        this.pageSize = 30;
        this.numItemsToLoad = this.pageSize;
        this.filter = { }
        this.specialFilter = { }
        this.searchFilter = { }
        this.performSubscription();
        this.performHelpers();
    }

    goBack() {
        this.$state.go('home');
    }

    _constructFilters(filter, searchFilter, specialFilter) {
        let filters = [ ];

        if (!_.isEmpty(filter)) {
            filters.push(filter)
        }
        if (!_.isEmpty(searchFilter)) {
            filters.push(searchFilter)
        }
        if (!_.isEmpty(specialFilter)) {
            filters.push(specialFilter)
        }

        if (filters.length === 0) {
            return { }
        }
        if (filters.length === 1) {
            return filters[0]
        }

        return { $and: filters }
    }

    // start subscribing to the specified subscription
    // subscription should be returning cursor for the specified collection
    performSubscription() {
        this.$subsHandle = this.subscribe(this.subscription, () => {
            const filter = this.getReactively('filter');
            const searchFilter = this.getReactively('searchFilter');
            const specialFilter = this.getReactively('specialFilter');
            const filters = this._constructFilters(filter, searchFilter, specialFilter);
            return [filters, {sort: this.getReactively('sort'), limit: parseInt(this.getReactively('numItemsToLoad'))}]
        }, {
            onStop(err) {
                if (err) {
                    this.$tmvUiUtils.error(err);
                }
            },
            onReady() {
                this.$subscriptionReady = true;
            }
        })
    }

    // retrieve items from the specified collection
    performHelpers() {
        this.helpers({
            // list of items unlist noList option is specified
            $items() {
                if (this.options.noList === true) {
                    return [this.getReactively('$currentItem')]
                }
                const filters = this._constructFilters(this.getReactively('filter'), this.getReactively('searchFilter'), this.getReactively('specialFilter'));
                return this.collection.find(
                    filters,
                    {
                        sort: this.getReactively('sort'),
                        // limit: parseInt(this.getReactively('numItemsToLoad'))
                    }
                )
            },

            // only applicable if noList option is not specieid
            $collectionCount() {
                if (this.options.noList === true) {
                    return 0;
                }
                return this.$Counts.get(`${this.subscription}.count`);
            },

            // returns the currently selected item
            $currentItem() {
                let currentItemId = this.getReactively('currentItemId');
                if (currentItemId) {
                    let theItem = this.collection.findOne(currentItemId);
                    if (theItem && this.$currentItemId) {
                        theItem = angular.extend(this.$currentItem, theItem)
                    }
                    return theItem;
                }
                return {};
            }
        })
    }

    // methods for handling the collection list
    getLayoutList() {
        return this.uiLayout.listLayout;
    }

    indexAt(index) {
        if (index < this.$items.length) return this.$items[index];

        // increment the number of items to loader
        let numItemsToLoad = (Math.floor(index / this.pageSize) + 1) * this.pageSize;
        if (numItemsToLoad != this.numItemsToLoad) {
            this.numItemsToLoad = numItemsToLoad
        }
    }

    itemCount() {
        return this.$collectionCount;
    }

    // for searching
    handleSearch(searchString) {
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
    }

    __itemSelected(event, item, index) {
        this.$timeout(() => {
            this.itemSelected(event, item, index)
        })
    }

    itemSelected(event, item, index) { // eslint-disable-line
        this.viewMode = 'view'
        this.currentItemId = item._id;
        this.detailsViewing();
    }

    /////////////////////////////////
    // executed when an item in the list clicked
    detailsViewing(isDirty) {
        // $tmvUiUtils.showWaitDialog();
        this.$timeout(() => {
            this.showDetails = true;
            if (isDirty) {
                this.$scope.editForm.$setDirty()
            } else {
                this.$scope.editForm.$setPristine();
            }
        })
    }

    cancelDetailsViewing() {
        this.showDetails = false;
        this.currentItemId = undefined;
        this.viewMode = '';
        this.$timeout(() => {
            this.$scope.editForm.$setPristine();
        })
    }

    closeDetailsView() {
        return this.$q((resolve, reject) => {
            if (this.$scope.editForm.$dirty) {
                this.$tmvUiUtils.confirm(this.$translate.instant('global.common.loseChangesConfirmation'))
                    .then(() => {
                        this.cancelDetailsViewing();
                        resolve()
                    }, reject)
            } else {
                this.cancelDetailsViewing();
                resolve()
            }
        })
    }

    // executed when edit icon is pressed
    editSelected(event, item, index) { // eslint-disable-line
        // edit button clicked
        this.currentItemId = item._id;
        this.viewMode = 'edit';
        this.detailsViewing();
    }

    // this function can be overriden to provide initialization
    // value when creating an item
    initNewItem() {

    }

    // executed when creating new document
    createItem(event) { // eslint-disable-line
        this.$currentItem = this.initNewItem() || {}
        this.viewMode = 'new'

        this.detailsViewing()
    }

    // crud functions
    updateDoc(selector, modifier, options, callback) {
        this.collection.update(selector, modifier, options, this.$bindToContext(angular.bind(this, callback)))
    }

    insertDoc(doc, callback) {
        this.collection.insert(doc, this.$bindToContext(angular.bind(this, callback)))
    }

    removeDoc(selector, callback) {
        this.collection.remove(selector, this.$bindToContext(angular.bind(this, callback)))
    }

    __sanitizeItem(item) {
        const sanitizeItem = {}
        angular.forEach(item, (value, key) => {
            if (!angular.isFunction(value) && key !== '_id' && !key.startsWith('$$')) {
                sanitizeItem[key] = value
            }
        })

        return sanitizeItem
    }

    afterInsert() {
        this.$timeout(() => this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.home.insertSuccess`));
    }

    afterUpdate() {
        this.$timeout(() => this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.home.updateSuccess`));
    }

    afterRemove() {
        this.$timeout(() => this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.home.removeSuccess`));
    }

    saveDetails(dontCancel, excludeFields, successCb, errorCb) {
        // save the details
        if (this.viewMode === 'new') {
            // create new doc
            if (this.$identityService) {
                this.$currentItem.createdBy = this.$identityService.userId();
            }
            this.$tmvUiUtils.meteorConnectionAdvice().then(() => {
                this.$currentItem._group = this.$identityService.user().profile._activeGroup
                let cbResult = this.beforeInsert.call(this, this.$currentItem) || this.$q.resolve()
                cbResult.then(() => {
                    this.insertDoc(this.__sanitizeItem(this.$currentItem), (err, _id) => {
                        if (err) {
                            this.$tmvUiUtils.error(err)
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
            if (this.$identityService) {
                itemToSave.modifiedBy = this.$identityService.userId()
            }
            if (excludeFields) {
                if (angular.isString(excludeFields)) {
                    excludeFields = [excludeFields]
                }
                excludeFields.forEach((f) => {
                    if (itemToSave[f]) delete itemToSave[f]
                })
            }
            this.$tmvUiUtils.meteorConnectionAdvice().then(() => {
                let cbResult = this.beforeUpdate.call(this, this.$currentItem, itemToSave) || this.$q.resolve()
                cbResult.then(() => {
                    this.updateDoc({ _id: this.$currentItem._id }, { $set: itemToSave }, {}, (err) => {
                        if (err) {
                            this.$tmvUiUtils.error(err)
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

    confirmDelete(event, item) {
        let self = this;
        let confirmMessage = this.$labels.confirmDeleteMessage || `${this.translatePrefix}.home.deleteConfirmation`
        confirmMessage = this.$translate.instant(confirmMessage)
        this.$tmvUiUtils.confirm(confirmMessage).then(() => {
            let cbResult = this.beforeRemove.call(this, item) || this.$q.resolve()
            cbResult.then(() => {
                self.removeDoc({ _id: item._id }, (err) => {
                    if (err) {
                        this.$tmvUiUtils.error(err)
                    } else {
                        this.afterRemove.call(this, item)
                    }
                })
            })
        })
    }

    hideEdit(item) { // eslint-disable-line
        return false
    }

    hideDelete(item) { // eslint-disable-line
        return false
    }

    hideAction(item) { // eslint-disable-line
        return false
    }

    hideFormSaveAction(item) { // eslint-disable-line
        return false
    }

    titleDisplay() {
        let result

        if (this.viewMode == 'view' || this.viewMode == 'edit') {
            if (angular.isString(this.formSchema.detailsView)) {
                result = this.$interpolate(this.formSchema.detailsView)(this.$currentItem)
            } else {
                // display the first field in the list
                if (this.layout && angular.isArray(this.layout.fields) && this.layout.fields.length > 0) {
                    result = this.$parse(this.layout.fields[0].fieldName)(this.$currentItem)
                }
            }
        } else if (this.viewMode == 'new') {
            result = this.$translate.instant(this.translatePrefix + '.home.createNew')
        } else {
            result = this.$translate.instant(this.translatePrefix + '.home.title')
        }

        return result || ''
    }

    displaySearch() {
        return this.hasSearchField
    }

    // can be overriden to provide different UI layout
    getFormSchema() {
        return this.uiLayout
    }


    $$injectFn(fnName, fn) {
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
    $hasRole(roles) {
        return this.$identityService.isInRole(roles)
    }

    // process the options passed into this.options
    $$processOptions() {
        let options = this.options

        // labels
        this.$labels = options.labels || {}

        // default headers and footers view
        this.$headingViewTemplate = this.options.headingTemplate || headingTemplate
        this.tmvCollectionHeadingListView = this.options.headingTemplateList || headingTemplateList
        this.tmvCollectionHeadingDetailsView = this.options.headingTemplateDetails || headingTemplateDetails

        // action hooks
        this.beforeInsert = options.beforeInsert || this.beforeInsert || angular.noop
        this.afterInsert = options.afterInsert || this.afterInsert ||angular.noop
        this.beforeUpdate = options.beforeUpdate || this.beforeUpdate || angular.noop
        this.afterUpdate = options.afterUpdate || this.afterUpdate || angular.noop
        this.beforeRemove = options.beforeRemove || this.beforeRemove || angular.noop
        this.afterRemove = options.afterRemove || this.afterRemove || angular.noop

        this.$$injectFn('hideEdit', options.hideEdit)
        this.$$injectFn('hideDelete', options.hideDelete)
        this.$$injectFn('hideAdd', options.hideAdd)
        this.$$injectFn('hideAction', options.hideAction)
        this.$$injectFn('titleDisplay', options.titleDisplay)

        this.$resolveFns = options.$resolveFns

        // inject provided functions
        if (options.functions) {
            angular.forEach(options.functions, (fn, fnName) => {
                if (this[fnName]) {
                    // there's already a function defined; so save it to $$fnName
                    this['$$_' + fnName] = angular.bind(this, this[fnName])
                }
                this[fnName] = angular.bind(this, fn) // inject the specified function
            })
        }

        // process options for hiding actions
        // check if there are services to be injected
        this.$services = this.$services || {}
        if (angular.isArray(options.injectedServices)) {
            angular.forEach(options.injectedServices, (serviceName) => {
                if (this.$injector.has(serviceName)) {
                    this.$services[serviceName] = this.$injector.get(serviceName)
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
    /////////////////////////////////

    $postLink() {
        const $scope = this.$scope;

        // initiates scope watches
        $scope.$watch('$tmvCollection.searchText', this.$tmvUtils.debounce(angular.bind(this, this.handleSearch), 300));
    }
}

export function setupNbgenComponent(componentName, moduleName, controller, options) {
    if (!moduleName) moduleName = nbgenUtilsUi;
    if (!controller) controller = NbgenCollectionBaseCtrl;
    const ngModule = angular.module(moduleName)
        .component(componentName, {
            template,
            controller,
            controllerAs,
            bindings: {
                title: '@',
                subscription: '@',
                collection: '<',
                uiLayout: '<',
                options: '<'
            }
        })

    options = options || { }
    if (options.state) {
        const componentNameDashed = _s.dasherize(componentName);
        let { name, url, parent, rolesAllowed, i18npart, controller, resolve, template } = options.state;
        const stateConfig = { }
        stateConfig.url = url || `/${componentName}`
        stateConfig.parent = parent || 'secureContent';
        stateConfig.data = { }
        if (rolesAllowed !== undefined) stateConfig.data.roles = rolesAllowed;
        const view = { }

        view.template = template || function() {
            // const template = angular.element('<md-content>').addClass('window-maximize')
            //    .append(angular.element(`<${componentNameDashed}>`).addClass('window-maximize'));
            const template = angular.element(`<${componentNameDashed}>`).addClass('full-absolute');

            return template;
        }

        if (controller !== undefined) view.controller = controller;
        stateConfig.views = { 'content@': view }

        resolve = resolve || { }
        if (i18npart) {
            angular.extend(resolve, {
                translatePartialLoader: ['$translate', '$translatePartialLoader',
                    function ($translate,$translatePartialLoader) {
                        $translatePartialLoader.addPart(i18npart);
                        return $translate.refresh();
                    }]
            })
        }
        stateConfig.resolve = resolve;
        ngModule.config(function($stateProvider) {
            'ngInject';
            const stateName = name || componentName;
            $stateProvider
                .state(stateName, stateConfig);
        })
    }
}
