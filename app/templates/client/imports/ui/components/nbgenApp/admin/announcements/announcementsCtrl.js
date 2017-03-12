import moment from 'moment';

import { NbgenCollectionBaseCtrl } from '../../../nbgenUtilsUi/nbgenCollectionv2.js';
import { Announcements } from '/imports/common/announcements/collection.js';
import config from './announcementsConfig.js';

const subscription = 'announcements';
const collection = Announcements;

export class AnnouncementsCtrl extends NbgenCollectionBaseCtrl {
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
            this.options = config.options || { };
        }
        super.$onInit && super.$onInit();
        // put codes here
    }

    // specific methods for this collection
    initNewItem() {
        return {
            dateToPost: moment().startOf('day').toDate(),
            expiryDate: moment().startOf('day').add(7, 'days').toDate()
        }
    }
}
