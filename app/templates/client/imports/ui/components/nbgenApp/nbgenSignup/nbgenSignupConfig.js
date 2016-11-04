const config = {
    // registration form
    form: {
        translatePrefix: 'nbgenSignup',
        formLayout: {
            formGroups: [{
                fields: [{
                    fieldName: "email",
                    fieldInputType: "email",
                    fieldValidateRulesRequired: true,
                    fieldValidateRulesMaxlength: 50,
                    leftIcon: "mdi-email mdi",
                    useMdMaxlength: false,
                    noErrorIndicator: true,
                    gridClass: "col-sm-6",
                }, {
                    fieldName: "profile.name",
                    fieldValidateRulesRequired: true,
                    fieldValidateRulesMaxlength: 100,
                    fieldSize: 50,
                    leftIcon: "mdi-account mdi",
                    useMdMaxlength: false,
                    noErrorIndicator: true,
                    gridClass: "col-sm-6",
                }, {
                    fieldName: "password",
                    fieldValidateRulesRequired: true,
                    fieldValidateRulesMaxlength: 50,
                    leftIcon: "mdi-key mdi",
                    fieldInputType: 'password',
                    useMdMaxlength: false,
                    noErrorIndicator: true,
                    gridClass: "col-sm-6",
                }, {
                    fieldName: "reenterPassword",
                    fieldValidateRulesRequired: true,
                    fieldValidateRulesMaxlength: 50,
                    leftIcon: "mdi-key-variant mdi",
                    fieldInputType: 'password',
                    fieldValidateRulesCustom: {
                        errorId: 'passwordsDontMatch',
                        validationFn: 'nbgenSignup.checkPasswords'
                    },
                    useMdMaxlength: false,
                    noErrorIndicator: true,
                    gridClass: "col-sm-6",
                }]
            }]
        }
    }

}

export default config;
