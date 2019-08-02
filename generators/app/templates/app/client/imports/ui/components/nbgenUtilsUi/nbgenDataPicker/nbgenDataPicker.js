
import angular from 'angular';
import _ from 'underscore';
import nbgenUtilsUi from '../nbgenUtilsUi.js';

import { Mongo } from '../../nbgenMeteor';

const name = 'nbgenDataPicker'
import template from './nbgenDataPicker.html';
import templateMultiple from './nbgenDataPickerMultiple.html';

angular.module(nbgenUtilsUi)
    .factory(name, nbgenDataPickerFactory);

function nbgenDataPickerFactory($tmvUiData) {
    'ngInject';

    return function nbgenDataPicker(title, collection, subscription, layout, dlgOptions) {
        const baseOptions = {
            title,
            template,
            cssClass: 'nbgen-data-picker',
            noReactive: true,
        };

        if (arguments.length <= 4) {
            // adjust parameters
            dlgOptions = layout;
            layout = subscription;
            subscription = collection;
            collection = null
        }

        if (_.isString(collection)) {
            // this is probably a local collection
            collection = Mongo.Collection.get(collection);
        }

        // if dlgOptions is a boolean; assume this is switch whether multiple or single
        if (_.isBoolean(dlgOptions)) {
            dlgOptions = {pickMultiple: dlgOptions};
        } else if (!dlgOptions) {
            // assume to select only single
            dlgOptions = {pickMultiple: false};
        }

        if (_.isString(layout)) {
            // construct layout based on the passed strings
            let parts = layout.split(/\s+|,\s*/);
            layout = {
                displayAvatar: false,
                fields: [ ],
            };
            parts.forEach((v, i) => {
                layout.fields.push({ fieldName: v, searchField: true });
                if (i === 0) layout.initialSort = {[v]: 1};
            });
        }

        if (!collection) {
            // assume the collection is the same subscription
            collection = Mongo.Collection.get(subscription);
        }

        const includedFunctions = {
            $initController: function() {
                this.layout = layout
                this.collection = collection;
                this.subscription = subscription;
                this.pickMultiple = (dlgOptions && dlgOptions.pickMultiple);
                this.miscData = (dlgOptions && dlgOptions.miscData) || { };
                this.dataFilter = (dlgOptions && dlgOptions.dataFilter);
                if (this.pickMultiple) {
                    this.layout.actionTemplate = templateMultiple;
                    this.miscData.pmData = dlgOptions.pickMultipleObj;
                    this.miscData.pmDataOnChange = function(item, pmData) {
                        if (pmData.selectedCodes[item._id]) {
                            pmData.selectedObjs[item._id] = item;
                        } else {
                            delete pmData.selectedObjs[item._id];
                        }
                    }
                }
            },
            hideAction: function() {
                return this.pickMultiple !== true;
            },
            itemSelected: function(event, item) {
                if (this.pickMultiple !== true) {
                    this.hide(item);
                } else {
                    if (this.miscData && this.miscData.pmData && this.miscData.pmData.selectedCodes) {
                        this.miscData.pmData.selectedCodes[item._id] = !this.miscData.pmData.selectedCodes[item._id];
                        this.miscData.pmDataOnChange && this.miscData.pmDataOnChange(item, this.miscData.pmData);
                    }
                }
            }
        }
        dlgOptions = dlgOptions || {};
        dlgOptions.includedFunctions = angular.extend({}, includedFunctions, dlgOptions.includedFunctions || dlgOptions.functions || {});

        const options = angular.extend({}, baseOptions, dlgOptions);
        return $tmvUiData.formDialog(options);
    }
}
