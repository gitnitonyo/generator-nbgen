import { Meteor } from 'meteor/meteor';

import { NbgenCollectionBaseCtrl } from '../../../nbgenUtilsUi/nbgenCollectionv2.js';
import config from './usersConfig.js'

import { Users } from '/imports/common/users/collection.js';
import { appRoles } from '/imports/common/app.roles.js';

import detect from '../../../../misc/detect.js';


export class UsersCtrl extends NbgenCollectionBaseCtrl {
    constructor($scope, $injector) { // eslint-disable-line
        'ngInject';
        super($scope, $injector);
    }

    // use to setup
    $onInit() {
        // all controllers have been initialized
        if (!this.uiLayout) {
            this.uiLayout = config.uiLayout;
        }
        if (!this.subscription) {
            this.subscription = 'users';
        }
        if (!this.collection) {
            this.collection = Users;
        }
        if (!this.options) {
            this.options = {
                hideAdd: true,
            }
        }

        super.$onInit && super.$onInit()

        this.specialFilter = { _id: { $ne: Meteor.userId() } }      // don't show user's own account from the list
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
        super.$onDestroy && super.$onDestroy()
    }

    $postLink() {
        // all elements have been linked
        super.$postLink && super.$postLink();
    }

    $onChanges(changesObj) {
        super.$onChanges && super.$onChanges(changesObj);
    }

    $doCheck() {
        super.$doCheck && super.$doCheck();
    }

    // customized functions
    initNewItem() {
        let activeGroup = Meteor.user().profile._activeGroup
        let doc = { }
        doc.roles = { }
        doc.roles[activeGroup] = [appRoles.NORMAL_USER]

        return doc
    }

    getFirstRole(item) {
        if (!Meteor.user()) return
        let activeGroup = Meteor.user().profile._activeGroup
        if (item.roles && item.roles[activeGroup]) {
            let role = item.roles[activeGroup][0]
            return role
        }
    }

    isActivated(item) {
        return item.emails && item.emails[0] && item.emails[0].verified
    }

    $getServiceIcon(item) {
        let iconLogo
        if (item && item.services && item.services.facebook) {
            iconLogo = 'mdi-facebook mdi'
        } else if (item && item.services && item.services.google) {
            iconLogo = 'mdi-google mdi'
        } else if (item && item.services && item.services.twitter) {
            iconLogo = 'mdi-twitter mdi'
        } else {
            iconLogo = 'mdi-account-key mdi'
        }
        return iconLogo
    }

    getInitials(item) {
        const result = this.$tmvUtils.getInitials(item.profile.name || (item.emails && item.emails[0]))
        let imgUrl

        if (item.services.facebook) {
            imgUrl = `//graph.facebook.com/${item.services.facebook.id}/picture`
        } else if (item.services.google && item.services.google.picture) {
            imgUrl = item.services.google.picture
        } else if (item.services.twitter) {
            if (window.location.protocol === 'https:') {
                imgUrl = item.services.twitter.profile_image_url_https
            } else {
                imgUrl = item.services.twitter.profile_image_url
            }
        }

        if (imgUrl) {
            return `<img src="${imgUrl}" alt="${result}" class="md-avatar" />`
        }

        return result
    }

    getEmail(item) {
        const email = (item.emails && item.emails[0].address) ||
            (item.services && item.services.facebook && item.services.facebook.email) ||
            (item.services && item.services.google && item.services.google.email)

        return email
    }

    determineUserIcon(item) {
        let icon = 'mdi-email'
        if (item.services && item.services.facebook) {
            icon = 'mdi-facebook'
        } else if (item.services && item.services.google) {
            icon = 'mdi-google'
        } else if (item.services && item.services.twitter) {
            icon = 'mdi-twitter'
        }

        return `${icon} mdi`
    }

    getLastLoginDetails(item) {
        if (!item || !item.status) return '';

        const htmlTemplate = [
            '<div class="col-xs-12">',
            '<i class="{{onlineIcon}} mdi" style="{{onlineStyle}}"></i>&nbsp;',
            '<span>Last login: {{lastLogin | date: \'MM/dd/yyyy HH:mm:ss\'}} from {{ipAddr}}</span>',
            '</div>',
            '<div class="col-xs-12">',
            '<span>Browser: {{uaObj.browser.name}} | OS: {{uaObj.os.name}} | Device: {{uaObj.device.type}}, {{uaObj.device.name}}</span>',
            '</div>',
            '<div>&nbsp;</div>'
        ].join('')
        const userObj = {}
        userObj.online = item.status.online
        userObj.lastLogin = item.status.lastLogin.date
        userObj.ipAddr = item.status.lastLogin.ipAddr
        userObj.uaObj = detect.parse(item.status.lastLogin.userAgent)
        if (item.status.online) {
            userObj.onlineIcon = 'mdi-checkbox-blank-circle'
            userObj.onlineStyle = 'color: green'
        } else {
            userObj.onlineIcon = 'mdi-checkbox-blank-circle-outline'
            userObj.onlineStyle = ''
        }

        return this.$interpolate(htmlTemplate)(userObj)
    }
}
