import angular from 'angular'
import template from './nbgenAnnouncement.html'

import { Mongo } from '../../components/nbgenComponents';

const Announcements = new Mongo.Collection('myOwnAnnouncements');

const moduleName = 'nbgenApp', name = 'nbgenAnnouncement'

class NbgenAnnouncementCtrl {
    constructor($scope, $reactive) {
        'ngInject';

        $reactive(this).attach($scope);
    }

    $onInit() {
        this.subscribe('myOwnAnnouncements');
        const sort = {dateToPost: -1, modifiedAt: -1, createdAt: -1};
        this.helpers({
            announcements() {
                return Announcements.find({}, {sort});
            }
        });
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: NbgenAnnouncementCtrl,
        require: {
            nbgenAppCtrl: '^nbgenApp'
        }
    })
