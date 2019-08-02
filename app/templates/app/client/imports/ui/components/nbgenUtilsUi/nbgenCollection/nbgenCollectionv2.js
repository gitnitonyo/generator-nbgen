import _ from 'underscore';
import _s from 'underscore.string';
import jsondiffpatch from 'jsondiffpatch';
import angular from 'angular';

import nbgenUtilsUi from '../nbgenUtilsUi.js';

import template from './nbgenCollectionv2.html';
import headingTemplate from './nbgenCollection.heading.html'
import headingTemplateList from './nbgenCollection.heading.list.html'
import headingTemplateDetails from './nbgenCollection.heading.details.html'

import detailsFormTemplate from './nbgenDetailsForm.html';
import formDialogTemplate from './nbgenFormDialog.html';

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
        this.$sce = this._getService('$sce');
        this.$interpolate = this._getService('$interpolate');
        this.$parse = this._getService('$parse');
        this.$state = this._getService('$state');
        this.$translate = this._getService('$translate');
        this.$tmvUtils = this._getService('$tmvUtils');
        this.$tmvUiUtils = this._getService('$tmvUiUtils');
        this.$identityService = this._getService('$nbgenIdentityService');
        this.$Counts = this._getService('$Counts');
        this.$tmvUiData = this._getService('$tmvUiData');
        this.$mdDialog = this._getService('$mdDialog');     // use for viewing form in modal dialog

        // include underscore and underscore string as properties for
        // easier access inside the templates
        this._s = _s;
        this._ = _;

        this.$scope.vm = this.$scope.$ctrl = this;  // convenience

        // create a reactive context
        this.$reactive(this).attach($scope);

        this._bindSelectedFunctions();

        this.$operationPending = true;
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
                if (!this[serviceName]) {
                    this.$services[serviceName] = args[idx];
                    this[serviceName] = args[idx];
                }
            })
        }
    }

    $onInit() {
        // check proper bindings have been passed
        if (!this.options) {
            this.options = { };
        }

        this.$$processOptions();

        // check if there's an initialization function in the options
        if (this.options.$init && _.isFunction(this.options.$init)) {
            this.options.$init.call(this);
        }

        // UI configuration should be in *_UI
        this.formSchema = this.getFormSchema('view');
        if (!this.translatePrefix) {
            this.translatePrefix = this.formSchema.translatePrefix;
        }
        this.layout = this.getLayoutList();
        this.tabular = (this.layout.tabular === true);

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
            // if (this.layout && this.layout.fields.length > 0) {
            //     this.sort[this.layout.fields[0].fieldName] = 1;
            // }
        }
        // initialize properties used for displaying the list
        this.showDetails = false;
        this.searchText = '';
        this.pageSize = 50;
        this.numItemsToLoad = this.pageSize;
        this.filter = { }
        this.specialFilter = { }
        this.searchFilter = { }
        this.performSubscription();
        this.performHelpers();

        // collection may be publish as virtual in the server
        // so for this we need to have different modifierCollection
        // by default it's the same as the collection
        this.modifierCollection = this.modifierCollection || this.collection;
    }

    goBack() {
        this.$state.go('home');
    }

    _constructFilters(filter, searchFilter, specialFilter, currentItemId) {
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
            filters = { }
        } else if (filters.length === 1) {
            filters = filters[0];
        } else {
            filters = { $and: filters }
        }

        if (!_.isEmpty(currentItemId)) {
            filters = {$or: [{_id: currentItemId}, filters]}
        }

        return filters;
    }

    // start subscribing to the specified subscription
    // subscription should be returning cursor for the specified collection
    performSubscription() {
        this.$subsHandle = this.subscribe(this.subscription, () => {
            this.$subscriptionReady = false;
            const currentItemId = this.getReactively('currentItemId');
            const filter = this.getReactively('filter');
            const searchFilter = this.getReactively('searchFilter');
            const specialFilter = this.getReactively('specialFilter');
            const filters = this._constructFilters(filter, searchFilter, specialFilter, currentItemId);
            return [filters, {sort: this.getReactively('sort'), limit: parseInt(this.getReactively('numItemsToLoad'))}]
        }, {
            onStop(err) {
                if (err) {
                    this.$tmvUiUtils.error(err);
                }
                this.$subscriptionReady = true;
            },
            onReady() {
                this.$subscriptionReady = true;
            }
        })
    }

    _transformItem(item) {
        return item;
    }

    // retrieve items from the specified collection
    performHelpers() {
        this.helpers({
            // list of items unlist noList option is specified
            $items() {
                if (this.options.noList === true) {
                    return [this.getReactively('$currentItem')]
                }
                const filter = this.getReactively('filter');
                const searchFilter = this.getReactively('searchFilter');
                const specialFilter = this.getReactively('specialFilter');
                const filters = this._constructFilters(filter, searchFilter, specialFilter);
                return this.collection.find(
                    filters,
                    {
                        sort: this.getReactively('sort'),
                        limit: parseInt(this.getReactively('numItemsToLoad')) || this.pageSize
                    }
                )
            },

            // only applicable if noList option is not specieid
            $collectionCount() {
                let newCount;
                if (this.options.noList === true) {
                    newCount = 0;
                } else if (this.subscription && this.layout.hasNoCount !== true) {
                    const subsCount = `${this.subscription}.count`;
                    newCount = this.$Counts.get(subsCount);
                } else {
                    const items = this.getReactively('$items');
                    newCount = items && items.length;
                }

                return newCount;
            },

            // returns the currently selected item
            $currentItem() {
                let currentItemId = this.getReactively('currentItemId');
                if (currentItemId) {
                    let theItem = this.collection.findOne(currentItemId);
                    if (theItem) theItem = this._transformItem(theItem);
                    if (theItem && this.$currentItem) {
                        // remove non-special fields
                        _.each(this.$currentItem, (value, key) => {
                            if (!key.startsWith('$')) {
                                delete this.$currentItem[key];
                            }
                        })
                        theItem = angular.extend({}, this.$currentItem, theItem);
                    }
                    return theItem;
                }
                return this.$currentItem || { };
            }
        });

        this.autorun(() => {
            const currentItem = this.getReactively('$currentItem');
            if (!this.$previousItem || jsondiffpatch.diff(this.$previousItem, currentItem)) {
                this.$previousItem = this.$tmvUiUtils.deepCopy(currentItem);
            }
            // whenever there's new item, clean up the form
            this.editForm && this.editForm.$setPristine();
        })
    }

    // methods for handling the collection list
    getLayoutList() {
        const listLayout = this.uiLayout.listLayout;
        const userRoles = this.$identityService.getUserRoles();
        if (_.isArray(userRoles)) {
            let numRoles = userRoles.length;
            while (numRoles > 0) {
                numRoles -= 1;
                const currentRole = userRoles[numRoles];
                _.extend(listLayout, this.uiLayout.roles && this.uiLayout.roles[currentRole] && this.uiLayout.roles[currentRole].listLayout);
            }
        }

        return listLayout;
    }

    indexAt(index) {
        if (this.layout.hasNoCount === true) {
            if (this.$items && index < this.$items.length) return this.$items[index];
            if (this.$items && index >= this.$items.length) {
                this.numItemsToLoad = this.$items.length + this.pageSize;
            }
            return null;
        }

        if (this.$items && index < this.$items.length) return this.$items[index];

        // increment the number of items to loader
        this.$bindToContext(() => {
            let numItemsToLoad = (Math.floor(index / this.pageSize) + 1) * this.pageSize;
            if (numItemsToLoad !== this.numItemsToLoad) {
                this.numItemsToLoad = numItemsToLoad;
            }
        })();
        return null;
    }

    itemCount() {
        let numItems = (this.$items && this.$items.length) || 0;
        if (this.layout.hasNoCount === true) {
            // infinite scroll
            if (this.$items) {
                return this.$items.length + 1;
            }
            return this.numItemsToLoad;
        }
        return Math.max(numItems, this.$collectionCount);
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

    __currentItem() {
        return this.$q((_resolve) => {
            // this.$showLoading = true;
            this.autorun((c) => {
                const currentItem = this.getReactively('$currentItem');
                if (currentItem && currentItem._id) {
                    c.stop();
                    _resolve(currentItem);
                    // this.$showLoading = false;
                }
            });
        })
    }

    __determineFormSchema(formSchema) {
        if (formSchema && formSchema.formLayout) {
            this.formSchema = formSchema;
        } else {
            this.formSchema = {formLayout: formSchema};
        }
        if (formSchema && formSchema.locals) {
            _.each(formSchema.locals, (v, k) => {
                this[k] = v;
            })
        }
        if (formSchema && formSchema.functions) {
            _.each(formSchema.functions, (v, k) => {
                this.$$injectFn(k, v);
            });
        }
    }

    itemSelected(event, item, index, mode, id) { // eslint-disable-line
        this.viewMode = mode ||
            (this.options.selectParams && this.options.selectParams.mode
                && this.options.selectParams.mode.call(this, item, index, event)) || 'view';

        this.currentItemId = (item && item._id) || id;
        this.__currentItem().then(() => {
            this.$q.when(this.getFormSchema(this.viewMode, this.$currentItem), (formSchema) => {
                this.__determineFormSchema(formSchema);
                if (this.options.useModalInView === true && this.viewMode === 'view') {
                    this._showModal = true;
                    this.viewFormInModal().finally(() => {
                        this._showModal = false;
                        this.viewMode = '';
                        this.showDetails = false;
                        this.currentItemId = undefined;
                        this.editForm && this.editForm.$setPristine();
                    });
                } else {
                    this.detailsViewing();
                }
            })

        });
    }

    beforeDetailsViewing() {

    }

    /////////////////////////////////
    // executed when an item in the list clicked
    detailsViewing(isDirty) {
        this.$q.when(this.beforeDetailsViewing(), () => {
            this.showDetails = true;
            this.$timeout(() => {
                if (isDirty) {
                    this.editForm && this.editForm.$setDirty()
                } else {
                    this.editForm && this.editForm.$setPristine();
                }
            })
        })

        /*
        this.$tmvUiUtils.showWaitDialog();
        this.$timeout(500).then(() => this.$tmvUiUtils.hideWaitDialog());
        */
    }

    afterDetailsViewing() {

    }

    cancelDetailsViewing() {
        this.$q.when(this.afterDetailsViewing(), () => {
            if (this._detailsOnly || this.$cancelState) {
                if (!this.$cancelState) {
                    this.$cancelState = {
                        state: 'home'
                    }
                }
                this.gotoState(this.$cancelState.state, this.$cancelState);
            } else {
                this.showDetails = false;
                this.currentItemId = undefined;
                this.$currentItem = undefined;
                this.viewMode = '';
            }
        })
    }

    closeDetailsView() {
        return this.$q((resolve, reject) => {
            if (this.viewMode !== 'view' && this.editForm && this.editForm.$dirty) {
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
        // this.currentItemId = item._id;
        // this.viewMode = 'edit';
        // this.detailsViewing();
        this.itemSelected(event, item, index, 'edit');
    }

    // this function can be overriden to provide initialization
    // value when creating an item
    initNewItem() {

    }

    // executed when creating new document
    createItem(event) { // eslint-disable-line
        return this.$q.when(this.initNewItem(), val => {
            this.$currentItem = val || {}
            this.viewMode = 'new'
            this.$q.when(this.getFormSchema('new', this.$currentItem), (formSchema) => {
                this.__determineFormSchema(formSchema);
                this.showDetails = true;

                this.detailsViewing();
                this.$operationPending = false;
            })
        });
    }

    // crud functions
    updateDoc(selector, modifier, options, callback) {
        if (!selector) {
            selector = {_id: this.$currentItem._id};
        }
        callback = callback || angular.noop();

        this.$tmvUiUtils.showWaitDialog();
        this.modifierCollection.update(selector, modifier, options, (...args) => {
            this.$timeout(() => this.$tmvUiUtils.hideWaitDialog());
            callback && callback.apply(this, args);
        })
    }

    insertDoc(doc, callback) {
        callback = callback || angular.noop();
        this.$tmvUiUtils.showWaitDialog();
        this.call('utils.getUniqueNumber', (err, id) => {
            if (err) {
                this.$tmvUiUtils.hideWaitDialog();
                this.$tmvUiUtils.error(err);
            } else {
                doc._id = doc._id || id;
                this.modifierCollection.insert(doc, (...args) => {
                    this.$tmvUiUtils.hideWaitDialog();
                    callback && callback.apply(this, args);
                });
            }
        })
    }

    removeDoc(selector, callback) {
        if (!selector) {
            selector = {_id: this.$currentItem._id};
        }
        callback = callback || angular.noop();
        this.$tmvUiUtils.showWaitDialog();
        this.modifierCollection.remove(selector, (...args) => {
            this.$timeout(() => this.$tmvUiUtils.hideWaitDialog());
            callback && callback.apply(this, args);
        });
    }

    __sanitizeItem(item, dontCleanId) {

        return this.$tmvUiUtils.cleanUpData(item, dontCleanId);
    }

    afterInsert() {
        let message = this.options.insertSuccessMessage !== undefined ? this.options.insertSuccessMessage : 'home.insertSuccess';
        if (message) {
            this.$timeout(() => this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.${message}`));
        }

    }

    afterUpdate() {
        let message = this.options.updateSuccessMessage !== undefined ? this.options.updateSuccessMessage : 'home.updateSuccess';
        if (message) {
            this.$timeout(() => this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.${message}`));
        }
    }

    afterRemove() {
        let message = this.options.removeSuccessMessage !== undefined ? this.options.removeSuccessMessage : 'home.removeSuccess';
        if (message) {
            this.$timeout(() => this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.${message}`));
        }
    }

    exitAfterUpdate() {
        return true;
    }

    exitAfterInsert() {
        return true;
    }

    _saveDetails(successCb, errorCb) {
        return this.$q((resolve, reject) => {
            this.saveDetails(true, undefined, (item) => {
                resolve(item);
                successCb && successCb.call(this, item);
            }, (item) => {
                reject(item);
                errorCb && errorCb.call(this, item);
            }, true);
        })
    }

    saveDetails(dontCancel, excludeFields, successCb, errorCb, noAfter) {
        dontCancel = dontCancel || (this.options.saveParams && this.options.saveParams.dontCancel);
        excludeFields = excludeFields || (this.options.saveParams && this.options.saveParams.excludeFields);
        successCb = successCb || (this.options.saveParams && this.options.saveParams.successCb);
        errorCb = errorCb || (this.options.saveParams && this.options.saveParams.errorCb);
        noAfter = noAfter || (this.options.saveParams && this.options.saveParams.noAfter);

        // save the details
        if (this.viewMode === 'new') {
            // create new doc
            if (this.$identityService) {
                this.$currentItem.createdBy = this.$identityService.userId();
            }
            this.$tmvUiUtils.meteorConnectionAdvice().then(() => {
                let cbResult = this.beforeInsert.call(this, this.$currentItem) || this.$q.resolve()
                cbResult.then(() => {
                    let itemToSave = this.__sanitizeItem(this.$currentItem, true);
                    if (excludeFields) {
                        if (angular.isString(excludeFields)) {
                            excludeFields = [excludeFields]
                        }
                        excludeFields.forEach((f) => {
                            if (itemToSave[f]) delete itemToSave[f]
                        })
                    }
                    this.insertDoc(itemToSave, (err, _id) => {
                        if (err) {
                            this.$tmvUiUtils.error(err)
                            errorCb && errorCb.call(this, this.$currentItem)
                        } else {
                            this.currentItemId = this.$currentItem._id = _id;
                            if (noAfter !== true) this.afterInsert.call(this, this.$currentItem)
                            successCb && successCb.call(this, this.$currentItem);
                            if (dontCancel !== true && this.exitAfterInsert()) {
                                this.cancelDetailsViewing();
                            } else {
                                this.viewMode = 'edit';
                            }
                            this.editForm && this.editForm.$setPristine();
                        }
                    })

                })
            })
        } else if (this.$currentItem._id) {
            // save the updates
            // let itemToSave = this.__sanitizeItem(this.$currentItem);
            let itemToSave = this.$tmvUiUtils.cleanUpData(this.$currentItem);

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
                    let updateInstruction = this._constructUpdateInstruction(itemToSave);
                    this.updateDoc({ _id: this.$currentItem._id }, updateInstruction, {}, (err) => {
                        if (err) {
                            this.$tmvUiUtils.error(err)
                            errorCb && errorCb.call(this, this.$currentItem)
                        } else {
                            if (noAfter !== true) this.afterUpdate.call(this, this.$currentItem, itemToSave)
                            successCb && successCb.call(this, this.$currentItem, itemToSave)
                            if (dontCancel !== true && this.exitAfterUpdate()) this.cancelDetailsViewing();
                            this.editForm && this.editForm.$setPristine();
                        }
                    })
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
            result = (this.formSchema.detailsView && this.$interpolate(this.formSchema.detailsView)(this.$currentItem)) ||
                this.$translate.instant(this.translatePrefix + '.home.titleDetails')
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
    getFormSchema(mode, item) {       // eslint-disable-line
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

    saveDisabled() {
        return this.editForm.$invalid || this.editForm.$pristine;
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

        this.detailsFormTemplate = this.options.detailsFormTemplate || detailsFormTemplate;

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
                    this.$services[serviceName] = this.$injector.get(serviceName);
                    this[serviceName] = this.$services[serviceName];    // make it also member of the controller
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

        // initiates scope watches
        const _searchRefreshFn = _.debounce(this.$bindToContext(angular.bind(this, this.handleSearch)), 300);
        this.autorun(() => {
            _searchRefreshFn.call(this, this.getReactively('searchText'));
        })

        const currentState = this.$state.current;
        // check state operation
        const stateOperation = currentState.data && currentState.data.stateOperation;
        this.$$stateOperation = stateOperation;

        if (stateOperation) {
            if (stateOperation.cancelState) {
                this.$cancelState = stateOperation.cancelState;
            }
            // clear the stateOperation
            currentState.data.stateOperation = undefined;
            const operation = stateOperation.operation;
            if (operation === 'new') {
                this.$q.when(this.createItem(), () => {
                    angular.extend(this.$currentItem, stateOperation.newData || {});
                });
            } else if (operation === 'edit' || operation === 'view') {
                this._detailsOnly = stateOperation.detailsOnly;
                this.autorun((c) => {
                    const item = this.collection.findOne({_id: stateOperation.itemId});
                    if (!item) return;
                    c.stop();
                    this.$currentItem = item;
                    this.showDetails = true;
                    this.itemSelected(undefined, item, undefined, operation, stateOperation.itemId);
                    if (stateOperation.executeFn) {
                        // there's a function to execute
                        this.$timeout(() => {
                            this[stateOperation.executeFn].call(this, item);
                        })
                    }

                    this.$tmvUiUtils.showWaitDialog()
                    this.$timeout(() => this.$operationPending = false, 1000).then(() => this.$tmvUiUtils.hideWaitDialog());
                })
            } else {
                this.$operationPending = false;
            }
        } else {
            this.$operationPending = false;
        }
    }

    gotoState(stateName, stateOperation) {
        const state = this.$state.get(stateName);
        if (!state) return;
        let params, options;
        if (stateOperation) {
            state.data = state.data || { };
            state.data.stateOperation = stateOperation;
            params = stateOperation.params;
            options = stateOperation.options;
        }
        this.$state.go(state, params, options);
    }

    /**
     * performs an update on the collection property using the passed object
     * performs a $set on the properties of the object
     */
    /*
     * deprecate this
    updateCollection(obj, cb, selector) {
        if (!obj) return;   // dont do anything if no selector and obj passed
        if (!selector) {
            selector = this.$currentItem && this.$currentItem._id;
        }

        const updateInstruction = {$set: this.__sanitizeItem(obj)};
        if (_.isString(selector)) {
            // if it's a string asssume it's the _id property
            selector = { _id: selector };
        }
        this.collection.update(selector, updateInstruction, cb);
    }
     */

    __getPropertyValue(property) {
        return this.$parse(property)(this.$currentItem);
    }

    /**
     *  Returns an object containing dirty fields on the specified controller
     *  with their corresponding values
     */
    getDirtyFields(formCtrl, forceIncludes = { }, forceExcludes = [ ]) {
        if (!formCtrl) formCtrl = this.editForm;     // use the default form used by tmvCollection
        let dirtyFields = { };
        if (this.options.includeAllWhenSaving === true) {
            dirtyFields = this.$tmvUiUtils.cleanUpData(this.$currentItem);
        } else {
            _.each(formCtrl, (value, property) => {
                if (value instanceof Object && value.hasOwnProperty('$modelValue')) {
                    if (value.$tmvModelName) {
                        property = value.$tmvModelName;
                    }
                    // do not include ngModel which has $ as start
                    if (!property.startsWith('$') && property.indexOf('.$') < 0 &&
                        forceExcludes.indexOf(property) < 0 && value.$dirty === true) {
                        dirtyFields[property] = this.__getPropertyValue(property);
                    }
                }
            });
        }

        _.extend(dirtyFields, forceIncludes);

        return dirtyFields;
    }

    _constructUpdateInstruction(itemToSave) {
        if (this.options.includeAllWhenSaving === true) {
            return {$set: itemToSave}
        }

        let setInstruction = this.$tmvUiUtils.determineObjSets(this.$previousItem, itemToSave);
        let unsetInstruction = { };

        // transfer undefined to unset instructions
        _.each(setInstruction, (v, k) => {
            if (v === undefined || v === null) {
                unsetInstruction[k] = null;
                delete setInstruction[k];
            }
        });
        let result = { $set: setInstruction || { } };
        if (!_.isEmpty(unsetInstruction)) {
            result.$unset = unsetInstruction;
        }

        return result;
    }

    /**
     *  Force field to be dirty
     */
    forceFieldDirty(fieldName, formCtrl) {
        if (!formCtrl) formCtrl = this.editForm;
        const ngModelCtrl = _.find(formCtrl, (value, key) => key === fieldName);
        ngModelCtrl && ngModelCtrl.$setDirty && ngModelCtrl.$setDirty();
    }

    /**
     * View the form in modal dialog
     */
    viewFormInModal() {
        return this.$mdDialog.show({
            template: formDialogTemplate,
            autowrap: true,
            scope: this.$scope.$new(),
            escapeToClose: false,

            // events
            onShowing(scope, element) {     // eslint-disable-line

            },
            onComplete(scope, element) {    // eslint-disable-line

            },
            onRemoving(element, removePromise) { // eslint-disable-line

            }
        })
    }

    /**
     * Returns true if edit is to be disabled
     */
    editDisabled() {
        return false;
    }

    /**
     * Return true if delete is to be disabled
     */
    deletedDisabled() {
        return false;
    }

    /**
     * Convenience function for translation
     */
    translate(str, params) {
        return this.$translate.instant(str, params);
    }
}

export function setupNbgenComponent(componentName, moduleName, controller, options) {
    if (!moduleName) moduleName = nbgenUtilsUi;
    if (!controller) controller = NbgenCollectionBaseCtrl;
    options = options || { }
    const requireObj = options.require || { };
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
            },
            require: requireObj
        })
    if (options.state) {
        const componentNameDashed = _s.dasherize(componentName);
        let { name, url, parent, rolesAllowed, i18npart, controller, resolve, template, controllerAs } = options.state;
        const stateConfig = { }
        stateConfig.url = url || `/${componentName}`
        stateConfig.parent = parent || 'secureContent';
        stateConfig.data = { }
        if (rolesAllowed !== undefined) stateConfig.data.roles = rolesAllowed;
        const view = { }

        view.template = template || function() {
            const template = angular.element(`<${componentNameDashed}>`).addClass('full-absolute');

            return template;
        }

        if (controller !== undefined) view.controller = controller;
        if (controllerAs !== undefined) view.controllerAs = controllerAs;
        stateConfig.views = { 'content@': view }

        resolve = resolve || { }
        if (i18npart) {
            if (angular.isString(i18npart)) {
                i18npart = [i18npart];
            }
            angular.extend(resolve, {
                translatePartialLoader: ['$translate', '$translatePartialLoader',
                    function ($translate,$translatePartialLoader) {
                        i18npart.forEach((i) => {
                            $translatePartialLoader.addPart(i);
                        })
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
