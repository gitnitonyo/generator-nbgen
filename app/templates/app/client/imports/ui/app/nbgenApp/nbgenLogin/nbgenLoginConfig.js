const config = {
    form: {
        translatePrefix: 'nbgenLogin',
        formLayout: {
            formGroups: [{
                cssClass: "no-error-indicator",
                fields: [{
                    fieldName: "userEmail",
                    fieldValidateRulesRequired: true,
                    fieldValidateRulesMaxlength: 50,
                    fieldInputType: 'email',
                    leftIcon: 'mdi-email mdi',
                    useMdMaxlength: false,
                    noErrorIndicator: true,
                    inputCssClass: 'tmv-error-display-off',
                }, {
                    fieldName: 'password',
                    fieldValidateRulesRequired: true,
                    fieldInputType: 'password',
                    fieldValidateRulesMaxlength: 50,
                    leftIcon: 'mdi-key mdi',
                    useMdMaxlength: false,
                    noErrorIndicator: true,
                    inputCssClass: 'tmv-error-display-off',
                    attrs: {
                        'nbgen-password-show': '',
                    }
                }]
            }]
        }
    }
}

export default config
