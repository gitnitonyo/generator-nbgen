/**
 * Form utility functions
 */
import _ from 'underscore';
import _s from 'underscore.string';
import angular from 'angular';
import { Mongo } from '../nbgenMeteor';

export const USED_NG_SERVICES = [
    '$interpolate', '$parse', '', '$translate', '$state',
    '$timeout', '$sce', '$tmvUtils', '$tmvUiUtils', '$tmvUiData', '$tmvUiUtils',
    '$mdDialog', '$nbgenIdentityService', '$Counts',
];

/**
 * Servers as base class for form controller with schema
 */
export class TmvBaseFormController {
    // $options and $currentItem may be set from the resolve of dialog or state
    constructor($injector, $scope, $options, $currentItem) {
        'ngInject';

        this.$injector = $injector;
        this.$scope = $scope;
        this.$options = $options;
        this.$currentItem = $currentItem;
        this.__arguments = arguments;
    }

    $onInit() {
        // initialize $scope variables for this controller
        this.$scope.vm = this.$scope.$tmvCollection = this.$scope.$formCtrl = this;

        // use injector to get access to other angular services
        this.$reactive = this.$injector.get('$reactive');
        this.$reactive(this).attach(this.$scope);

        this.$currentItem = this.$currentItem || this.$options.formModel;
        if (_.isString(this.$currentItem)) {
            this.currentItemId = this.$currentItem;
            this.$currentItem = { };
        }

        this.__arguments = arguments;

        this.__setupNgServices();

        this.__initProperties(this.$options);        // initialize properties of the controller
        this.__processLocals(this.$options);
        this.__processFunctions(this.$options, this.__arguments);
    }

    __initProperties(options) {

        this._setCurrentItem();

        // can be used on template to style
        this.cssClass = options.cssClass;
        this.cssStyle = options.cssStyle;

        // check if part of schema is specified instead of whole formschema
        if (!options.formSchema) {
            if (options.fields) {
                options.formSchema = { formLayout: { formGroups: { fields: options.fields }}};
            } else if (options.formGroups) {
                options.formSchema = { formLayout: { formGroups: options.formGroups }}
            } else if (options.formLayout) {
                options.formSchema = { formLayout: options.formLayout }
            }
        }

        if (options.formSchema) {
            // there's a schema specified
            this.formSchema = options.formSchema;
            this.translatePrefix = this.formSchema.translatePrefix = options.translatePrefix || this.formSchema.translatePrefix || '';
            this.mode = this.viewMode = options.mode || 'edit';     // mode is edit by default
            this.readOnly = (this.mode === 'view')
        } else {
            this.template = options.template;           // its own dialog template is specified
            this.translatePrefix = options.translatePrefix || '';
        }

        // use for customized action at the bottom of the dialog
        this.actionTemplate = this.actionsTemplate = (options.formSchema && options.formSchema.actionTemplate) || options.actionTemplate;

        // process dialog title
        if (options.title) {
            if (options.title.startsWith('tx:')) {
                options.title = options.title.substr(3);
            }
            this._formTitle = this.$translate.instant(options.title);
        } else {
            if (this.mode === 'new') {
                this._formTitle = this.$translate.instant(`${this.translatePrefix}.home.createNew`);
            } else if (this.formSchema && !this.formSchema.detailsTitle) {
                this._formTitle = this.$translate.instant(`${this.translatePrefix}.home.titleDetails`);
            }
        }

        // process action labels
        this.okLabel = angular.isString(options.okLabel) ? options.okLabel : 'global.common.ok'
        this.cancelLabel = angular.isString(options.cancelLabel) ? options.cancelLabel : 'global.common.cancel'
    }

    __setupNgServices() {
        _.each(USED_NG_SERVICES, v => {
            if (v && !this[v]) {
                this[v] = this.$injector.get(v);
            }
        });

        // check injected services
        const injectedServices = this.constructor.$inject;
        if (_.isArray(injectedServices)) {
            _.each(injectedServices, v => {
                if (!this[v]) this[v] = this.$injector.has(v) && this.$injector.get(v);
            })
        }
    }

    __processFunctions(options, args) {
        // bound any functions specified
        let fns = _.extend({}, this.formSchema && this.formSchema.functions, options.includedFunctions, options.functions);
        if (_.isObject(fns)) {
            _.each(fns, (fn, key) => {
                if (_.isFunction(fn)) {
                    this[key] = fn.bind(this);
                }
            })
        }

        // call if there's a controller specified
        const initialFn = this.$initController || this.$init;
        initialFn && initialFn.apply(this, args);

        options.onOpening && options.onOpening.call(this);

        this.$onReady && this.$onReady();
    }

    __processLocals(options) {
        let locals = _.extend({}, options.locals, this.formSchema && this.formSchema.locals);
        _.each(locals, (v, k) => {
            if (_.isFunction(v)) {
                this[k] = v.bind(this);
            } else {
                this[k] = v;
            }
        })
    }

    // override for customized settings of initializing $currentItem
    _setCurrentItem() {
        // initialze form model to be bound to the form
        if (this.$options.noReactive !== true && (this.$options.subscription || this.$options.collection) && this.$options.docId && !this.$currentItem) {
            this.currentItemId = this.$options.docId;

            if (this.$options.subscription) {
                this.subscription = this.$options.subscription;
                this.subscribe(this.$options.subscription, () => [{_id: this.currentItemId}]);
            }
            this.collection = this.$options.collection || Mongo.Collection.get(this.subscription);
            if (_.isString(this.collection)) {
                this.collection = Mongo.Collection.get(this.collection);
            }

            // this collection is used for updating which may be different from the view collection
            this.modifierCollection = this.$options.modifierCollection || this.collection;
            this.helpers({
                $currentItem() {
                    return this.collection.findOne({_id: this.currentItemId} || { });
                }
            });

            this.autorun(() => {
                this.formModel = this.getReactively('$currentItem');
            })
        } else {
            this.$currentItem = this.formModel = this.$currentItem || { };
        }
    }

    getFormTitle() {
        if (this._formTitle) return this._formTitle;
        if (this.formSchema && this.formSchema.detailsTitle) {
            return this.$interpolate(this.formSchema.detailsTitle)(this.formModel);
        }
    }

    getCurrentItem() {
        return this.$currentItem;
    }
}

export const WAITING_TEMPLATE = '<div><md-progress-circular md-mode="indeterminate" md-diameter="40" class="block-center"></md-progress-circular></div>';

export class TmvFormUtils {
    // dom utility functions
    static __domVisibilityProperties(dom, obj) {
        if (!_.isObject(obj)) return;
        if (obj.ngIf !== undefined) dom.attr('ng-if', obj.ngIf);
        if (obj.ngShow !== undefined) dom.attr('ng-show', obj.ngShow);
        if (obj.ngHide !== undefined) dom.attr('ng-hide', obj.ngHide);
    }

    static __domProperties(dom, obj) {
        if (!_.isObject(obj)) return;       // only process if obj
        TmvFormUtils.__putAttrs(dom, obj.attrs);
        TmvFormUtils.__putClass(dom, obj.cssClass);
        TmvFormUtils.__putStyle(dom, obj.cssStyle);
    }

    static __putAttrs(dom, attrs) {
        if (_.isObject(attrs)) {
            _.each(attrs, (v, k) => {
                dom.attr(k, v);
            });
        }
    }

    static __putClass(dom, cssClass) {
        if (_.isString(cssClass)) dom.addClass(cssClass);
    }

    static __putStyle(dom, cssStyle) {
        if (_.isObject(cssStyle)) dom.css(cssStyle);
    }

    static __putGrid(dom, gridClass) {
        if (_.isString(gridClass)) dom.addClass(gridClass);
    }

    static __errorsSpacer() {
        return angular.element('<div>').addClass('md-errors-spacer');
    }

    static __putProperties(dom, schema, props, prefix = '') {
        _.each(props, v => {
            if (schema[v] !== undefined) {
                dom.attr(`${prefix}${_s.dasherize(v)}`, schema[v]);
            }
        })
    }

    static __injectNgServices(self, args) {
        if (_.isArray(self.constructor.$inject)) {
            _.each(self.constructor.$inject, (v, k) => {
                self[v] = args[k];
            })
        }
    }

    static __layoutProperties(dom, schema) {
        _.each(schema, (v, k) => {
            k = _s.dasherize(k);
            if (k.startsWith('layout')) {
                dom.attr(k, v);
            }
        })
    }

    static __flexProperties(dom, schema) {
        _.each(schema, (v, k) => {
            k = _s.dasherize(k);
            if (k.startsWith('flex')) {
                dom.attr(k, v);
            }
        })
    }

    static __infoText(infoText) {
        let infoTextTemplate = `<div class="info-text-wrapper"><span class="info-text" translate="${infoText}"></span></div>`
        return angular.element(infoTextTemplate);
    }

    static __hintText(hintText, hintLabel) {
        hintLabel = hintLabel || '';
        let hintTemplate = `<div class="info-text-wrapper"><nbgen-hint value="${hintText}" hint-label="${hintLabel}"></nbgen-hint></div>`;
        return angular.element(hintTemplate);
    }
}
