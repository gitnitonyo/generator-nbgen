import angular from 'angular'
import _ from 'underscore';
import nbgenUtilsUi from '../nbgenUtilsUi.js';
import { TmvBaseFormController } from '../../nbgenForm';

import template from './nbgenUiData.html'

/**
 * Controller class for the form dialog
 */
class FormDialogController extends TmvBaseFormController {
    constructor($injector, $scope, $options, $currentItem, mdPanelRef) {
        'ngInject';

        super($injector, $scope, $options, $currentItem);
        this.$mdPanelRef = mdPanelRef;
    }

    getDialogTitle() {
        return this.getFormTitle();
    }

    okFn() {
        if (this.$options.okFn) {
            // if provided function must close the dialog with provided $mdDialog
            this.$options.okFn.call(this, this.formModel, this)
        } else {
            this.hide(this.formModel);
        }
    }

    cancelFn() {
        if (this.$options.cancelFn) {
            // if provided function must close the dialog with provided $mdDialog
            this.$options.cancelFn.call(this, this);
        } else {
            this.close();
        }
    }

    hide(data) {
        this._closeDialog({action: 'ok', data});
    }

    close(data) {
        this._closeDialog({action: 'cancel', data});
    }

    _closeDialog(reason) {
        this.$mdPanelRef && this.$mdPanelRef.close(reason).then(() => {
            this.$mdPanelRef.destroy();
        })
    }
}


angular.module(nbgenUtilsUi)
.factory('$tmvUiData', function($mdMedia, $interpolate, $mdPanel) {
    'ngInject'

    // displays modal dialog for editing the form
    /**
     * Displays an modal dialog containing form describe in the schema
     * @param options
     * @description
     * `options` may contain the ff:
     *      formSchema - the form schema used to layout the form; required
     *      docId - the document id; required
     *      collection - the collection to used to search for the doc
     *      formModel - no subs will happen if this is passed
     *      translatePrefix - translation prefix; must either be specified or contained in the form schema
     *      mode - either view, edit or new. default to view
     *      scope - parent scope to use; optional
     *      title - title to be displayed in the dialog; if not specified detailsTitle property in form
     *              schema will be interpolated
     *      okFn - executes when ok button is pressed; optional
     *      okLabel - customize label for Save button
     *      cancelFn - executes when cancel button is pressed optional
     *      cancelLabel - customize for Cancel button
     *      injectedFunctions - an object where each property is a function; these will be injected and bound into the controller
     *                          used if you want to call these functions inside the formSchema
     *      targetEvent - passed into mdDialog
     * @returns {promise}
     */
    function formDialog(options) {
        // ensure proper caring if own controller is provided
        let controller = options.controller || FormDialogController;

        let resolve = options.resolve || { }
        resolve.$options = [function() {
            return new Promise((_resolve) => _resolve(options));
        }];

        resolve.$currentItem = [function() {
            return new Promise((_resolve) => _resolve(options.formModel))
        }]

        let i18nPart = options.i18nPart || options.i18npart;
        if (i18nPart) {
            if (!_.isArray(i18nPart)) i18nPart = [i18nPart];
            resolve.translatePartialLoader = ['$translate', '$translatePartialLoader',
                function($translate, $translatePartialLoader) {
                    i18nPart.forEach(v => $translatePartialLoader.addPart(v))
                    return $translate.refresh();
                }]
        }
        let dialogTemplate = template;
        let panelClass = 'nbgen-dialog';
        if (options.controller) {
            dialogTemplate = options.template;
            panelClass = '';
        } else if (options.useTemplateInFull) {
            dialogTemplate = options.template;
            panelClass = 'tmv-full-dialog-template';
        }

        return new Promise((_resolve, _reject) => {

            if (options.cssClass) {
                panelClass += ' ' + options.cssClass;
            }
            const dialogPosition = $mdPanel.newPanelPosition()
                .absolute()
                .center();

            const dialogAnimation = $mdPanel.newPanelAnimation()
                .duration(200)
                .withAnimation($mdPanel.animation.FADE);

            if (options.targetEvent) {
                dialogAnimation.targetEvent(options.targetEvent);
            } else {
                dialogAnimation.openFrom({top: 0, left: 0})
                    .closeTo({top: 0, left: 0});
            }

            const config = {
                attachTo: angular.element(document.body),
                controller: controller,
                controllerAs: options.controllerAs || 'vm',
                template: dialogTemplate,
                clickOutsideToClose: options.clickOutsideToClose !== undefined ? options.clickOutsideToClose : false,
                escapeToClose: options.escapeToClose !== undefined ? options.escapeToClose : false,
                bindToController: true,
                position: options.dialogPosition || dialogPosition,
                trapFocus: true,
                focusOnOpen: true,
                // disableParentScroll: true,
                hasBackdrop: options.hasBackdrop !== undefined ? options.hasBackdrop : false,
                resolve: resolve,
                panelClass,
                animation: dialogAnimation,

                locals: options.controller !== undefined ? options.locals : undefined,

                onCloseSuccess(panelRef, reason) {
                    if (angular.isObject(reason)) {
                        if (reason.action === 'ok') {
                            _resolve(reason.data);
                        } else {
                            _reject(reason.data);
                        }
                    } else {
                        _reject();
                    }
                },

                onDomAdded(args) {
                    let panelRef = args[1];
                    if (panelRef && panelRef.panelContainer) {
                        panelRef.panelContainer.addClass('tmv-panel-wrapper');  // add this class for special styling
                    }
                    options.onDomAdded && options.onDomAdded.apply(this, arguments);
                },

                onDomRemoved() {
                    if (options.onDomRemoved) {
                        options.onDomRemoved.apply(this, arguments);
                    } else {
                        angular.noop();
                    }
                },

                onOpenComplete() {
                    if (options.onOpenComplete) {
                        options.onOpenComplete.apply(this, arguments);
                    } else {
                        angular.noop();
                    }
                },

                onRemoving() {
                    if (options.onRemoving) {
                        options.onRemoving.apply(this, arguments);
                    } else {
                        angular.noop();
                    }
                }
            }

            options.onOpening && options.onOpening();
            let mdPanelRef = $mdPanel.create(config);
            mdPanelRef.open();
        })
    }

    /**
     * Wraps the specified array of field specs to formLayout which can be used
     * in tmvForm directive
     * @param fieldsArray - array of fields
     * @param translatePrefix - translatePrefix to include in the resulting formSchema
     */
    function wrapsFieldsToFormLayout(fieldsArray, translatePrefix) {
        return {
            translatePrefix: translatePrefix || '',
            formLayout: {formGroups: [{fields: fieldsArray}]}
        }
    }

    return {
        formDialog: formDialog,
        wrapsFieldsToFormLayout: wrapsFieldsToFormLayout
    }
})
.factory('$tmvDynamicItems', function($tmvUtils) {
    'ngInject'

    /**
     * @function
     * @param params
     * @description
     * A function which can return an object
     * which can be used in virtual repeat container in ngMaterial
     * the params will have the ff. properties
     * dataService - a service with a query call
     * queryMethod - default to 'query'
     * queryParams - additional query parameters
     * searchFields - array of fields to be search against
     * searchInput - a string pointing to scope variable that needs to be watch for searching
     * scope - scope to use for watching the search input
     * pageSize - default to 50
     * loadingCallback - a callback function when user has loaded; a boolean is passed if data is loading
     * pageNumAttrName - attribute for page number to be passed to the service
     * pageSizeAttrName - attribue for page size to be passed to the service
     */
    let fromServiceItems = function(params) {
        let dataService = params.dataService;
        let queryCall = params.queryMethod || 'query';
        let pageNumAttrName = params.pageNumAttrName || 'page';
        let pageSizeAttrName = params.pageSizeAttrName || 'size';
        let pageSize = params.pageSize || 50;

        let DynamicItems = function() {
            this.loadedPages = { };
            this.numItems = undefined;
            this.pageSize = pageSize;
            this.searchText = null;
            this.searchFields = (params.searchFields || []).join('|');
            this.sortDir = 'asc';
            this.loadingCb = params.loadingCallback || angular.noop;
            this.maxPageBufferSize = 3;
            this.scope = params.scope;
            this.searchInput = params.searchInput;
            this.requestCounter = 0;
            this.queryParams = params.queryParams || { };

            let _this = this;
            if (params.scope && params.searchInput) {
                let debounced = $tmvUtils.debounce(angular.bind(_this, _this.search), 500);
                params.scope.$watch(params.searchInput, debounced);
            }
        };

        DynamicItems.prototype.search = function(searchText) {
            let _this = this;
            if (_this.searchFields && _this.searchFields.length > 0) {
                _this.searchText = searchText;
                _this.refreshItems();
            }
        };

        DynamicItems.prototype.pendingRequestsCount = function() {
            return this.requestCounter;
        };

        DynamicItems.prototype.getItemAtIndex = function(index) {
            let _this = this;
            let pageNumber = Math.floor(index / _this.pageSize);
            let page = _this.loadedPages[pageNumber];
            let numPages = Math.ceil(_this.numItems / _this.pageSize);
            let item;
            if (page) {
                item = page[index % _this.pageSize];

            } else {
                _this._fetchPage(pageNumber);
            }

            if (index % _this.pageSize === 0) {
                // try to free up the 2 pages before and after to free up memories
                let _pageToRemove = (pageNumber - _this.maxPageBufferSize);
                if (_pageToRemove >= 0 && _this.loadedPages[_pageToRemove]) {
                    _this.loadedPages[_pageToRemove] = undefined;
                }
                _pageToRemove = pageNumber + _this.maxPageBufferSize;
                if (_pageToRemove < numPages && _this.loadedPages[_pageToRemove]) {
                    _this.loadedPages[_pageToRemove] = undefined;
                }

                // to preload pages
                let pageCount = 1;
                while ((pageNumber - pageCount) >= 0 && pageCount < _this.maxPageBufferSize) {
                    if (!_this.loadedPages[pageNumber - pageCount]) {
                        _this._fetchPage(pageNumber - pageCount);
                    }
                    pageCount++;
                }
                pageCount = 1;
                while ((pageNumber + pageCount) < numPages && pageCount < _this.maxPageBufferSize) {
                    if (!_this.loadedPages[pageNumber + pageCount]) {
                        _this._fetchPage(pageNumber + pageCount);
                    }
                    pageCount++;
                }
            }

            return item;
        };


        DynamicItems.prototype.getLength = function() {
            return this.numItems;
        };

        DynamicItems.prototype.sort = function(sortField) {
            let _this = this;
            if (sortField) {
                if (_this.sortField === sortField) {
                    _this.sortDir = _this.sortDir === 'asc' ? 'desc' : 'asc';
                }
                _this.sortField = sortField;
                _this.refreshItems();
            }
        };

        DynamicItems.prototype._constructQueryParams = function (pageNumber) {
            let requestParam = angular.extend({}, this.queryParams);
            requestParam[pageSizeAttrName] = this.pageSize;
            requestParam[pageNumAttrName] = pageNumber;
            if (this.searchFields) {
                requestParam.searchFields = this.searchFields;
                requestParam.search = this.searchText;
            }
            if (this.sortField) {
                requestParam.sort = this.sortField;
                requestParam.sortdir = this.sortDir;
            }

            return requestParam;
        };


        // refresh the pages
        DynamicItems.prototype.refreshItems = function () {
            this.loadedPages = { };
            this.getItemAtIndex(0);
        };

        DynamicItems.prototype._fetchPage = function(pageNumber) {
            let _this = this;
            if (_this.loadedPages[pageNumber] === null) return;    // currently loading
            _this.loadedPages[pageNumber] = null;
            _this.requestCounter ++;
            _this.loadingCb(true, _this.requestCounter, pageNumber);
            let requestParam = _this._constructQueryParams(pageNumber);
            dataService[queryCall](requestParam, function(items, header) {
                _this.requestCounter --;
                _this.numItems = header('x-total-count');
                _this.loadedPages[pageNumber] = items;
                _this.loadingCb(false, _this.requestCounter, pageNumber, items);
            }, function(errorResponse) { // eslint-disable-line
                _this.requestCounter --;
                _this.loadedPages[pageNumber] = undefined;
                _this.loadingCb(false, _this.requestCounter, pageNumber);
                // TODO: handle error
            })
        };

        return new DynamicItems();
    };

    let fromArrayItems = function(items) {
        items = items || [];
        return {
            getLength: function() { return items.length; },
            getItemAtIndex: function(index) { return items[index]; }
        }
    };

    let $tmvDynamicItems = {
        fromService: fromServiceItems,
        fromArray: fromArrayItems
    };

    return $tmvDynamicItems;
})
