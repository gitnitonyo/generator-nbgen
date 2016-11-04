// uncomment to access appRoles
// import { appRoles } from '<%= commonImportDir %>/app.roles.js';
const config = {
    options: {
        // optional settings which may passed into the controller
    },
    uiLayout: {
        translatePrefix: "<%= collectionName %>",
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
            fields: <%- listLayoutString %>
        },

        // this is the form layout which controls how the fields are laid out
        // fields processing including validations can also be specified here
        formLayout: {
            formGroups: [{
                fields: <%- fieldsString %>
            }]
        }
    }
}

export default config
