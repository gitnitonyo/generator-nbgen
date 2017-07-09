// uncomment to access appRoles
import actionToolbarListView from './actionToolbarListView.html';
import actionToolbarDetailsView from './actionToolbarDetailsView.html';

// import { appRoles } from '<%= commonImportDir %>/app.roles.js';
const config = {
    options: {
        actionToolbarListView,
        actionToolbarDetailsView,
        // optional settings which may passed into the controller
        /**
         * Some common options which can be put here
         *
         * insertSuccessMessage - i18n message to be displayed after successful insertion of document; null to disable displaying message
         * updateSuccessMessage - i18n message to be displayed after successful update of document; null to disable displaying message
         * removeSuccessMessage - i18n message to be displayed after successful removal of document; null to disable displaying message
         *
         * event functions
         * beforeInsert
         * afterInsert
         * beforeUpdate
         * afterUpdate
         * beforeRemove
         * afterRemove
         *
         * turn on/off other functions
         * hideEdit
         * hideDelete
         * hideAdd
         * hideAction
         *
         * titleDisplay - function which can return html embedded title string
         *
         * injectedServices - an array of angular service names which will be injected and bound to the $tmvCollection controller
         * The ff. angular services are already injected and no need to put in the injectedServices
         * $timeout, $q, $interpolate, $parse, $state, $translate, $tmvUtils, $tmvUiUtils, $tmvUiData, $identityService
         * $authUiService $injector $scope
         *
         */

        // defines local variables to be bound into $tmvCollection controller
        locals: {

        },

        functions: {
            // functions defined where will be bound to the $tmvCollection controller
        }
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

export default config;
