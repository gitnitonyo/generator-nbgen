import { NbgenCollectionBaseCtrl } from '<%= componentsImportDir %>/nbgenUtilsUi/nbgenCollectionv2.js';
import { <%= collection.name %> } from '<%= commonImportDir %>/<%= collectionName %>/collection.js';

import config from './<%= collectionName %>Config.js';

const subscription = '<%= collectionName %>';
const collection = <%= collection.name %>;

export class <%= collection.name %>Ctrl extends NbgenCollectionBaseCtrl {
    constructor($scope, $injector) {
        'ngInject';

        super($scope, $injector);
        this.subscription = subscription;
        this.collection = collection;
        this.uiLayout = config.uiLayout || { };
        this.options = config.options || { };
    }

    // lifecycle methods; check angular docs for details
    $onInit() {
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
