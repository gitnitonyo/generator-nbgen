import { NbgenCollectionBaseCtrl } from '../../../nbgenUtilsUi/nbgenCollectionv2.js';
import { ServiceConfigurations } from '/imports/common/serviceConfigurations/collection.js';
import config from './serviceConfigurationsConfig.js';

const subscription = 'serviceConfigurations';
const collection = ServiceConfigurations;

export class ServiceConfigurationsCtrl extends NbgenCollectionBaseCtrl {
    constructor($scope, $injector) {
        'ngInject';

        super($scope, $injector);
        // initialization routines here
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
            this.options = { hideAdd: true, hideDelete: true }
        }
        super.$onInit && super.$onInit();
        // put codes here
    }

    getInitials(item) {
        this.serviceIconClass = this.getServiceIconClass(item)

        return `<i class="${this.serviceIconClass}"></i>`
    }

    getServiceIconClass(item) {
        if (!item) item = this.$currentItem
        return `mdi-${item.service} mdi`
    }
}
