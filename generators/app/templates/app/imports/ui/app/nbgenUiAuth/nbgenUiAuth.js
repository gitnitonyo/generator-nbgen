import angular from 'angular'
import { Meteor } from '../../components/nbgenComponents'
import { Accounts } from '../../components/nbgenComponents'
import _ from 'underscore'

import nbgenApp from '../nbgenApp'

import userSettingsConfig from './userSettings.js';

const _baseImgUrl = Meteor.absoluteUrl('files/get');
const sessionIdKey = '_sessionId';

let _emailVerificationToken, _emailVerificationDone,
    _resetPasswordToken, _resetPasswordDone,
    _enrollmentToken, _enrollmentTokenDone;

Accounts.onEmailVerificationLink(function(token, done) {
    _emailVerificationDone = done
    _emailVerificationToken = token
});

Accounts.onResetPasswordLink(function(token, done) {
    _resetPasswordToken = token
    _resetPasswordDone = done
});

Accounts.onEnrollmentLink(function(token, done) {
    _enrollmentToken = token;
    _enrollmentTokenDone = done;
});

angular.module(nbgenApp)
    .factory('$authUiService', authUiService)
    .run(function($timeout, $tmvUiUtils, $state, $tmvUiData, $nbgenAuthProviderService) {
        'ngInject'

        if (_emailVerificationToken) {
            $timeout(() => {
                Accounts.verifyEmail(_emailVerificationToken, (err) => {
                    if (err) {
                        $tmvUiUtils.error(err)
                    } else {
                        $tmvUiUtils.alert('tx:registration.activatedPrompt')
                            .then(() => {
                                _emailVerificationDone()
                                // $timeout(() => $state.go('home'))
                            })
                    }
                    _emailVerificationToken = null
                })
            })
        }

        if (_resetPasswordToken) {
            resetPassword(_resetPasswordToken, _resetPasswordDone)
            _resetPasswordToken = null
        }

        if (_enrollmentToken) {
            resetPassword(_enrollmentToken, _enrollmentTokenDone);
            _enrollmentToken = null;
        }

        function resetPassword(token, done) {
            let passwords = {}

            let commonFieldOptions = {
                fieldValidateRulesRequired: true,
                fieldValidateRulesMaxlength: 50,
                fieldValidateRulesMinlength: 5,
                fieldInputType: 'password',
                useMdMaxlength: false,
            }

            let fields = [{
                fieldName: "password",
                leftIcon: "mdi-key mdi",
                attrs: {
                    'nbgen-password': "vm.formModel.passwordStrength",
                    'nbgen-password-show': '',
                },
                errorMessages: {
                    key: 'passwordSecure',
                    message: 'form.validation.password'
                }
            }, {
                fieldName: "reEnterPassword",
                leftIcon: "mdi-key-variant mdi",
                fieldValidateRulesCustom: {
                    errorId: 'passwordsDontMatch',
                    validationFn: 'vm.checkPasswords()'
                },
                attrs: {
                    'nbgen-password-show': '',
                }
            }];

            angular.forEach(fields, function(field) {
                angular.extend(field, commonFieldOptions);
            })

            fields.push({
                template: '<nbgen-password-meter source="vm.formModel.passwordStrength"></nbgen-password-meter>'
            })

            let checkPasswords = function() {
                if (!_.isEmpty(this.formModel.password) && !_.isEmpty(this.formModel.reEnterPassword)) {
                    return this.formModel.password === this.formModel.reEnterPassword
                }
                return true;
            }

            $timeout(function() {
                $tmvUiData.formDialog({
                    cssClass: 'dlg-height-allowance fix-min-width',
                    formSchema: $tmvUiData.wrapsFieldsToFormLayout(fields),
                    formModel: passwords,
                    translatePrefix: 'global.login',
                    title: 'global.login.newPassword',
                    includedFunctions: { checkPasswords: checkPasswords },
                    mode: 'edit',
                    i18nPart: 'global'
                }).then((formModel) => {
                    $tmvUiUtils.showWaitDialog()
                    $nbgenAuthProviderService.resetPassword(token, formModel.password, function(err) {
                        $tmvUiUtils.hideWaitDialog()
                        if (err) {
                            $tmvUiUtils.error(err);
                        } else {
                            done();
                            $timeout(function() {
                                $state.go('home');
                            })
                        }
                    })
                }, () => $state.go('home'));
            })
        }
    })

function authUiService($tmvUiData, $translate, $tmvUiUtils, $rootScope, $state, $nbgenAuthProviderService, $sce) {
    'ngInject';

    class AuthUiService {

        getUserEmail(item) {
            const email = item.profile.mainEmail ||
                (item.emails && item.emails[0].address) ||
                (item.services && item.services.facebook && item.services.facebook.email) ||
                (item.services && item.services.google && item.services.google.email)

            return email
        }

        getUserProfileUrl(user) {
            if (!user) user = Meteor.user();
            if (!user) return;

            let imgUrl;

            if (user && user.profile && user.profile.accountPicture) {
                let accountPicture = user.profile.accountPicture;
                if (_.isArray(user.profile.accountPicture)) {
                    accountPicture = user.profile.accountPicture[0];
                }
                let sessionId = encodeURIComponent(Accounts._storedLoginToken());
                imgUrl = `${_baseImgUrl}?docId=${accountPicture.docId}&preview=yes&${sessionIdKey}=${sessionId}`;
            } else if (user && user.services) {
                if (user.services.facebook) {
                    imgUrl = `//graph.facebook.com/${user.services.facebook.id}/picture`
                } else if (user.services.google && user.services.google.picture) {
                    imgUrl = user.services.google.picture
                } else if (user.services.twitter) {
                    if (window.location.protocol === 'https:') {
                        imgUrl = user.services.twitter.profile_image_url_https
                    } else {
                        imgUrl = user.services.twitter.profile_image_url
                    }
                }
            }

            return imgUrl;
        }

        getUserProfileAvatar() {
            const user = Meteor.user();
            let avatarUrl = this.getUserAvatar(user);
            if (!avatarUrl) {
                avatarUrl = '<div class="nbgen-profile"><i class="mdi-account mdi"></i></div>';
            }
            return avatarUrl;
        }

        getUserAvatar(user) {
            let imgUrl = this.getUserProfileUrl(user);

            if (imgUrl) {
                return $sce.trustAsHtml(`<div class="nbgen-profile" style="background-image: url('${imgUrl}')"></div>`);
            }
        }

        /**
         * For resetting password
         */
        resetPassword() {
            let formModel = {}
            let emailFields = [{
                fieldName: "email",
                fieldInputType: "email",
                placeholder: 'specifyEmail',
                fieldLabelDisable: true,
                useMdMaxlength: false,
                fieldValidateRulesRequired: true,
                fieldValidateRulesMaxlength: 50
            }]

            // prompt user for email
            $tmvUiData.formDialog({
                formSchema: $tmvUiData.wrapsFieldsToFormLayout(emailFields),
                formModel: formModel,
                translatePrefix: 'global.login',
                title: 'global.login.resetPassword',
                mode: 'edit',
                okLabel: 'global.common.send'
            }).then((formModel) => {
                $tmvUiUtils.showWaitDialog()
                Meteor.call('users.resetPassword', formModel.email, (err) => {
                    $tmvUiUtils.hideWaitDialog()
                    if (err) {
                        $tmvUiUtils.error(err)
                    } else {
                        $tmvUiUtils.alert($translate.instant('global.login.resetPasswordPrompt'))
                    }
                    $state.go('home')
                })
            })
        }

        /**
         * Displays a modal dialog for changing password
         */
        changePassword() {
            let passwords = {}
            let commonFieldOptions = {
                fieldInputType: 'password',
                fieldValidateRulesRequired: true,
                fieldValidateRulesMinlength: 5,
                fieldValidateRulesMaxlength: 50,
                useMdMaxlength: false,
                gridClass: "col-sm-12"
            }
            let passwordFields = [{
                fieldName: 'oldPassword',
                attrs: {
                    'nbgen-password-show': '',
                }
            }, {
                fieldName: 'newPassword',
                attrs: {
                    'nbgen-password': "vm.formModel.passwordStrength",
                    'nbgen-password-show': '',
                },
                errorMessages: {
                    key: 'passwordSecure',
                    message: 'form.validation.password'
                }
            }, {
                fieldName: 'reEnterPassword',
                fieldValidateRulesCustom: {
                    errorId: 'passwordsDontMatch',
                    validationFn: 'vm.checkPasswords()'
                },
                attrs: {
                    'nbgen-password-show': '',
                }
            }]

            angular.forEach(passwordFields, function(passwordField) {
                angular.extend(passwordField, commonFieldOptions)
            });

            passwordFields.push({
                template: '<nbgen-password-meter source="vm.formModel.passwordStrength"></nbgen-password-meter>'
            })

            // this will bound to the controller of the dialog
            function checkPasswords() {
                if (this.formModel && !_.isEmpty(this.formModel.newPassword) && !_.isEmpty(this.formModel.reEnterPassword)) {
                    return this.formModel.newPassword === this.formModel.reEnterPassword
                }
                return true;
            }

            function okFn(formModel, dialogCtrl) {
                // now let's call the service to change the password
                $nbgenAuthProviderService.changePassword(formModel.oldPassword, formModel.newPassword, function(err) {
                    if (err) {
                        $tmvUiUtils.error(err);
                    } else {
                        dialogCtrl.hide();
                        $tmvUiUtils.alert('tx:global.login.changePasswordSuccess')
                    }
                })
            }

            $tmvUiData.formDialog({
                cssClass: 'dlg-height-allowance fix-min-width',
                formSchema: $tmvUiData.wrapsFieldsToFormLayout(passwordFields),
                formModel: passwords,
                translatePrefix: 'global.login',
                title: 'global.login.changePassword',
                includedFunctions: { checkPasswords: checkPasswords },
                mode: 'edit',
                okFn: okFn,
            })
        }

        /**
         * Displays modal dialog for changing user settings
         * @return {[type]}
         */
        userSettings() {
            $tmvUiData.formDialog({
                mode: 'edit',
                i18nPart: 'nbgenApp/users',
                formSchema: userSettingsConfig.uiLayout,
                docId: Meteor.userId(),
                collection: Meteor.users,
                locals: {
                    $authUiService: this,
                }
            }).then(formModel => {
                // update user settings
                Meteor.users.update({ _id: Meteor.userId() }, { $set: { profile: formModel.profile } });
            })
        }
    }

    return new AuthUiService();
}
