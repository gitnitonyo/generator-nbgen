/**
 * Can be used as configuration object by the component
 */
const config = {
    uiLayout: {
        translatePrefix: "contactUs",
        formLayout: {
            formGroups: [{
                fields: [{
                    fieldName: "fromAddress",
                    fieldInputType: "email",
                    fieldValidateRulesRequired: true,
                }, {
                    fieldName: "subject",
                    fieldValidateRulesRequired: true,
                }, {
                    fieldName: "content",
                    fieldValidateRulesRequired: true,
                    fieldInputType: "textarea",
                    fieldRowSize: 5,
                }]
            }]
        }
    }
}

export default config;
