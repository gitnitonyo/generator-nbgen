import angular from 'angular';
import _ from 'underscore';
import nbgenUtilsUi from '../nbgenUtilsUi.js';
import { Mongo } from '../../nbgenMeteor';
import { Counts } from '../../nbgenMeteor';

import template from './nbgenDbList.html';

const name = 'nbgenDbList';

/* globals DDP */

class NbgenDbListCtrl {
    constructor($scope, $reactive, $injector) {
        'ngInject';

        this.$tmvUiUtils = $injector.get('$tmvUiUtils');
        this.$timeout = $injector.get('$timeout');

        $reactive(this).attach($scope);
        this.$scope = $scope;
    }

    $onInit() {
        if (this.contextStr) {
            this.$scope[this.contextStr] = this.$scope.$parent[this.contextStr];
        }

        // try to locate proper collection if only subscription is passed
        if (this.subscription && !this.collection) {
            this.collection = Mongo.Collection.get(this.subscription);
        }
        if (_.isString(this.collection)) {
            this.collection = Mongo.Collection.get(this.collection);
        }

        if (!this.collection) {
            throw new Error("No collection specified in db list");
        }
        this.filter = { };
        this.searchFilter = { };
        this.specialFilter = { };
        this.pageSize = 30;
        this.numItemsToLoad = this.pageSize;
        this.layout = this.nbgenLayout({$collection: this.collection, $subscription: this.subscription});

        // define reactive variables
        if (angular.isObject(this.layout.initialSort)) {
            this.sort = this.layout.initialSort
        } else {
            // make the first field defined in the layout to be the initial sort
            this.sort = {}
            // if (this.layout && this.layout.fields && this.layout.fields.length > 0) {
            //    this.sort[this.layout.fields[0].fieldName] = 1;
            // }
        }

        this.hasSearchField = false;
        if (this.layout && angular.isArray(this.layout.fields)) {
            this.hasSearchField = !_.isEmpty(_.find(this.layout.fields, function(field) {
                return field.searchField === true || angular.isString(field.searchField) || angular.isArray(field.searchField)
            }))
        }

    }

    $postLink() {

        // this.$scope.$watch('nbgenDbList.searchText', _.debounce(this.$bindToContext(angular.bind(this, this._handleSearch)), 300));
        const _refreshFn = _.debounce(this.$bindToContext(angular.bind(this, this._handleSearch)), 300);
        this.autorun(() => {
            _refreshFn.call(this, this.getReactively('searchText'));
        })

        this.$timeout(() => {
            this._performSubscription();
            this._performHelpers();
        })
    }

    isSubscriptionReady() {
        if (this.$items && this.$items.length > 0 && this.$items.length === this.$collectionCount) return true;
        return this.$subscriptionReady || DDP._allSubscriptionsReady();
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

        const dataFilter = this.filterFn.call(this.layout.context || this, {$self: this});
        if (dataFilter) {
            filters.push(dataFilter);
        }

        if (_.isFunction(this.layout.dataFilter)) {
            const dataFilter = this.layout.dataFilter.call(this.layout.context || this);
            if (dataFilter) {
                filters.push(dataFilter);
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

    _performSubscription() {
        if (this.subscription) {
            this.$subsHandle = this.subscribe(this.subscription, () => {
                this.$subscriptionReady = false;
                const filter = this.getReactively('filter');
                const searchFilter = this.getReactively('searchFilter');
                const specialFilter = this.getReactively('specialFilter');
                const limit = parseInt(this.getReactively('numItemsToLoad'));
                const sort = this.getReactively('sort');
                const filters = this._constructFilters(filter, searchFilter, specialFilter);
                return [filters, {sort: sort, limit: limit}]
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
    }

    _performHelpers() {
        this.helpers({
            // list of items unlist noList option is specified
            $items() {
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
                if (this.subscription) {
                    const subsCount = `${this.subscription}.count`;
                    return Counts.get(subsCount);
                }
                return this.$items && this.$items.length;
            },
        })
    }

    // required by tmv-list
    indexAt(index) {
        if (this.$items && index < this.$items.length) return this.$items[index];

        // increment the number of items to loader
        this.$bindToContext(() => {
            let numItemsToLoad = (Math.floor(index / this.pageSize) + 1) * this.pageSize;
            if (numItemsToLoad !== this.numItemsToLoad) {
                this.numItemsToLoad = numItemsToLoad;
            }
        })();
    }

    // required by tmv-list
    itemCount() {
        return this.$collectionCount;
    }

    // for searching
    _handleSearch(searchString) {
        // empty items
        // this.$items = [ ];
        this.numItemsToLoad = this.pageSize;        // reset the items to load

        // construct selectors
        if (_.isEmpty(searchString)) {
            this.searchFilter = {};
            return;
        }

        let selectors = [];
        this.layout.fields.forEach((fieldSchema) => {
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
        });
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

}


/**
 * register the component
 */
angular.module(nbgenUtilsUi)
    .component(name, {
        template,
        controllerAs: name,
        controller: NbgenDbListCtrl,
        bindings: {
            collection: '<',    // collection to be list
            subscription: '@',  // name of the subscription
            nbgenLayout: '&',        // layout object
            initials: '=',
            onClick: '&',
            onEdit: '&',
            onDelete: '&',
            hideEdit: '&',
            hideDelete: '&',
            hideAction: '&',
            deleteLabel: '<',
            editLabel: '<',
            miscData: '=',
            filterFn: '&',
            contextStr: '@context',
        }
    })
