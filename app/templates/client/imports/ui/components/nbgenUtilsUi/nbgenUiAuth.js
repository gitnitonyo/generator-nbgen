import angular from 'angular'
import {Meteor} from 'meteor/meteor'
import {Accounts} from 'meteor/accounts-base'
import _ from 'underscore'

import nbgenUtilsUi from './nbgenUtilsUi.js'

import userSettingsUI from './nbgenUserSettings.json'

const $meteor = Meteor

let _emailVerificationToken, _emailVerificationDone,
    _resetPasswordToken, _resetPasswordDone

Accounts.onEmailVerificationLink(function(token, done) {
    _emailVerificationDone = done
    _emailVerificationToken = token
})

Accounts.onResetPasswordLink(function(token, done) {
    _resetPasswordToken = token
    _resetPasswordDone = done
})


angular.module(nbgenUtilsUi)
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
                                $timeout(() => $state.go('home'))
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

        function resetPassword(token, done) {
            let passwords = { }

            let commonFieldOptions = {
                fieldValidateRulesRequired: true,
                fieldValidateRulesMaxlength: 50,
                fieldValidateRulesMinlength: 5,
                fieldInputType: 'password',
                useMdMaxlength: false,
            }

            let fields = [
                {
                    fieldName: "password",
                    leftIcon: "mdi-key mdi",
                },
                {
                    fieldName: "reEnterPassword",
                    leftIcon: "mdi-key-variant mdi",
                    fieldValidateRulesCustom: {
                        errorId: 'passwordsDontMatch',
                        validationFn: 'vm.checkPasswords'
                    }
                }
            ]

            angular.forEach(fields, function(field) {
                angular.extend(field, commonFieldOptions);
            })

            let checkPasswords = function() {
                if (!_.isEmpty(this.formModel.password) && !_.isEmpty(this.formModel.reEnterPassword)) {
                    return this.formModel.password === this.formModel.reEnterPassword
                }
                return true;
            }

            $timeout(function() {
                $tmvUiData.formDialog({
                    formSchema: $tmvUiData.wrapsFieldsToFormLayout(fields),
                    formModel: passwords,
                    translatePrefix: 'global.login',
                    title: 'global.login.newPassword',
                    includedFunctions: {checkPasswords: checkPasswords},
                    mode: 'edit'
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
                })
            })
        }
    })

function authUiService($tmvUiData, $translate, $tmvUiUtils, $rootScope, $state, $nbgenAuthProviderService) {
    'ngInject';

    return {
        changePassword,
        userSettings,
        resetPassword,
        getUserAvatar
    }

    function getUserAvatar(user) {
        if (!user) {
            user = Meteor.user()
        }
        let imgUrl
        if (user && user.services) {
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
        if (imgUrl) {
            // $timeout(() => {
            //    angular.element('img.tmv-profile').error((event) => {
            //        event.target.src = '/assets/images/account-profile-icon.png'
            //    })
            // })
            return `<img src="${imgUrl}" class="md-avatar tmv-profile" />`
        }

        return '<i class="mdi-account mdi tmv-profile"></i>'
    }

    /**
     * For resetting password
     */
    function resetPassword() {
        let formModel = { }
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
    function changePassword() {
        let passwords = { }
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
        }, {
            fieldName: 'newPassword'
        }, {
            fieldName: 'reEnterPassword',
            fieldValidateRulesCustom: {
                errorId: 'passwordsDontMatch',
                validationFn: 'vm.checkPasswords'
            }
        }]

        angular.forEach(passwordFields, function(passwordField) {
            angular.extend(passwordField, commonFieldOptions)
        })

        // this will bound to the controller of the dialog
        function checkPasswords() {
            if (!_.isEmpty(this.formModel.newPassword) && !_.isEmpty(this.formModel.reEnterPassword)) {
                return this.formModel.newPassword === this.formModel.reEnterPassword
            }
            return true;
        }

        function okFn(formModel, $mdDialog) {
            // now let's call the service to change the password
            $nbgenAuthProviderService.changePassword(formModel.oldPassword, formModel.newPassword, function(err) {
                if (err) {
                    $tmvUiUtils.error(err);
                } else {
                    $mdDialog.hide();
                    $tmvUiUtils.alert('tx:global.login.changePasswordSuccess')
                }
            })
        }

        $tmvUiData.formDialog({
            formSchema: $tmvUiData.wrapsFieldsToFormLayout(passwordFields),
            formModel: passwords,
            translatePrefix: 'global.login',
            title: 'global.login.changePassword',
            includedFunctions: {checkPasswords: checkPasswords},
            mode: 'edit',
            okFn: okFn
        })
    }

    /**
     * Displays modal dialog for changing user settings
     * @return {[type]}
     */
    function userSettings() {
        let commonFieldOptions = {

        }
        let fields = [{
            fieldName: 'profile.name',
            fieldValidateRulesRequired: true
        }, {
            fieldName: 'profile.mobile'
        }]

        angular.forEach(fields, function(field) {
            angular.extend(field, commonFieldOptions)
        })

        let formLayout = userSettingsUI || $tmvUiData.wrapsFieldsToFormLayout(fields)

        function okFn(formModel, $mdDialog) {
            $meteor.users.update(
                {_id: $meteor.userId()},
                {$set: {profile: formModel.profile}}
            , function(err) {
                if (err) {
                    $tmvUiUtils.error(err);
                } else {
                    $mdDialog.hide(formModel)
                }
            })
        }

        $tmvUiData.formDialog({
            formSchema: formLayout,
            docId: $meteor.userId(),
            collection: $meteor.users,
            translatePrefix: 'global.login.user',
            title: 'global.login.user.label.settings',
            includedFunctions: {
                getEmail: function() {
                    const currentItem = this.$currentItem
                    if (currentItem) {
                        if (currentItem.emails && currentItem.emails.length > 0) {
                            return currentItem.emails[0].address
                        }
                        if (currentItem.services) {
                            if (currentItem.services.facebook) return currentItem.services.facebook.email
                            if (currentItem.services.google) return currentItem.services.google.email
                        }
                    }
                }
            },
            okFn: okFn,
            mode: 'edit'
        })

    }
}
