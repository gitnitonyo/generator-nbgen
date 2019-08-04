/**
 * For form handling on a collection
 */
import _ from 'underscore';
import _s from 'underscore.string';
import jsondiffpatch from 'jsondiffpatch';
import { Mongo } from '../../nbgenMeteor';
import formActions from './tmvCollectionFormActions.html';

import { USED_NG_SERVICES } from './tmvCollectionCommon.js';
import { TmvCollectionBase } from './tmvCollectionBase';

export class TmvCollectionFormBaseCtrl extends TmvCollectionBase {
    constructor($scope, $injector) {
        'ngInject';

        super();

        this.$scope = $scope;
        this.$injector = $injector;

        this.__setupInjectedServices(USED_NG_SERVICES);

        // include the user underscore components for used inside elements
        this._ = _;
        this._s = _s;

        // convenience since most developers are familiar with these names as controllers
        this.$scope.vm = this.$scope.$ctrl = this;
    }

    $onInit() {
        this.$currentUser = this.getUser();
        this.$parentState = this.$state.current.parent;
        
        if (!_.isObject(this.options)) throw "No valid options was passed into tmvCollection list";

        this.__initLocalsFunctions();

        // initialize data reactively
        this._initReactiveData();

        // create promises before making the form ready; promises will be chained serially
        let promises = [ ];

        // resolve current item
        promises.push(this._resolveCurrentItem.bind(this));

        // old init
        this.$_origInit = this.$init; this.$init = undefined;
        this.$_origInitController = this.$initController; this.$initController = undefined;

        // initialization functions
        promises.push(() => this.$q.when(this.$_origInit && this.$_origInit()));
        promises.push(() => this.$q.when(this.$_origInitController && this.$_origInitController()));

        // resolve the form schema
        promises.push(() => this.$q.when(this.getFormSchema() || this.formSchema || {}, (schema) => {
            this.formSchema = schema || this.formSchema || this.options.formSchema;
            this.translatePrefix = this.translatePrefix || this.formSchema.translatePrefix || this.options.translatePrefix || '';
            this.__setupInjectedServices([].concat(this.options.injectedServices, this.formSchema.injectedServices));
            this.__processOptions();
        }));

        // check for permission for the operation
        promises.push(() => this.$q.when(this.checkIfOperationIsAllowed && this.checkIfOperationIsAllowed()));

        // initialization functions
        promises.push(() => this.$q.when(this.$init && this.$init()));
        promises.push(() => this.$q.when(this.$initController && this.$initController()));

        // for delete operation
        if (this.isDeleteMode()) {
            promises.push(() => this.$q.reject(this.removeItem && this.removeItem()));
        }

        // for new operation
        if (this.isNewMode()) {
            promises.push(() => this.$q.when(this._resolveCreateItem && this._resolveCreateItem()));
        }

        this.$q.serial(promises).then(() => {
            this.isReady = true;
        }, () => {
            this.isReady = false;
            this._doCancel();
        })
    }

    // initialize functions on the options level
    __initLocalsFunctions() {
        let fns = _.extend({}, this.options.locals, this.options.includedFunctions, this.options.functions);
        _.each(fns, (v, k) => {
            if (_.isFunction(v)) {
                this[k] = v.bind(this);
            } else {
                this[k] = v;
            }
        })

    }

    // resolve the current item
    _resolveCurrentItem() {
        return this.$q((_resolve, _reject) => {
            if (this.currentItemFn) {
                this.$q.when(this.currentItemFn({options: this.options})).then((item) => {
                    this.$currentItem = item || this.$currentItem || { };
                    _resolve(item);
                });
            } else if (this.isNewMode()) {
                // it's a new item
                this.$currentItem = this.$currentItem || { };
                _resolve(this.$currentItem);
            } else {
                this.$q.when(this.getCurrentItem()).then((item) => {
                    this.$currentItem = item || this.$currentItem;
                    _resolve(item);
                }, (err) => _reject(err));
            }
        })
    }

    _resolveCreateItem() {
        return this.$q((_resolve, _reject) => {
            if (this.isNewMode()) {
                this.$q.when(this.createItem && this.createItem()).then((item) => {
                    this.$currentItem = this.$currentItem || { };
                    _.extend(this.$currentItem, item);
                    _resolve(this.$currentItem);
                }, (err) => _reject(err));
            } else {
                _resolve({});
            }
        })
    }

    checkIfOperationIsAllowed() {
        return this.$q((_resolve, _reject) => {
            if (this.isNewMode() && this.insertAllowed()) {
                _resolve();
            } else if (this.isEditMode() && this.updateAllowed()) {
                _resolve();
            } else if (this.isViewMode() && this.viewAllowed()) {
                _resolve();
            } else if (this.isDeleteMode() && this.removeAllowed()) {
                _resolve();
            } else {
                _reject();
            }
        })
    }

    insertAllowed() {
        return !this.formSchema.options || this.formSchema.options.insertAllowed !== false;
    }

    updateAllowed() {
        return !this.formSchema.options || this.formSchema.options.updateAllowed !== false;
    }

    removeAllowed() {
        return !this.formSchema.options || this.formSchema.options.removeAllowed !== false;
    }

    viewAllowed() {
        return !this.formSchema.options || this.formSchema.options.viewAllowed !== false;
    }

    /**
     * setup services injected into the controller
     */
    __setupInjectedServices(injectedServices) {
        injectedServices = injectedServices.concat(this.constructor.$inject || []);
        _.each(injectedServices, v => { if (!this[v]) this[v] = this.$injector.has(v) && this.$injector.get(v) });
        this.$identityService = this.$nbgenIdentityService;
    }

    __processOptions() {
        this.actionsTemplate = this.formSchema.actionsTemplate || formActions;

        // bound functions
        let fns = _.extend({}, this.formSchema.functions, this.formSchema.includedFunctions, this.formSchema.locals);
        _.each(fns, (v, k) => {
            if (_.isFunction(v)) {
                this[k] = v.bind(this);
            } else {
                this[k] = v;
            }
        });
    }

    _getModifierCollection() {
        let modifierCollection = this.modifierCollection || (this.formSchema && this.formSchema.modifierCollection) || this.options.modifierCollection || this.collection;
        if (_.isString(modifierCollection)) {
            modifierCollection = Mongo.Collection.get(modifierCollection);
        }

        return modifierCollection;
    }

    _initReactiveData() {
        this.$reactive(this).attach(this.$scope);
        this.subscription = this._getSubscription();
        this.collection = this._getCollection();
        this.modifierCollection = this._getModifierCollection();

        this._performSubscription();
        this._performHelpers();
    }

    _performSubscription() {
        if (this.subscription) {
            this.$subsHandle = this.initSubscription(this.subscription, () => {
                this.$subscriptionReady = false;
                return [{_id: this.getReactively('currentItemId')}];
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
            });
        }
    }

    _performHelpers() {
        this.$previousItem = {};
        this.helpers({
            $currentItem() {
                this.getReactively('_forceRefresh');
                let id = this.getReactively('currentItemId');
                if (!id || this.isNewMode()) return this.$currentItem;
                const newItem = this.collection.findOne({_id: id});
                if (this.isViewMode()) {
                    return newItem;
                }
                return _.extend(newItem, this.$currentItem);
            }
        });

        this.autorun(() => {
            // clean the form whenever there's new $currentItem
            const currentItem = this.getReactively('$currentItem');
            if (_.isEmpty(this.$previousItem) || jsondiffpatch.diff(this.$previousItem, currentItem)) {
                this.$previousItem = this.$tmvUiUtils.deepCopy(currentItem);
                this.editForm && this.editForm.$setPristine();
            }
        })
    }

    // may be overriden to return custom for schema
    getFormSchema() {
        return this.options.formSchema;
    }

    /**
     * Displays title
     */
    titleDisplay() {
        if (!this.formSchema) return;

        let result;
        if (this.isViewMode() || this.isEditMode()) {
            result = (this.formSchema.detailsView && this.$interpolate(this.formSchema.detailsView)(this.$currentItem)) ||
                this.$translate.instant(this.translatePrefix + '.home.titleDetails')
        } else if (this.isNewMode()) {
            result = this.$translate.instant(this.translatePrefix + '.home.createNew')
        }
        return result;
    }

    hideFormSaveAction(item) { // eslint-disable-line
        return false
    }

    saveDisabled() {
        return this.editForm.$invalid || this.editForm.$pristine;
    }

    isFormInvalid() {
        return this.editForm.$invalid
    }

    onCancel() {

    }

    cancel() {
        this.$state.go('^');
    }

    _doCancel() {
        this.$q.when(this.onCancel && this.onCancel()).then(() => {
            this.cancel && this.cancel();
        })
    }

    onClose() {

    }

    close() {

    }

    _doClose() {
        this.$q.when(this.onClose && this.onClose()).then(() => {
            this.close && this.close();
        })
    }

    // for creating new item
    initNewItem() {
        return { };
    }

    createItem() {
        return this.$q.when(this.initNewItem && this.initNewItem());
    }

    // may be overriden to return an item
    getCurrentItem() {
        return this.$q((_resolve) => {
            this.autorun((c) => {
                const currentItem = this.getReactively('$currentItem');
                if (_.isObject(currentItem)) {
                    c.stop();
                    _resolve(currentItem)
                }
            })
        })
    }

    // crud functions for the modifier collection
    updateDoc(selector, modifier, options, callback) {
        if (!selector) {
            selector = {_id: this.$currentItem._id};
        }
        callback = callback || _.noop;

        this.$tmvUiUtils.showWaitDialog();
        this.modifierCollection.update(selector, modifier, options, (...args) => {
            this.$timeout(() => this.$tmvUiUtils.hideWaitDialog());
            callback && callback.apply(this, args);
        })
    }

    insertDoc(doc, callback) {
        callback = callback || _.noop;
        this.$tmvUiUtils.showWaitDialog();
        this.modifierCollection.insert(doc, (...args) => {
            this.$timeout(() => this.$tmvUiUtils.hideWaitDialog());
            callback && callback.apply(this, args);
        });
    }

    removeDoc(selector, callback) {
        if (!selector) {
            selector = {_id: this.$currentItem._id};
        }
        callback = callback || _.noop;
        this.$tmvUiUtils.showWaitDialog();
        this.modifierCollection.remove(selector, (...args) => {
            this.$timeout(() => this.$tmvUiUtils.hideWaitDialog());
            callback && callback.apply(this, args);
        });
    }

    afterInsert() {
        let message = this.formSchema.insertSuccessMessage !== undefined ? this.formSchema.insertSuccessMessage : 'home.insertSuccess';
        return this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.${message}`);
    }

    afterUpdate() {
        let message = this.formSchema.updateSuccessMessage !== undefined ? this.formSchema.updateSuccessMessage : 'home.updateSuccess';
        return this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.${message}`);
    }

    afterRemove() {
        let message = this.formSchema.removeSuccessMessage !== undefined ? this.formSchema.removeSuccessMessage : 'home.removeSuccess';
        return this.$tmvUiUtils.alert(`tx:${this.translatePrefix}.${message}`);
    }

    exitAfterUpdate() {
        return (this.formSchema.options && this.formSchema.options.exitAfterUpdate) !== undefined ? this.formSchema.options.exitAfterUpdate : true;
    }

    exitAfterInsert() {
        return (this.formSchema.options && this.formSchema.options.exitAfterInsert) !== undefined ? this.formSchema.options.exitAfterInsert : true;
    }

    // for sanitizing item before committing to the collection
    __sanitizeItem(item, dontCleanId) {
        return this.$tmvUiUtils.cleanUpData(item, dontCleanId);
    }

    __doExcludedFields(itemToSave) {
        let excludedFields = this.excludedFields && this.excludedFields(itemToSave);
        if (excludedFields) {
            if (_.isString(excludedFields)) excludedFields = [excludedFields];
            _.each(excludedFields, k => {
                if (itemToSave[k]) delete itemToSave[k];
            })
        }
    }

    __getPropertyValue(property) {
        return this.$parse(property)(this.$currentItem);
    }

    _getDirtyFields(formCtrl, forceIncludes = { }, forceExcludes = [ ]) {
        if (!formCtrl) formCtrl = this.editForm;     // use the default form used by tmvCollection
        let dirtyFields = { };

        if (this.options.includeAllWhenSaving === true || this.formSchema.includeAllWhenSaving === true) {
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

    __constructUpdateInstruction(delta, prefix='', setterObj, unsetterObj, item) {
        if (_.isObject(delta) && delta._t === 'a') {
            // it's an array, save the whole array as mongo cannot remove by array index
            let fieldName = prefix;
            if (fieldName.endsWith('.')) {
                fieldName = fieldName.substr(0, fieldName.length-1);
            }
            console.log(fieldName);
            setterObj[fieldName] = this.$parse(fieldName)(item);
            return;
        }
        _.each(delta, (value, key) => {
            if (key === '_t') return;       // ignore array indicator
            if (_.isArray(value)) {
                if (value.length === 1) {           // it's a new value
                    setterObj[`${prefix}${key}`] = value[0];
                } else if (value.length === 2) {    // it's an update value
                    setterObj[`${prefix}${key}`] = value[1];
                } else if (value.length === 3) {    // value was remove
                    unsetterObj[`${prefix}${key}`] = ''
                }
            } else if (_.isObject(value)) {
                this.__constructUpdateInstruction(value, `${prefix}${key}.`, setterObj, unsetterObj, item);
            }
        })
    }

    _constructUpdateInstruction(itemToSave) {
        if (this.options.includeAllWhenSaving === true || this.formSchema.includeAllWhenSaving === true) {
            return {$set: itemToSave}
        }

        // get delta between old and using jsondiffpatch
        let delta = jsondiffpatch.diff(this.$previousItem, itemToSave),
            setterObj = { }, unsetterObj = { };
        if (_.isObject(delta)) delete delta._id;        // remove id from the delta
        this.__constructUpdateInstruction(delta, '', setterObj, unsetterObj, itemToSave);

        let result = { };
        if (!_.isEmpty(setterObj)) {
            result.$set = setterObj;
        }
        if (!_.isEmpty(unsetterObj)) {
            result.$unset = unsetterObj;
        }
        
        return result;
    }

    // will save the
    saveDetails(exitAfter, cb) {
        let when = this.$q.when;
        if (this.isNewMode()) {
            // call the before insert event first inserting; it can be used to transform item for saving
            when(this.beforeInsert && this.beforeInsert(this.$currentItem)).then((item) => {
                item = item || this.$currentItem;
                let itemToSave = this.__sanitizeItem(item, true);       // clean up the item to save

                // check if there are properties to be excluded from the fields
                this.__doExcludedFields(itemToSave);
                this.insertDoc(itemToSave, (err, _id) => {
                    if (err) {
                        // there's an error in inserting document
                        if (this.insertError) {
                            this.insertError(err);
                        } else {
                            // by default display the error message
                            this.$tmvUiUtils.error(err);
                        }
                    } else {
                        this.editForm.$setPristine();   // clean form data
                        this.$previousItem = { }        // reset previous item
                        this.currentItemId = itemToSave._id = _id;
                        if (cb) {
                            cb(itemToSave)
                        } else {
                            when(this.afterInsert && this.afterInsert(itemToSave)).then(() => {
                                if (exitAfter !== false && this.exitAfterInsert()) {
                                    this._doCancel({action: 'insert'});
                                } else {
                                    // turn the form into edit mode
                                    this.turnToEditMode();
                                }
                            });
                        }
                    }
                })
            })
        } else {
            let itemToSave = this.$tmvUiUtils.cleanUpData(this.$currentItem);
            this.__doExcludedFields(itemToSave);
            when(this.beforeUpdate && this.beforeUpdate(this.$currentItem, itemToSave)).then((item) => {
                itemToSave = item || itemToSave;
                let updateInstruction = this._constructUpdateInstruction(itemToSave);
                this.updateDoc({_id: this.currentItemId}, updateInstruction, {}, (err) => {
                    if (err) {
                        if (this.updateError) {
                            this.updateError(err)
                        } else {
                            // by default display the error message
                            this.$tmvUiUtils.error(err);
                        }
                    } else {
                        this.editForm.$setPristine();   // clean the form
                        this.$previousItem = this.$tmvUiUtils.deepCopy(this.$currentItem);
                        if (cb) {
                            cb(itemToSave, updateInstruction);
                        } else {
                            when(this.afterUpdate && this.afterUpdate(this.$currentItem, itemToSave)).then(() => {
                                if (exitAfter !== false && this.exitAfterUpdate()) {
                                    this._doCancel({action: 'update'});
                                }
                            });
                        }
                    }
                })
            })
        }
    }

    removeItem() {
        let formSchema = this.formSchema || this.options.formSchema;
        let translatePrefix = this.translatePrefix || (formSchema && formSchema.translatePrefix) || this.options.translatePrefix || '';

        let confirmMessage = formSchema.confirmDeleteMessage || `${translatePrefix}.home.deleteConfirmation`
        confirmMessage = this.$translate.instant(confirmMessage)
        this.$tmvUiUtils.confirm(confirmMessage).then(() => {
            this.$q.when(this.beforeRemove && this.beforeRemove()).then(() => {
                this.removeDoc({_id: this.currentItemId}, (err) => {
                    if (err) {
                        if (this.removeError) {
                            this.removeError(err);
                        } else {
                            // just display a message
                            this.$tmvUiUtils.error(err);
                        }
                    } else {
                        this.afterRemove && this.afterRemove(this.$currentItem);
                    }
                })
            })
        })
    }

    isNewMode() { return this.viewMode === 'new'; }

    isEditMode() { return this.viewMode === 'edit'; }

    isViewMode() { return this.viewMode === 'view'; }

    isDeleteMode() { return this.viewMode == 'del'; }

    turnToEditMode() { this.viewMode = 'edit'; }
    turnToViewMode() { this.viewMode = 'view'; }
}
