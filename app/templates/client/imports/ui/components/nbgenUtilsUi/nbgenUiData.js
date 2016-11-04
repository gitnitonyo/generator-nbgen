import angular from 'angular'

import nbgenUtilsUi from './nbgenUtilsUi.js'

import template from './nbgenUiData.html'

angular.module(nbgenUtilsUi)
.factory('$tmvUiData', function($mdDialog, $mdMedia, $interpolate) {
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
        let controller = options.controller || _formDialogController

        function _formDialogController($scope, $reactive, $injector) {
            'ngInject'

            let vm = $scope.$tmvCollection = this   // for consistent access in ui-config
            vm.$scope = $scope
            vm.$injector = $injector

            $reactive(this).attach($scope);
            if (options.docId && !options.formModel) {
                this.helpers({
                    formModel() {
                        return options.collection.findOne({_id: options.docId});
                    }
                })
            } else {
                vm.formModel = options.formModel || { }  // creating new doc
            }
            vm.cssClass = options.cssClass
            vm.$currentItem = vm.formModel      // for consistent access in ui-config
            vm.$mdDialog = $mdDialog
            if (options.formSchema) {
                vm.formSchema = options.formSchema
                vm.formSchema.translatePrefix = vm.formSchema.translatePrefix || options.translatePrefix
                vm.mode = options.mode || 'edit'
                vm.readOnly = (vm.mode === 'view')
            }
            vm.template = options.template

            // set dialog title
            if (options.title) {
                vm.dlgTitle = options.title
            } else {
                if (options.mode === 'new') {
                    vm.dlgTitle = vm.formSchema.translatePrefix + '.home.createNew'
                } else if (vm.formSchema.detailsTitle) {
                    vm.dlgTitleInterpolated = true
                    vm.dlgTitle = $interpolate(vm.formSchema.detailsTitle)(vm.formModel)
                }
            }

            vm.okLabel = options.okLabel || 'global.common.save'
            vm.cancelLabel = options.cancelLabel || 'global.common.cancel'

            // bound any functions specified
            let fns = options.functions || options.includedFunctions
            if (angular.isObject(fns)) {
                angular.forEach(fns, function(fn, key) {
                    vm[key] = angular.bind(vm, fn);
                })
            }

            vm.okFn = function() {
                if (options.okFn) {
                    // if provided function must close the dialog with provided $mdDialog
                    options.okFn(vm.formModel, $mdDialog)
                } else {
                    $mdDialog.hide(vm.formModel)
                }
            }

            vm.cancelFn = function() {
                if (options.cancelFn) {
                    // if provided function must close the dialog with provided $mdDialog
                    options.cancelFn($mdDialog)
                } else {
                    $mdDialog.cancel()
                }
            }

            vm.$initController && vm.$initController.apply(vm, arguments)
        }

        let resolve = options.resolve || { }
        if (options.i18nPart) {
            resolve.translatePartialLoader = ['$translate', '$translatePartialLoader',
                function($translate, $translatePartialLoader) {
                    $translatePartialLoader.addPart(options.i18nPart)
                    return $translate.refresh()
                }]
        }

        return $mdDialog.show({
            template,
            parent: angular.element('body'),
            autoWrap: false,
            clickOutsideToClose: false,
            escapeToClose: false,
            bindToController: true,
            controllerAs: 'vm',
            // fullscreen: $mdMedia('xs'),
            targetEvent: options.targetEvent,
            controller: controller,
            locals: options.locals || { },
            resolve: resolve
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
