import collection from './organizationsCollection.js';
import formActionsTemplate from './formActions.html';

import { phoneRegExp, tinRegExp } from '/imports/common/app.constants.js';
import { OrgTypes } from '/imports/common/app.constants.js';

// this functions will be bound to the controller
const functions = {
    initNewItem() {
        return { address: {
            country: { _id: 'PH', name: 'Philippines' }
        }}
    },

    deactivateOrg() {
        // confirm first
        this.$tmvUiUtils.confirm('tx:organizations.labels.deactivatePrompt')
            .then(() => {
                this.updateDoc(null, {$set: {_deactivated: true}});
            })
    },

    activateOrg() {
        // confirm first
        this.$tmvUiUtils.confirm('tx:organizations.labels.activatePrompt')
            .then(() => {
                this.updateDoc(null, {$unset: {_deactivated: false}});
            })
    },

    _getOrgStatus(item) {
        if (!item) item = this.$currentItem;
        if (!item) return '';
        if (this.viewMode === 'new') return 'New';
        if (item._deactivated === true) return 'Deactivated';
        if (item._approvalNeeded === true) return 'For Approval';
        return 'Active';
    },

    approveOrg() {
        this.$tmvUiUtils.prompt({
            title: 'tx:organizations.labels.approve',
            placeholder: 'tx:organizations.labels.comments',
        }).then((value) => {
            this.updateDoc(null, {$set: {
                _approvalNeeded: false,
                _approvalComments: value,
            }});
        })
    }
};

// common info
export const companyInfoFields = {
    cssClass: "form-group-border",
    fields: [{
        ngShow: "$tmvCollection.viewMode && $tmvCollection.viewMode !== 'new'",
        template: "<div>Organization is currently <b>{{ $tmvCollection._getOrgStatus() }}</b></div><div>&nbsp;</div>",
    }, {
        fieldName: "_id",
        fieldValidateRulesRequired: true,
        fieldValidateRulesPattern: tinRegExp,
        fieldValidateRulesMaxlength: 12,
        fieldValidateRulesUnique: "organizations",
        fieldReadOnly: "$tmvCollection.viewMode !== 'new'",     // only enable if creating new
    }, {
        fieldName: "companyName",
        fieldValidateRulesRequired: true,
    }, {
        fieldName: "companyTypes",
        fieldInputType: "datapicker",
        collection: OrgTypes,
        listLayout: `"description"`,
        fieldValidateRulesRequired: true,
    }]
};

export const addressInfoFields = {
    cssClass: "form-group-border",
    label: 'labels.address',
    fields: [{
        fieldName: "address.streetAddress",
        fieldValidateRulesRequired: true,
    }, {
        fieldName: "address.cityTown",
        fieldValidateRulesRequired: true,
        gridClass: "col-sm-6",
    }, {
        fieldName: "address.province",
        gridClass: "col-sm-6",
    }, {
        fieldName: "address.country",
        gridClass: "col-sm-6",
        fieldInputType: "datapicker",
        subscription: "countries",
        fieldValidateRulesRequired: true,
        listLayout: `"name _id"`,
        single: "true",
    }, {
        fieldName: "address.postalCode",
        gridClass: "col-sm-6"
    }]
}

export const contactInfoFields = {
    cssClass: "form-group-border",
    label: 'labels.contact',
    fields: [{
        cssClass: "text-emphasis",
        attrs: {'tmv-color': 'primary'},
        ngShow: "$tmvCollection.inRegistration !== true && $tmvCollection.viewMode === 'new'",    // only show if creating new user
        template: "{{ 'organizations.labels.notesOnNew' | translate }}"
    }, {
        fieldName: "contact.name",
        fieldValidateRulesRequired: true,
        fieldReadOnly: "$tmvCollection.$isRegistration",
    }, {
        fieldName: "contact.designation",
        fieldValidateRulesRequired: true,
        gridClass: 'col-sm-6',
    }, {
        fieldName: "contact.email",
        fieldReadOnly: "$tmvCollection.$isRegistration",
        fieldValidateRulesRequired: true,
        fieldInputType: "email",
        gridClass: 'col-sm-6',
    }, {
        fieldName: "contact.phone",
        fieldValidateRulesRequired: true,
        fieldValidateRulesPattern: phoneRegExp,
        gridClass: 'col-sm-6',
    }, {
        fieldName: "contact.mobile",
        fieldValidateRulesPattern: phoneRegExp,
        gridClass: 'col-sm-6',
    }]
}

export const listLayoutFields = [{
    fieldName: "companyName",
    searchField: true,
}, {
    fieldName: "_id",
    searchField: true,
}, {
    fieldName: "contact.name",
    searchField: true,
}, {
    fieldName: "contact.phone"
}, {
    fieldName: "contact.designation",
}, {
    fieldName: "_approvalNeeded",
    computedValue: "_getOrgStatus(item)"
}]

const config = {
    subscription: "organizations",
    translatePrefix: "organizations",
    collection: collection,
    // if there's a separate modifier collection, you can specify it here
    // eg. if collection is just virtual and you want to write content to another collection
    // modifierCollection: collection,

    // optionally provide a custom template in action bars
    // actionToolbarListView: '',
    // actionToolbarFormView: '',

    functions: functions,

    locals: {
        // define local properties here which will available for both list and form controllers
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
        hideDelete: true,
        // hideEdit: true,
        // hideAction: true,    // will hide totally the actions
        // hideAdd: true,

        // list of fields up to 6 items
        // fieldName: "fieldName"   // name of field
        // value: "{{}}"    // interpolate string to be displayed as value
        // computedValue: "fn" // function whose returns serves as template for this field passed item as parameter
        // searchField: true    // if field is searchable, can be array of searchable fields

        fields: listLayoutFields,

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
        actionsTemplate: formActionsTemplate,

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
            $init() {

            }
        },

        // this is the form layout which controls how the fields are laid out
        // fields processing including validations can also be specified here
        formLayout: {
            formGroups: [
                companyInfoFields,
                addressInfoFields,
                contactInfoFields,
            ]
        }
    }
}

export default config;
