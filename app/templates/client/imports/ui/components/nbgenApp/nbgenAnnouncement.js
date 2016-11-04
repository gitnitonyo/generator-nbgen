import angular from 'angular'
import template from './nbgenAnnouncement.html'
import moment from 'moment'
import { Announcements } from '/imports/common/announcements/collection.js'

const moduleName = 'nbgenApp', name = 'nbgenAnnouncement'

class NbgenAnnouncementCtrl {
    constructor($scope, $reactive, $interval) {
        'ngInject';

        $reactive(this).attach($scope)

        const sort = {dateToPost: -1, modifiedAt: -1, createdAt: -1}
        this.subscribe('announcements', () => [
            { },
            {sort: sort, limit: 50}
        ])
        this.helpers({
            announcements() {
                return Announcements.find({
                    dateToPost: {$lte: this.getReactively('$currentDate')},
                    expiryDate: {$gt: this.getReactively('$currentDate')}
                }, {sort: sort, limit: 50})
            }
        })

        const self = this

        this.$_setCurrentDate = () => {
            self.$currentDate = moment().startOf('day').toDate()
        }

        this.$_setCurrentDate()

        // call every hour
        $interval(this.$_setCurrentDate, 3600000)
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
