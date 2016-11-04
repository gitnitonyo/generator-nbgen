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
        this.subscription = this.subscription || subscription;
        this.collection = this.collection || collection;
        this.uiLayout = this.uiLayout || config.uiLayout;
        this.options = { hideAdd: true, hideDelete: true }
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
