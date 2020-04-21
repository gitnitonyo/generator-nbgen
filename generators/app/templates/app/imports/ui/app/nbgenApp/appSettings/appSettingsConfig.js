/**
 * Can be used as configuration object by the component
 */
const config = {
    form: {
        translatePrefix: "appSettings",
        formLayout: {
            formGroups: [{
                label: "contacts.label",
                cssClass: "form-group-border",
                fields: [{
                    fieldName: "contacts.helpdeskEmail",
                    fieldInputType: "email",
                }, {
                    fieldName: "contacts.landLine",
                    gridClass: "col-sm-6",
                }, {
                    fieldName: "contacts.mobile",
                    gridClass: "col-sm-6",
                }]
            }]
        }
    }

}

export default config;
