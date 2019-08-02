import angular from 'angular';
import _ from 'underscore';

import { Meteor } from '/client/imports/ui/components/nbgenComponents';
import { NbgenBaseNgComponent } from '/client/imports/ui/components/nbgenComponents';
import config from './nbgenRegisterConfig.js';
import template from './nbgenRegister.html';
import moduleName from '../nbgenApp';
import additionalInfoTemplate from './additionalInfo.html';
import { appRoles } from '/imports/common/app.roles.js';

const name = 'nbgenRegister';
const controllerAs = '$tmvCollection';

class NbgenRegisterCtrl extends NbgenBaseNgComponent {
    constructor($mdStepper, $timeout, $tmvUiUtils, $state, $reactive, $scope,
        $showPrivacyPolicy, $showTermsAndConditions, $authUiService, $nbgenIdentityService) {    // eslint-disable-line
        'ngInject';

        super(arguments);
        this.$config = config
        this.$currentItem = { };
        $reactive(this).attach($scope);
        this.additionalInfoTemplate = additionalInfoTemplate;
        this.viewMode = 'new';
        this.inRegistration = true;
        this._ready = false;
    }

    $onInit() {
        // all controllers have been initialized
        this._currentStep = 0;
        this.autorun(() => {
            // determine the active step
            const $currentUser = this.$currentUser = Meteor.user();
            if (!$currentUser) {
                this._currentStep = 0;
            } else if ($currentUser && this.$nbgenIdentityService.isInRole(appRoles.SUPER_ADMIN)) {
                this.$state.go('home');
            } else if ($currentUser && $currentUser.emails && $currentUser.emails[0].verified !== true) {
                this._currentStep = 1;
            } else if ($currentUser && $currentUser.profile.pendingInfo !== false) {
                this._currentStep = 2;
                this.userInfo = angular.copy($currentUser);

                // initialize user
                this.companyInfo = {
                    contact: {
                        name: this.userInfo.profile.name,
                        email: this.userInfo.profile.mainEmail || this.$authUiService.getUserEmail($currentUser),
                    },
                    address: {
                        country: { _id: 'PH', name: 'Philippines' }
                    }
                }

                this.$currentItem = this.companyInfo;
            } else {
                this.$state.go('home');     // return to home
            }
        })

        this.autorun(() => {
            const $stepperCtrl = this.getReactively('$stepperCtrl');
            if ($stepperCtrl) {
                $stepperCtrl.currentStep = this.getReactively('_currentStep');
                this._ready = true;
            }
        });
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
    }

    $postLink() {
        // all elements have been linked
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    $doCheck() {
        if (!this.$stepperCtrl) {
            this.$stepperCtrl = angular.element('#registrationStepper').controller('mdStepper');
        }
    }

    checkPasswords() {
        if (!_.isEmpty(this.$currentItem.password) && !_.isEmpty(this.$currentItem.reenterPassword)) {
            return this.$currentItem.password === this.$currentItem.reenterPassword
        }
        return true;
    }

    cancel() {
        if (this._currentStep > 0 || this.editForm.$dirty) {
            this.$tmvUiUtils.confirm('tx:nbgenRegister.prompts.confirmCancel')
                .then(() => {
                    if (this.$currentUser) Meteor.logout();
                    this.$state.go('home')
                });
        } else {
            this.$state.gotoPrevious();
        }
    }

    submitCredentials() {
        this.$tmvUiUtils.showWaitDialog('nbgenRegister.labels.processingCredentials');
        this.call('users.registerUser', {
            email: this.$currentItem.email,
            profile: {
                name: this.$currentItem.profile.name
            },
            password: this.$currentItem.password
        }, (err) => {
            this.$tmvUiUtils.hideWaitDialog();
            if (err) {
                this.$tmvUiUtils.error(err);
            } else {
                // automatically log in user and proceed to the next step
                this.$tmvUiUtils.showWaitDialog();
                Meteor.loginWithPassword(this.$currentItem.email, this.$currentItem.password, (err) => {
                    this.$tmvUiUtils.hideWaitDialog();
                    if (err) {
                        this.$tmvUiUtils.error(err);
                    }
                })
            }
        })
    }

    submitActivationCode() {
        this.$tmvUiUtils.showWaitDialog();
        let activationCode = this.$currentItem.activationCode;
        this.call('users.validateOTP', activationCode, (err) => {
            this.$tmvUiUtils.hideWaitDialog();
            if (err) {
                this.$tmvUiUtils.error(err);
            }
        })
    }

    submitAdditionalInfo() {
        this.$tmvUiUtils.showWaitDialog();
        Meteor.call('users.completeInfo', this.$tmvUiUtils.cleanUpData(this.userInfo),
            this.$tmvUiUtils.cleanUpData(this.companyInfo, true), (err) => {
                this.$tmvUiUtils.hideWaitDialog();
                if (err) {
                    this.$tmvUiUtils.error(err);
                } else {
                    this.$state.go('home');
                    this.$timeout(() => {
                        Meteor.logout();
                        this.$tmvUiUtils.alert('tx:global.login.accountsNeedApproval');
                    });
                }
            });
    }

    sendNewActivationCode() {
        this.$tmvUiUtils.showWaitDialog();
        this.call('users.generateOTP', (err) => {
            this.$tmvUiUtils.hideWaitDialog();
            if (err) {
                this.$tmvUiUtils.error(err);
            } else {
                this.$tmvUiUtils.alert('tx:nbgenRegister.prompts.newActivationCode');
            }
        })
    }

    showPrivacyPolicy() {
        this.$showPrivacyPolicy().then(() => {
            this.$currentItem.privacyPolicyAccepted = true;
        }, () => {
            this.$currentItem.privacyPolicyAccepted = false;
        })
    }

    showTermsAndConditions() {
        this.$showTermsAndConditions().then(() => {
            this.$currentItem.termsAndConditionsAccepted = true;
        }, () => {
            this.$currentItem.termsAndConditionsAccepted = false;
        })
    }

    _notAccepted() {
        return !this.$currentItem.privacyPolicyAccepted || !this.$currentItem.termsAndConditionsAccepted;
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: controllerAs,
        controller: NbgenRegisterCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
