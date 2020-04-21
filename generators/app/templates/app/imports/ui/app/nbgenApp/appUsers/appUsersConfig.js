import _ from 'underscore';
import { Meteor } from '../../../components/nbgenComponents';
import { AppUsers as collection } from './appUsersCollection.js';
import actionToolbarListView from './actionToolbarListView.html';
import actionToolbarFormView from './actionToolbarFormView.html';
import modifyRolesTemplate from './modifyRoles.html';

import { getActiveGroup, appRolesCollection, appRoles, USER_GROUP_FIELD, GLOBAL_GROUP } from '../../../../common/app.roles';
import { phoneRegExp } from '../../../../common/app.constants';
import { nbgenDetect as detect } from '../../../components/nbgenComponents';

export const rolesListLayout = {
    displayAvatar: false,
    dataFilter() {
        // exclude super admin from the list
        return { _id: {$ne: appRoles.SUPER_ADMIN }};
    },
    fields: [{
        fieldName: "_id",
        value: "{{ 'appRoles.' + _id | translate }}"
    }]
};

export const userFormLayout = {
    formGroups: [{
        cssClass: "form-group-border",
        fields: [{
            cssClass: "md-body-1",
            ngIf: "$tmvCollection.viewMode !== 'new' && $tmvCollection.$userManagement === true",
            template: `User is currently <b class="tmv-primary-color">{{ $tmvCollection.getUserStatus() }}</b>`
        }, {
            ngIf: "$tmvCollection.viewMode === 'new'",
            cssClass: "text-emphasis md-body-1",
            attrs: {'tmv-color': 'primary'},
            template: "An email notification will be sent to this user to activate his/her account."
        }, {
            cssClass: "md-body-1",
            ngIf: "$tmvCollection.viewMode !== 'new' && $tmvCollection.$userManagement === true",
            template: `<div ng-bind-html="$tmvCollection.getLastLoginDetails()"></div><div>&nbsp;</div>`
        }]
    }, {
        cssClass: "form-group-border",
        fields: [{
            ngIf: "$tmvCollection.viewMode !== 'new'",
            fieldName: "email",
            fieldLabel: "email",
            fieldInputType: "static",
            computedValue: "$tmvCollection.getEmail($tmvCollection.$currentItem)",
            gridClass: "col-sm-6",
        }, {
            ngIf: "$tmvCollection.viewMode === 'new'",
            fieldName: "email",
            fieldInputType: "email",
            fieldValidateRulesRequired: true,
            gridClass: "col-sm-6"
        }, {
            fieldName: "profile.name",
            fieldValidateRulesRequired: true,
            gridClass: "col-sm-6",
        }]
    }, {
        cssClass: "form-group-border",
        label: "profile.accountPicture",
        fields: [{
            fieldName: "profile.accountPicture",
            fieldInputType: "filepicker",
            description: 'profile.accountPicture',
            filters: 'image\/.*',
        }]
    }, {
        ngIf: "$tmvCollection.$userManagement === true",
        cssClass: "form-group-border",
        label: "label.roles",
        fields: [{
            fieldName: "$roles",    // starts with '$' since this won't be saved
            fieldInputType: 'datapicker',
            collection: "$tmvCollection.appRolesCollection",
            listLayout: "$tmvCollection.rolesListLayout",
            chipTemplate: "$tmvCollection.rolesListChipTemplate",
            fieldValidateRulesRequired: true,
            attrs: {
                'ng-change': "$tmvCollection._updateActiveRoles()",
            },
        }, {
            fieldName: "roles",
            fieldInputType: "hidden",
        }]
    }, {
        cssClass: "form-group-border",
        label: "label.contacts",
        fields: [{
            fieldName: "profile.contacts.phone",
            fieldValidateRulesPattern: phoneRegExp,
            gridClass: "col-sm-6",
        }, {
            fieldName: "profile.contacts.mobile",
            fieldValidateRulesPattern: phoneRegExp,
            gridClass: "col-sm-6",
        }]
    }, {
        cssClass: "form-group-border",
        label: "label.address",
        fields: [{
            fieldName: "profile.address.street",
        }, {
            fieldName: "profile.address.city",
            gridClass: "col-sm-6",
        }, {
            fieldName: "profile.address.province",
            gridClass: "col-sm-6",
        }, {
            fieldName: "profile.address.postalCode",
            gridClass: "col-sm-6",
        }]
    }]
};

const functions = {
    // customized functions
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
    },

    getInitials(item) {
        let result = this.$authUiService.getUserAvatar(item, 'md-avatar');
        if (!result) {
            result = this.$tmvUtils.getInitials(item.profile.name || (item.emails && item.emails[0]));
        }

        return result
    },

    changeFilter() {
        let filterSet = []

        if (this.$deactivated === true) {
            filterSet.push({"profile.deactivated": true});
        }

        if (filterSet.length == 0) {
            this.filter = {}
        } else if (filterSet.length == 1) {
            this.filter = filterSet[0]
        } else {
            this.filter = { $and: filterSet }
        }
    },

    getEmail(item) {
        if (!item) item = this.$currentItem;
        if (!item) return;

        const email = (item.profile && item.profile.mainEmail) ||
            (item.emails && item.emails[0].address) ||
            (item.services && item.services.facebook && item.services.facebook.email) ||
            (item.services && item.services.google && item.services.google.email)

        return email
    },

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
    },

    getLastLoginDetails(item) {
        item = item || this.$currentItem;
        if (!item) return;

        const htmlTemplate = [
            '<span>',
            '<i class="{{onlineIcon}} mdi" style="{{onlineStyle}}"></i>&nbsp;',
            '<span>Last login @ {{lastLogin | date: \'medium\'}} </span>',
            '<span>using {{uaObj.browser.name}}, {{uaObj.os.name}}, {{uaObj.device.type}}, {{uaObj.device.name}}',
            '</span>',
        ].join('')
        const userObj = {}
        if (item.status && item.status.lastLogin && item.status.lastLogin.date) {
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

            return this.$sce.trustAsHtml(this.$interpolate(htmlTemplate)(userObj));
        }
    },

    deactivateUser(item) {
        item = item || this.$currentItem;
        // ask for confirmation
        this.$tmvUiUtils.confirm('tx:users.home.deactivateUserPrompt')
            .then(() => {
                this.updateDoc({_id: item._id}, {$set: {'profile.deactivated': true}}, {}, (err) => {
                    if (err) {
                        this.$timeout(() => this.$tmvUiUtils.error(err));
                    } else {
                        this.$timeout(() => this.$tmvUiUtils.alert('tx:users.home.deactivateUserSuccess'));
                    }
                })
            })
    },

    activateUser(item) {
        item = item || this.$currentItem;

        // ask for confirmation
        this.$tmvUiUtils.confirm('tx:users.home.activateUserPrompt')
            .then(() => {
                this.updateDoc({_id: item._id}, {$unset: {'profile.deactivated': false}}, {}, (err) => {
                    if (err) {
                        this.$timeout(() => this.$tmvUiUtils.error(err));
                    } else {
                        this.$timeout(() => this.$tmvUiUtils.alert('tx:users.home.activateUserSuccess'));
                    }
                })
            })
    },

    getListOfRoles(item) {
        if (!item) item = this.$currentItem;
        if (!item) return;
        let activeGroup = getActiveGroup(this.$currentUser);
        if (item.roles) {
            let result = [ ];
            if (this.isSuperAdmin()) {
                activeGroup = item.profile[USER_GROUP_FIELD] || GLOBAL_GROUP;
            }

            if (_.isArray(item.roles[activeGroup])) {
                item.roles[activeGroup].forEach(v => {
                    result.push(this.$translate.instant(`appRoles.${v}`));
                });
            }
            return result.join(', ');
        }
    },

    _modifyRoles(item) {
        item = item || this.$currentItem;
        if (!item) return;
        // initialize form model based on current user roles
        const formModel = { roles: [ ] };
        const activeGroup = getActiveGroup(this.$currentUser);
        const currentUserRoles = (item.roles && item.roles[activeGroup]) || [ ];
        appRolesCollection.find({_id: {$ne: appRoles.SUPER_ADMIN}})     // exclude super-admin
            .forEach((role) => {
                formModel.roles.push({
                    _id: role._id,
                    selected: (currentUserRoles.indexOf(role._id) >= 0),
                })
            })

        return this.$tmvUiData.formDialog({
            title: 'tx:users.label.modifyRoles',
            formModel,
            template: modifyRolesTemplate,
            functions: {
                isFormInvalid() {
                    // make the form invalid if no roles has been selected
                    return !_.find(this.formModel.roles, v => v.selected === true);
                }
            }
        });
    },

    modifyRoles(item) {
        const activeGroup = getActiveGroup(this.$currentUser);
        this._modifyRoles(item).then((model) => {
            let selectedRoles = [ ];
            model.roles.forEach(r => {
                if (r.selected === true) selectedRoles.push(r._id);
            });
            this.updateDoc(item._id, {$set: {[`roles.${activeGroup}`]: selectedRoles}});
        });
    },

    _setRolesDialog() {
        this._modifyRoles(this.$currentItem).then(model => {
            let selectedRoles = [ ];
            model.roles.forEach(r => {
                if (r.selected === true) selectedRoles.push(r._id);
            });
            this.$currentItem.roles = {[getActiveGroup(this.$currentUser)]: selectedRoles};
            // force the form to be dirty
            this.editForm.roles && this.editForm.roles.$setDirty();
        })
    },

    _updateActiveRoles() {
        // get the current values of $roles placeholder
        const activeGroup = this.isSuperAdmin() ? this.$currentItem.profile[USER_GROUP_FIELD] || GLOBAL_GROUP : getActiveGroup(this.$currentUser);
        const activeRoles = [ ];
        if (this.$currentItem.$roles) {
            this.$currentItem.$roles.forEach(v => activeRoles.push(v._id));
        }
        if (!this.$currentItem.roles) this.$currentItem.roles = { };
        this.$currentItem.roles[activeGroup] = activeRoles;

        // make the roles field dirty, so it will be saved in the collection
        this.editForm.roles.$setDirty();
    },

    saveDisabled() {
        if (this.editForm.$invalid || this.editForm.$pristine) return true;
        // additional checking if viewMode === 'new' to ensure there's a role selected
        return !this.isSuperAdmin() && (!this.$currentItem.roles || _.isEmpty(this.$currentItem.roles[getActiveGroup(this.$currentUser)]));
    },

    // override the inserDoc method
    insertDoc(doc, cb) {
        this.$tmvUiUtils.showWaitDialog();
        this.call('users.createUser', {
            email: doc.email,
            profile: doc.profile,
            roles: doc.roles,
        }, (err, result) => {
            this.$timeout(() => this.$tmvUiUtils.hideWaitDialog());
            cb.call(this, err, result);
        });
    },

    getUserStatus(item) {
        item = item || this.$currentItem;
        if (!item || !item.profile) return;
        if (item.profile.deactivated) return 'Deactivated';
        if (item.emails && item.emails[0] && item.emails[0].verified !== true) return 'Waiting Email Verification';

        return 'Active';
    },

    rolesListChipTemplate(chip) {
        return this.$translate.instant(`appRoles.${chip._id}`);
    },

    /**
     * return true if current user is a super admin
     */
    isSuperAdmin() {
        return this.$identityService.isInRole(appRoles.SUPER_ADMIN);
    },

    /**
     * Disabled edit if user is a super admin
     */
    editDisabled(item) {
        return item && item.roles && item.roles[GLOBAL_GROUP] && item.roles[GLOBAL_GROUP].indexOf(appRoles.SUPER_ADMIN) >= 0;
    },

    deleteDisabled() {
        return !this.$identityService.isInRole(appRoles.SUPER_ADMIN);
    }
}

function $init() {
    this.autorun(() => this.$currentUser = Meteor.user());
    this.autorun(() => {
        this.getReactively('$deactivated');
        this.changeFilter();
    });

    this.autorun(() => {
        // if item change resolve the $roles value
        const currentItem = this.getReactively('$currentItem');
        if (currentItem && currentItem.roles) {
            const activeGroup = this.isSuperAdmin() ? currentItem.profile[USER_GROUP_FIELD] || GLOBAL_GROUP : getActiveGroup(this.$currentUser);
            const activeRoles = currentItem.roles[activeGroup];
            currentItem.$roles = [ ];
            if (activeRoles) {
                activeRoles.forEach(v => currentItem.$roles.push({_id: v}));
            }
        }
    })

    this.$userManagement = true;    // just a flag to indicate that it's in user management mode
}

const config = {
    subscription: "appUsers",
    translatePrefix: "users",
    collection: collection,
    // if there's a separate modifier collection, you can specify it here
    // eg. if collection is just virtual and you want to write content to another collection
    // modifierCollection: collection,
    modifierCollection: Meteor.users,

    // optionally provide a custom template in action bars
    actionToolbarListView,
    actionToolbarFormView,

    functions: functions,

    hideAdd() {
        return this.isSuperAdmin();
    },

    locals: {
        appRolesCollection,
        rolesListLayout,
    },

    listLayout: {
        // optionally provide a template for list actions
        // eg: include a drop down filter
        // actionsTemplate: '',

        // uncomment to provide a sort to be used into the collection
        // initialSort: { },     // you may define initial sort here

        // uncomment and define a function  which would return a template displayed on avatar circule
        // avatarField: "$tmvController.fn",

        // a flag whether to display an avatar circle
        // displayAvater: false, // to disable display of avatar circle

        // a boolean of a function to hide specified actions
        // hideDelete: true,
        // hideEdit: true,
        // hideAction: true,    // will hide totally the actions
        // hideAdd: true,

        // list of fields up to 6 items
        // fieldName: "fieldName"   // name of field
        // value: "{{}}"    // interpolate string to be displayed as value
        // computedValue: "fn" // function whose returns serves as template for this field passed item as parameter
        // searchField: true    // if field is searchable, can be array of searchable fields
        tabular: false,

        initialSort: { "createdAt": -1, "profile.name": 1 },
        avatarField: "$tmvCollection.getAvatar(item)",
        fields: [{
            leftIcon: "fn:$getServiceIcon(item)",
            fieldName: "profile.name",
            searchField: true,
        }, {
            fieldName: "listOfRoles",
            computedValue: "getListOfRoles(item)",
        }, {
            fieldName: "emails[0].address",
            leftIcon: "mdi-email mdi",
            computedValue: "getEmail(item)",
            searchField: ["profile.mainEmail", "emails[0].address"],
        }, {
            fieldName: "deactivate",
            computedValue: "getUserStatus(item)",
        }, {
            fieldName: "loginStatus",
            computedValue: "getLastLoginDetails(item)",
        }],

        // if you want to include local variables accessible as properties of $tmvCollection controller
        locals: {

        },

        // all functions defined in this section will be bound to the $tmvCollection controller
        functions: {
            // functions defined where will be bound to the $tmvCollection controller

            // this is executed when controller has been initialized
            $init() {

            }
        }
    },

    formSchema: {
        // optionally provide a template for list actions
        // eg: custom actions like approve, reject, etc
        // actionsTemplate: '',

        options: {
            // uncomment to prevent certain operations
            // insertAllowed: true,
            // updateAllowed: true,
            // removeAllowed: true,
            // viewAllowed: true,
        },

        // all properties specified here will become properties of $tmvCollection controller
        locals: {

        },

        // all functions specified here will bound to the $tmvCollection controller
        functions: {
            // this is exectuted at the initialization of the controller
            // it can return a promise if rejected, then it will go back to parent
            $init: $init,
        },

        // this is the form layout which controls how the fields are laid out
        // fields processing including validations can also be specified here
        formLayout: userFormLayout,
    }
}

export default config;
