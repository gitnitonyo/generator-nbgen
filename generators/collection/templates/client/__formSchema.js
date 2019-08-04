export const formSchema = {
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