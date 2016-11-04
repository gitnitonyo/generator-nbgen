const config = {
    uiLayout: {
        translatePrefix: "users",
        // detailsView: '' // can define a template string as title when in details view
        listLayout: {
            initialSort: { "profile.name": 1 },
            avatarField: "$tmvCollection.getAvatar(item)",
            fields: [{
                leftIcon: "fn:$getServiceIcon(item)",
                fieldName: "profile.name",
                searchField: true,
            }, {
                fieldName: "$$firstRole",
                computedValue: "getFirstRole(item)",
            }, {
                fieldName: "emails[0].address",
                leftIcon: "mdi-email mdi",
                computedValue: "getEmail(item)",
            }, {

            }, {
                fieldName: "loginStatus",
                value: "{{status.online ? '<i class=\"mdi-checkbox-blank-circle mdi\" style=\"color: green;\"></i>' : '<i class=\"mdi-checkbox-blank-circle-outline mdi\"></i>'}} Last login: {{status.lastLogin.date | date: 'MM/dd/yyyy HH:mm:ss'}} from {{status.lastLogin.ipAddr}}",
            }]
        },

        // this is the form layout which controls how the fields are laid out
        // fields processing including validations can also be specified here
        formLayout: {
            formGroups: [{
                fields: [{
                    fieldName: "notesOnNew",
                    fieldInputType: "static",
                    ngIf: "tmvCollection.viewMode == 'new'",
                    attrs: {
                        "tmv-color": "accent",
                    }
                }, {
                    fieldName: "$$emailAddress",
                    fieldDisable: true,
                    fieldInputType: "email",
                    leftIcon: "{{$tmvCollection.determineUserIcon($tmvCollection.$currentItem)}}",
                    fieldValidateRulesMaxlength: 100,
                    fieldValidateRulesRequired: "$tmvCollection.viewMode === 'new'",
                    fieldLabel: "email",
                    computedValue: "$tmvCollection.getEmail($tmvCollection.$currentItem)",
                }, {
                    fieldName: "profile.name",
                    fieldValidateRulesRequired: true,
                    fieldValidateRulesMaxlength: 255,
                }, {
                    fieldName: "rolesPicker",
                    fieldInputType: "template",
                    template: "<pick-user-roles></pick-user-roles>",
                    ngIf: "tmvCollection.$Meteor.user().profile._activeGroup !== '__global_roles__'",
                }]
            }, {
                label: "label.contacts",
                cssClass: "form-group-border",
                fields: [{
                    fieldName: "profile.contacts.phone",
                    fieldValidateRulesMaxlength: 20,
                    gridClass: "col-xs-6",
                }, {
                    fieldName: "profile.contacts.mobile",
                    gridClass: "col-xs-6",
                    fieldValidateRulesMaxlength: 20,
                }]
            }, {
                label: "label.address",
                cssClass: "form-group-border",
                fields: [{
                    fieldName: "profile.address.street",
                    fieldValidateRulesMaxlength: 255
                }, {
                    fieldName: "profile.address.city",
                    gridClass: "col-sm-6",
                    fieldValidateRulesMaxlength: 100,
                }, {
                    fieldName: "profile.address.province",
                    gridClass: "col-sm-6",
                    fieldValidateRulesMaxlength: 100,
                }, {
                    fieldName: "profile.address.zipCode",
                    gridClass: "col-sm-6",
                    fieldValidateRulesMaxlength: 5,
                }, {
                    fieldName: "profile.address.country",
                    gridClass: "col-sm-6",
                    fieldDefaultValue: "'PH'",
                    fieldInputType: "select",
                    fieldOptions: "$root.$$countries",
                    fieldOptionsLabel: "name",
                    fieldOptionsValue: "code",
                }]
            }, {
                label: "label.lastLoginDetails",
                cssClass: "form-group-border",
                fields: {
                    fieldName: "$$lastLoginDetails",
                    fieldInputType: "static",
                    computedValue: "$tmvCollection.getLastLoginDetails($tmvCollection.$currentItem)",
                }
            }]
        }
    }
}

export default config
