const config = {
    uiLayout: {
        translatePrefix: "serviceConfigurations",
        // detailsView: '' // can define a template string as title when in details view
        listLayout: {
            // initialSort: { }     // you may define initial sort here
            // avatarField: "$tmvController.fn" // define a function which can return a template displayed on avatar circle
            // displayAvater: false // to disable display of avatar circle

            // list of fields up to 6 items
            // fieldName: "fieldName"   // name of field
            // value: "{{}}"    // interpolate string to be displayed as value
            // computedValue: "fn" // function whose returns serves as template for this field passed item as parameter
            // searchField: true    // if field is searchable, can be array of searchable fields
            fields: [{
                fieldName: "service"
            }, {

            }, {
                fieldName: "$$appId",
                value: "{{appId || clientId || consumerKey}}"
            }, {

            }, {
                fieldName: "secret"
            }]
        },

        // this is the form layout which controls how the fields are laid out
        // fields processing including validations can also be specified here
        formLayout: {
            formGroups: [{
                cssClass: "form-group-border",
                fields: [{
                    fieldName: "$$serviceName",
                    fieldInputType: "static",
                    displayExpr: `
                        <i ng-class="$tmvCollection.getServiceIconClass()">&nbsp;
                        </i><span>{{$tmvCollection.$currentItem.service}}</span>
                        `,
                    inputCssClass: "md-title text-emphasis"
                }, {
                    // just a filler
                }, {
                    fieldName: "appId",
                    ngIf: "$tmvCollection.$currentItem.service === 'facebook'",
                    fieldValidateRulesRequired: true,
                }, {
                    fieldName: "clientId",
                    ngIf: "$tmvCollection.$currentItem.service === 'google'",
                    fieldValidateRulesRequired: true,
                }, {
                    fieldName: "consumerKey",
                    ngIf: "$tmvCollection.$currentItem.service === 'twitter'",
                    fieldValidateRulesRequired: true,
                }, {
                    fieldName: "secret",
                    fieldValidateRulesRequired: true,
                }]
            }]
        }
    }
}

export default config
