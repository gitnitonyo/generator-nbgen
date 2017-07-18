import { NbgenCollectionBaseCtrl } from '/client/imports/ui/components/nbgenUtilsUi/nbgenCollection/nbgenCollectionv2.js';
import { <%= collection.name %> } from '/imports/common/<%= collectionName %>/collection.js';

import config from './<%= collectionName %>Config.js';

const subscription = '<%= collectionName %>';
const collection = <%= collection.name %>;

export class <%= collection.name %>Ctrl extends NbgenCollectionBaseCtrl {
    constructor($scope, $injector) {
        'ngInject';

        super($scope, $injector);
    }

    // lifecycle methods; check angular docs for details
    $onInit() {
        // all controllers have been initialized
        if (!this.uiLayout) {
            this.uiLayout = config.uiLayout || { };
        }
        if (!this.subscription) {
            this.subscription = subscription;
        }
        if (!this.collection) {
            this.collection = collection;
        }
        if (!this.options) {
            this.options = config.options || { };
        }

        super.$onInit && super.$onInit();
        // put codes here
    }

    $onChanges(changesObj) {
        super.$onChanges && super.$onChanges(changesObj);
        // put codes here
    }

    $doCheck() {
        super.$doCheck && super.$doCheck();
        // put codes here
    }

    $onDestroy() {
        super.$onDestroy && super.$onDestroy();
        // put codes here
    }

    $postLink() {
        super.$postLink && super.$postLink();
        // put codes here
    }

    // declare and define methods and properties here which can be accessed
    // into the view using '$tmvCollection' scope variable

}
