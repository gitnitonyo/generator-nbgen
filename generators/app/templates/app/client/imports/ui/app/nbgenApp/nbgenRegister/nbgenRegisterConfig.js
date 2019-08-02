/**
 * Can be used as configuration object by the component
 */
import { companyInfoFields, addressInfoFields, contactInfoFields } from '../organizations/organizationsConfig.js';
import disclaimerTmp from './registrationDisclaimer.html';

// layout of credentials
const credentialsLayout = {
    formGroups: [{
        postBorder: true,
        fields: [{
            fieldName: "email",
            fieldInputType: "email",
            fieldValidateRulesRequired: true,
            fieldValidateRulesMaxlength: 50,
            leftIcon: "mdi-email mdi",
            useMdMaxlength: false,
            // gridClass: "col-sm-6",
        }, {
            fieldName: "profile.name",
            fieldValidateRulesRequired: true,
            fieldValidateRulesMaxlength: 100,
            fieldSize: 50,
            leftIcon: "mdi-account mdi",
            useMdMaxlength: false,
            // gridClass: "col-sm-6",
        }, {
            fieldName: "password",
            fieldValidateRulesRequired: true,
            fieldValidateRulesMaxlength: 50,
            leftIcon: "mdi-key mdi",
            fieldInputType: 'password',
            useMdMaxlength: false,
            // gridClass: "col-sm-6",
            attrs: {
                'nbgen-password': "$tmvCollection.passwordStrength",
                'nbgen-password-show': '',
            },
            errorMessages: {
                key: 'passwordSecure',
                message: 'form.validation.password'
            }
        }, {
            fieldName: "reenterPassword",
            fieldValidateRulesRequired: true,
            fieldValidateRulesMaxlength: 50,
            leftIcon: "mdi-key-variant mdi",
            fieldInputType: 'password',
            fieldValidateRulesCustom: {
                errorId: 'passwordsDontMatch',
                validationFn: '$tmvCollection.checkPasswords()'
            },
            useMdMaxlength: false,
            attrs: {
                'nbgen-password-show': '',
            }
            // gridClass: "col-sm-6",
        }]
    },
    /* remove the social signin for this app
    {
        postBorder: true,
        fields: {
            template: '<div class="md-caption">&nbsp;</div><div class="md-caption" translate="nbgenRegister.labels.registerUsing"></div><nbgen-social-signin-alt></nbgen-social-signin-alt>',
        }
    },
    */
    {
        fields: {
            template: '<nbgen-password-meter source="$tmvCollection.passwordStrength"></nbgen-password-meter>'
        }
    }]
}

const verifyEmailLayout = {
    formGroups: [{
        fields: [{
            template: '<p translate="nbgenRegister.prompts.activationCode1" class="md-body-1 text-emphasis text-padding"></p>'
        }, {
            fieldName: "activationCode",
            fieldValidateRulesRequired: true,
            fieldLabelDisable: true,
            placeholder: 'activationCode',
            inputInline: true,
            inputCssClass: 'text-center text-emphasis placeholder-normal',
            layout: "row",
            layoutAlign: "center",
        }, {
            template: '<div>&nbsp;</div>',
        }]
    }]
}

/**
 * Additional info needed for successful registration of user
 */
const config = {
    formSchema: {
        translatePrefix: "nbgenRegister",
        formLayout: {
            formSteps: {
                id: 'registrationStepper',
                linear: true,
                contents: [{
                    label: 'steps.enterCredentials',
                    ngIf: "$tmvCollection._currentStep === 0",
                    body: credentialsLayout,
                    actions: [{
                        label: "labels.cancel",
                        cssClass: "md-primary",
                        onClick: "$tmvCollection.cancel()"
                    }, {
                        label: "labels.continue",
                        cssClass: "md-raised md-primary",
                        attrs: {
                            'ng-disabled': "$tmvCollection.editForm.$invalid"
                        },
                        onClick: "$tmvCollection.submitCredentials()"
                    }]
                }, {
                    label: 'steps.verifyEmail',
                    ngIf: "$tmvCollection._currentStep === 1",
                    body: verifyEmailLayout,
                    actions: [{
                        label: "labels.cancel",
                        cssClass: "md-primary",
                        onClick: "$tmvCollection.cancel()"
                    }, {
                        label: "labels.sendNewCode",
                        cssClass: "md-primary",
                        onClick: "$tmvCollection.sendNewActivationCode()",
                    }, {
                        label: "labels.submit",
                        cssClass: "md-raised md-primary",
                        attrs: {
                            'ng-disabled': "$tmvCollection.editForm.$invalid"
                        },
                        onClick: "$tmvCollection.submitActivationCode()"
                    }]
                }, {
                    label: 'steps.completeInfo',
                    ngIf: "$tmvCollection._currentStep === 2",
                    body: "$tmvCollection.additionalInfoTemplate",
                    actions: [{
                        label: "labels.cancel",
                        cssClass: "md-primary",
                        onClick: "$tmvCollection.cancel()"
                    }, {
                        label: "labels.submit",
                        cssClass: "md-raised md-primary",
                        attrs: {
                            'ng-disabled': "$tmvCollection.editForm.$invalid || $tmvCollection._notAccepted()"
                        },
                        onClick: "$tmvCollection.submitAdditionalInfo()"
                    }]
                }]
            }
        }
    },

    additionalInfoSchema: {
        translatePrefix: "organizations",
        formLayout: {
            cssClass: 'tmv-bottom-border',
            formGroups: [
                {
                    fields: {
                        template: '<div class="text-emphasis" translate="nbgenRegister.labels.additionalInfo"></div>'
                    }
                },
                companyInfoFields,
                addressInfoFields,
                contactInfoFields,
                {
                    template: disclaimerTmp,
                }
            ]
        }
    }
}

export default config;
