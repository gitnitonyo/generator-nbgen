/**
 * 3rd iteration for collection more modular
 */
import _ from 'underscore';
import _s from 'underscore.string';
import angular from 'angular';
import listActions from './tmvCollectionListActions.html';

import { USED_NG_SERVICES } from './tmvCollectionCommon.js';
import { TmvCollectionBase } from './tmvCollectionBase';



export class TmvCollectionListBaseCtrl extends TmvCollectionBase {
    /**
     * $options can be injected via resolve
     */
    constructor($scope, $injector, $element) {
        'ngInject';

        super();
        this.$scope = $scope;
        this.$injector = $injector;
        this.$element = $element;

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
        this.__processOptions();

        this.enableScrollShrink();

        if (this.layout.tabular === undefined) this.layout.tabular = true;

        this.$init && this.$init.call(this);
    }

    enableScrollShrink() {
        if (this.layout.enableScrollShrink === undefined) {
            this.layout.enableScrollShrink = true;
        }

        if (this.layout.enableScrollShrink !== true) return;        // not setting
        const toolbarToShrink = '.nbgen-main-toolbar';
        const elemToScroll = '.md-virtual-repeat-scroller';
        const $$rAF = this.$injector.get('$$rAF');
        if (!$$rAF) return;     // this service don't exist

        let prevScrollTop = 0,
            shrinkSpeedFactor = 0.5,
            y = 0,
            toolbarHeight = 48;

        const toolbarElement = angular.element(toolbarToShrink);
        if (toolbarElement.length === 0) return;        // no toolbar element found

        const origMarginTop = toolbarElement.css('margin-top');

        function onScroll(e) {
            toolbarHeight = toolbarElement.height();
            let scrollTop = e ? e.target.scrollTop : prevScrollTop;

            y = Math.min(toolbarHeight / shrinkSpeedFactor, Math.max(0, y + scrollTop - prevScrollTop));
            let topmargin = -y * shrinkSpeedFactor + 'px';

            toolbarElement.css({'margin-top': topmargin});
            
            prevScrollTop = scrollTop;
        }
        let debouceOnScroll = $$rAF.throttle(onScroll.bind(this));
        const scrollElement = this.$element.find(elemToScroll)
        if (scrollElement.length === 0) return;     // no scroller element found
        scrollElement.bind('scroll', debouceOnScroll);

        this.disableScrollShrink = () => {
            y = 0;
            toolbarElement.css({'margin-top': origMarginTop});
        }

        this.autorun(() => {
            this.getReactively('$state.current.name');
            if (this.isInForm()) {
                this.disableScrollShrink && this.disableScrollShrink();
            }
        })
    }

    $onDestroy() {
        this.disableScrollShrink && this.disableScrollShrink();
    }

    /**
     * setup services injected into the controller
     */
    __setupInjectedServices(injectedServices) {
        injectedServices = injectedServices.concat(this.constructor.$inject || []);
        _.each(injectedServices, v => { if (!this[v]) this[v] = this.$injector.has(v) && this.$injector.get(v) });
        this.$identityService = this.$nbgenIdentityService;     // for compatibility with others
    }

    /**
     * Returns true if in tabular mode. Tabular mode is disabled when screen is small
     */
    isTabular() {
        return (this.layout.tabular === true && this.$mdMedia('gt-xs'));
    }

    /**
     * process the option passed into the controller
     */
    __processOptions() {
        this.layout = this._getListLayout();
        this.layout.context = this.layout.context || this;
        const injectedServices = [].concat(this.options.injectedServices, this.layout.injectedServices);
        this.__setupInjectedServices(injectedServices);

        this.subscription = this._getSubscription();
        this.collection = this._getCollection();

        this.translatePrefix = this.translatePrefix || this.options.translatePrefix || '';
        this.actionsTemplate = this.layout.actionsTemplate || listActions;

        // inject boolean functions
        let optionsList = ['hideAdd', 'hideDelete', 'hideEdit', 'hideAction', 'titleDisplay'];
        _.each(optionsList, v => {
            this.__injectFn(v, this.layout[v]);
        });

        // bound locals
        _.extend(this, this.options.locals, this.layout.locals);

        // bound functions
        let fns = _.extend({}, this.options.functions, this.layout.functions, this.layout.includedFunctions);
        _.each(fns, (v, k) => {
            if (_.isFunction(v)) this[k] = v.bind(this);
        });

        // initialize data reactively
        this._initReactiveData();
    }

    __injectFn(fnName, fn) {
        if (fn) {
            if (_.isFunction(fn)) {
                this[fnName] = fn.bind(this);
            } else {
                this[fnName] = () => fn;
            }
        }
    }

    // may be overriden to provide custom list layout
    _getListLayout() {
        return this.options.listLayout;
    }

    // initialize reactive data
    _initReactiveData() {
        this.hasSearchField = false;
        if (this.layout && _.isArray(this.layout.fields)) {
            this.hasSearchField = !_.isEmpty(_.find(this.layout.fields, function(field) {
                return field.searchField === true || _.isString(field.searchField) || _.isArray(field.searchField)
            }))
        }

        // define reactive variables
        if (_.isObject(this.layout.initialSort)) {
            this.sort = this.layout.initialSort
        } else {
            // make the first field defined in the layout to be the initial sort
            this.sort = {}
            // if (this.layout && this.layout.fields.length > 0) {
            //     this.sort[this.layout.fields[0].fieldName] = 1;
            // }
            // find the field with initial sort setting
            const sortField = _.find(this.layout.fields, f => f.initialSort === true)
            if (sortField) this.performSort(sortField);
        }
        this.searchText = '';
        this.pageSize = this.options.pageSize || 50;
        this.numItemsToLoad = this.pageSize;
        this.filter = this.filter || { }
        this.specialFilter = this.specialFilter || { }
        this.searchFilter = this.searchFilter || { }

        this.$reactive(this).attach(this.$scope);
        this._performSubscription();
        this._performHelpers();

        this._initiateSearchMonitor();
    }

    // initialize subscription of data
    _performSubscription() {
        if (!this.subscription) { this.$subscriptionReady = true; return }
        this.autorun(() => {
            this.$connectionStatus = this.$Meteor.status();     // this is reactive
            // stop any pending subscription first
            this.$subsHandle && this.$subsHandle.stop();
            this.$subscriptionReady = false;
            if (this.$connectionStatus.connected) {
                this.$subsHandle = this.initSubscription(this.subscription, () => {
                    this.$subscriptionReady = false;
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
                        this.$subscriptionReady = true;
                    },
                    onReady() {
                        this.$subscriptionReady = true;
                    }
                })
            } else {
                this.$subscriptionReady = true;
            }
        })
    }

    _performHelpers() {
        this.helpers({
            // retrieve the list of items from the collection
            $items() {
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

            // return the number of items from the collection
            $collectionCount() {
                let newCount;
                if (this.subscription && this.layout.hasNoCount !== true) {
                    const subsCount = `${this.subscription}.count`;
                    newCount = this.$Counts.get(subsCount);
                } else {
                    const items = this.getReactively('$items');
                    newCount = (items && items.length) || 0;
                }

                return newCount;
            },
        });
    }

    _initiateSearchMonitor() {
        // for handline search
        const _searchRefreshFn = _.debounce(this.$bindToContext(this.handleSearch.bind(this)), 300);
        this.autorun(() => {
            _searchRefreshFn.call(this, this.getReactively('searchText'));
        })
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
                if (_.isString(fieldSchema.searchField)) {
                    searchField = [fieldSchema.searchField]
                } else if (!_.isArray(fieldSchema.searchField) && fieldSchema.searchField) {
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

    // use as selector for retrieving items from collection
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

        if (_.isFunction(this.layout.dataFilter)) {
            const dataFilter = this.layout.dataFilter.call(this.layout.context || this);
            if (!dataFilter) {
                filter.push(dataFilter);
            }
        }

        if (filters.length === 0) {
            return { }
        }
        if (filters.length === 1) {
            return filters[0]
        }

        return { $and: filters }
    }

    // use by $tmvList to retrieve a particular item
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

    // used by $tmvList to determine number of items
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
    
    // can be overriden to pass extra parameters to the route
    getExtraRouteParameters() {
        return undefined;
    }

    gotoForm(itemId, viewMode) {
        const params = {doc: itemId, viewMode: viewMode};
        const extraParams = this.getExtraRouteParameters();
        if (extraParams) {
            params.extra = JSON.stringify(extraParams);
        }
        this.$state.go('.form', params);
    }

    // can be overriden to either force or prevent a mode for particular events
    _getViewMode(eventType) {
        return eventType || 'view';
    }

    // click operations may be overriden
    itemClick(event, item, index) {     // eslint-disable-line
        Promise.resolve(this.beforeItemClick && this.beforeItemClick(item, index)).then(() => {
            // perform operation when click
            this.gotoForm(item._id, this._getViewMode('view'));
        })
    }

    editClick(event, item, index) {     // eslint-disable-line
        Promise.resolve(this.beforeEditClick && this.beforeEditClick(item, index)).then(() => {
            this.gotoForm(item._id, this._getViewMode('edit'));
        })
    }

    
    deleteClick(event, item, index) {   // eslint-disable-line
        Promise.resolve(this.beforeDeleteClick && this.beforeDeleteClick(item, index)).then(() => {
            this.gotoForm(item._id, this._getViewMode('del'));
        })
    }

    addClick(event) {       // eslint-disable-line
        Promise.resolve(this.beforeAddClick && this.beforeAddClick()).then(() => {
            this.gotoForm('_blank', this._getViewMode('new'));
        })
    }

    /**
     * Returns the title to be displayed
     */
    titleDisplay() {
        return this.$translate.instant(this.translatePrefix + '.home.title')
    }

    /**
     * Returns true if search box has to be displayed
     * @return {Boolean} indicates whether search box has to be displayed
     */
    displaySearch() {
        return this.hasSearchField
    }

    isInForm() {
        return /\.form$/.test(this.$state.current.name);
    }

    isFieldSortable(field) {
        return !! field.sortingFields;
    }

    performSort(field) {
        const fieldName = field.fieldName;
        if (fieldName === this.sortingField) {
            this.sortingDirection = -this.sortingDirection
        } else {
            this.sortingField = fieldName;
            this.sortingDirection = 1;
        }
        const sortParam = { };
        const sortingDirection = this.sortingDirection;
        let sortingFields;
        if (_.isBoolean(field.sortingFields) && field.sortingFields === true) {
            sortingFields = [field.fieldName];
        } else if (!_.isArray(field.sortingFields)) {
            sortingFields = [field.sortingFields]
        } else {
            sortingFields = field.sortingFields;
        }

        _.each(sortingFields, (sortField) => {
            sortParam[sortField] = sortingDirection;
        })

        this.sort = sortParam;
    }
}
