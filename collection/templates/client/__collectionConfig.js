import collection from './<%= collectionName %>Collection.js';
<%_ if (generateToolbar) { _%>
import actionToolbarListView from './actionToolbarListView.html';
import actionToolbarFormView from './actionToolbarFormView.html';
<%_ } _%>

const config = {
    subscription: "<%= collectionName %>",
    translatePrefix: "<%= collectionName %>",
    collection: collection,
    // if there's a separate modifier collection, you can specify it here
    // eg. if collection is just virtual and you want to write content to another collection
    // modifierCollection: collection,

    // optionally provide a custom template in action bars
    <%_ if (generateToolbar) { _%>
    actionToolbarListView,
    actionToolbarFormView,
    <%_ } else { _%>
    // actionToolbarListView: '',
    // actionToolbarFormView: '',
    <%_ } _%>

    functions: {
        // define functions here available in both list and form controllers
    },

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
        // hideDelete: true,
        // hideEdit: true,
        // hideAction: true,    // will hide totally the actions
        // hideAdd: true,

        // list of fields up to 6 items
        // fieldName: "fieldName"   // name of field
        // value: "{{}}"    // interpolate string to be displayed as value
        // computedValue: "fn" // function whose returns serves as template for this field passed item as parameter
        // searchField: true    // if field is searchable, can be array of searchable fields

        fields: <%- listLayoutString %>,

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
            $init() {

            }
        },

        // this is the form layout which controls how the fields are laid out
        // fields processing including validations can also be specified here
        formLayout: {
            formGroups: [{
                cssClass: "form-group-border",
                fields: <%- fieldsString %>
            }]
        }
    }
}

export default config;
