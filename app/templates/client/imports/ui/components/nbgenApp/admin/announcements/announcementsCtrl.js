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
        this.subscription = this.subscription || subscription;
        this.collection = this.collection || collection;
        this.uiLayout = this.uiLayout || config.uiLayout;
    }

    // specific methods for this collection
    initNewItem() {
        return {
            dateToPost: moment().startOf('day').toDate(),
            expiryDate: moment().startOf('day').add(7, 'days').toDate()
        }
    }
}
