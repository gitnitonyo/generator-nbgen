import { phoneRegExp } from '../../../common/app.constants';
const config  = {
    uiLayout: {
        translatePrefix: "users",
        detailsTitle: "Edit Profile",
        formLayout: {
            formGroups: [{
                cssClass: "form-group-border",
                fields: [{
                    fieldName: "email",
                    fieldInputType: "static",
                    computedValue: "$tmvCollection.$authUiService.getUserEmail($tmvCollection.$currentItem)"
                }, {
                    fieldName: "profile.name",
                    fieldValidateRulesRequired: true,
                }]
            }, {
                cssClass: "form-group-border",
                label: "profile.accountPicture",
                fields: [{
                    fieldName: "profile.accountPicture",
                    fieldInputType: "filepicker",
                    description: 'profile.accountPicture',
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
        }
    }
}

export default config;
