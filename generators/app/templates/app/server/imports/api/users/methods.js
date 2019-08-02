/**
 * Defines remotely accessible methods pertinent to Users collection
 */

/* globals Assets */
import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { check } from 'meteor/check'
import { appRoles, getActiveGroup, COLLECTION_GROUP_FIELD, USER_GROUP_FIELD } from '/imports/common/app.roles.js';
import { Roles } from 'meteor/alanning:roles';

import { Organizations } from '../organizations/collection.js';

import { sendHtmlTo, sendEmail, sendEmailUsingTemplate } from '../email/methods.js';
import { getApplicationInfo } from '/imports/common/applicationParameters/collection.js';
import { escapeRegExp, serviceName } from '../common/utils.js';

import _ from 'underscore';
import _otp from 'easy-otp';

Meteor.methods({
    // enumerate remote methods here
    'users.registerUser': registerUser,
    'users.resetPassword': resetPassword,
    'users.verifyEmail': verifyEmail,
    'users.isRegistrationCompleted': isRegistrationCompleted,
    'users.completeInfo': completeInfo,
    'users.approveUser': approveUser,
    'users.deactivateUser': deactivateUser,
    'users.activateUser': activateUser,
    'users.checkReferredByEmail': _checkReferredByEmail,
    'users.createUser': _createUser,
    'users.modifyRoles': _modifyRoles,
    'accounts.isInRole': _isInRole,
    'misc.contactUs': _contactUs,
    'users.generateOTP': generateOTP,
    'users.validateOTP': validateOTP,
})

// nbgen: protection marker start

export function getUserEmail(userId) {
    const item = _.isObject(userId) ? userId : Meteor.users.findOne(userId);
    if (item) {
        const email = item.profile.mainEmail ||
            (item.emails && item.emails[0].address) ||
            (item.services && item.services.facebook && item.services.facebook.email) ||
            (item.services && item.services.google && item.services.google.email)

        return email
    }
}

function _modifyRoles(userId, params) {
    if (!Roles.userIsInRole(this.userId, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN])) {
        throw new Meteor.Error(401, "Action is not permitted");
    }
    const roles = [];
    if (params.userRoles.userAdmin) {
        roles.push(appRoles.USER_ADMIN);
    }
    if (params.userRoles.helpdesk) {
        roles.push(appRoles.HELPDESK);
    }
    Roles.setUserRoles(userId, roles, Roles.GLOBAL_GROUP);
}

function _createUser(params) {
    if (!this.userId) {
        throw new Meteor.Error(401, "Action is not permitted");
    }
    const currentUserGroup = getActiveGroup(this.userId);
    if (!Roles.userIsInRole(this.userId, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN], currentUserGroup)) {
        throw new Meteor.Error(401, "Action is not permitted");
    }

    const accountCreationParams = { email: params.email, profile: params.profile };
    if (params.password) accountCreationParams.password = params.password;

    const newUserId = Accounts.createUser(accountCreationParams);

    // update the roles
    params.roles = params.roles || { };

    // update other data for the user
    Meteor.users.update({_id: newUserId}, {$set: {
        [COLLECTION_GROUP_FIELD]: currentUserGroup,
        [`profile.${USER_GROUP_FIELD}`]: currentUserGroup,
        'profile.pendingInfo': false,
        roles: params.roles,
    }});

    return newUserId;
}

function _checkReferredByEmail(email) {
    if (!this.userId) {
        // only logged in user is allowed
        throw new Meteor.Error(401, "Action is not permitted");
    }
    const userEmail = getUserEmail(this.userId); // get email of the current user
    if (email === userEmail) {
        return false; // cannot specify own email
    }
    if (Accounts.findUserByEmail(email) === undefined) {
        const escapedEmail = escapeRegExp(email);
        if (!Meteor.users.findOne({ 'profile.mainEmail': new RegExp(`^${escapedEmail}$`, 'i') })) {
            return false;
        }
    }

    return true;
}

function _contactUs(content) {
    const emailOptions = {
        from: `Contact Us <${content.fromAddress}>`,
        subject: content.subject,
        html: `<div>From: ${content.fromAddress}</div><div><p>${content.content}</p></div>`
    };
    emailOptions.to = getApplicationInfo().contacts.helpdeskEmail || 'helpdesk@nubevtech.com';
    sendEmail.call(this, emailOptions);
}

function _isInRole(role) {
    const result = {
        isAuthenticated: false,
        hasRole: false,
    }
    if (!this.userId) return result;
    const user = Meteor.users.findOne(this.userId);
    if (!this.user) return result;

    result.isAuthenticated = true;

    result.hasRole = Roles.userIsInRole(user, role, (user.profile && user.profile._activeGroup));

    return result;
}

function deactivateUser(userId) {
    // check if current user is an admin or user is the same as
    if (!Roles.userIsInRole(this.userId, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN]) && !userId !== this.userId) {
        throw new Meteor.Error(401, "Operation is not allowed");
    }

    // deactivate user
    Meteor.users.update({ _id: userId }, { $set: { "profile.deactivated": true, deactivatedBy: this.userId, deactivatedAt: new Date() } });
}

function activateUser(userId) {
    if (!Roles.userIsInRole(this.userId, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN]) && !userId !== this.userId) {
        throw new Meteor.Error(401, "Operation is not allowed");
    }

    Meteor.users.update({ _id: userId }, { $unset: { "profile.deactivated": false, activatedBy: this.userId, activatedAt: new Date() } });
}

// for completing user information
function completeInfo(userInfo, companyInfo) {
    if (companyInfo) {
        // create a new company info
        companyInfo._registeredAt = new Date();
        companyInfo._registeredBy = this.userId;
        Organizations.insert(companyInfo);
        // update the user roles
        Meteor.users.update({ _id: this.userId }, {
            $set: {
                'profile.pendingInfo': false,
            }
        });
    }

    // send email for approval
    const userApprovalEmailHtml = Assets.getText('emailTemplates/user-approval-email.html');
    const siteName = (Meteor.settings.email && Meteor.settings.email.siteName) || 'NubeVision';
    sendHtmlTo(this.userId, `Your Account in ${siteName} is for Approval`, userApprovalEmailHtml);
}

/**
 * Check if user has completed registration info
 * @return {[type]} [description]
 */
function isRegistrationCompleted() {
    return !Roles.userIsInRole(this.userId, [appRoles.TMP_ROLE]);
}

function registerUser(options) {
    // validate parameters
    check(options.email, String);
    check(options.profile.name, String);
    check(options.password, String)

    // create a user
    Accounts.createUser(options);
    // if (newUserId) {
        // send email notification for account activation
    //    Accounts.sendVerificationEmail(newUserId)
    // }
}

/**
 * Send an email for resetting password
 * @param {[type]} email [description]
 */
function resetPassword(email) {
    // check if the specified email address exists in the system
    check(email, String)
    const user = Accounts.findUserByEmail(email)
    if (!user) {
        throw new Meteor.Error(403, "Specified email does not exist")
    }
    // send a reset password email
    Accounts.sendResetPasswordEmail(user._id)
}

function verifyEmail(token) {
    Accounts.verifyEmail(token)
}

function approveUser(userId, isApproved, comments, attachments) {
    if (!Roles.userIsInRole(this.userId, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN])) {
        throw new Meteor.Error(401, "Action is not permitted");
    }

    const updateInstruction = {
        $set: {
            'profile.pendingApproval': false,
            'profile.isApproved': isApproved,
            'profile.approvalComments': comments,
        }
    }
    if (isApproved) {
        updateInstruction.$set['profile.approvedAt'] = new Date();
    } else {
        updateInstruction.$set['profile.rejectedAt'] = new Date();
    }

    if (attachments) {
        updateInstruction.$set['profile.additionalInformation.attachments'] = attachments;
    }

    Meteor.users.update({ _id: userId }, updateInstruction)

    // set the role of the user
    const aUser = Meteor.users.findOne(userId);
    if (isApproved) {
        Roles.setUserRoles(aUser, [aUser.profile.typeOfUser], Roles.GLOBAL_GROUP);
        // send approved email notification
        const approvedEmail = Assets.getText('emailTemplates/sp-approved-email.html');
        sendHtmlTo(userId, 'Congratulations! Your Account in NubeVision has been approved!', approvedEmail);
    } else {
        Roles.setUserRoles(aUser, [appRoles.TMP_ROLE_REJECTED], Roles.GLOBAL_GROUP)
            // send rejected email notification
        const rejectedEmail = Assets.getText('emailTemplates/sp-rejected-email.html');
        sendHtmlTo(userId, 'Sorry, Your Account in NubeVision has been rejected.', rejectedEmail);
    }
}

/**
 * Generates one-time password for email verification
 * @param  {[type]} userId [description]
 * @return {[type]}        [description]
 */
export function generateOTP(userId) {
    userId = userId || this.userId;
    if (!userId) {
        throw new Meteor.Error(401, "Unauthorized");
    }
    const user = Meteor.users.findOne(userId);
    if (!user) {
        throw new Meteor.Error(404, "User is not found");
    }

    const otp = {
        code: String(_otp.getOTP()),
        generatedAt: new Date(),
    }

    // store otp to users record
    Meteor.users.update({_id: userId}, {$set: {_otp: otp}});

    // send email notification
    sendEmailUsingTemplate('user-otp-code.html', `Your ${serviceName} Activation Code`, { otp }, userId);
}

/**
 * Validates the specified OTP
 */
export function validateOTP(code, userId) {
    userId = userId || this.userId;
    if (!userId) {
        throw new Meteor.Error(401, "Unauthorized");
    }
    const user = Meteor.users.findOne(userId);
    if (!user) {
        throw new Meteor.Error(404, "User is not found");
    }

    if (user._otp && user._otp.code !== code) {
        // TODO: validate also the date
        throw new Meteor.Error(401, "Specified OTP code is invalid");
    }

    // user has been verified
    Meteor.users.update({_id: this.userId}, {$set: {
        'emails.0.verified': true,
    }, $unset: {
        'profile._otpRequired': null,
        '_otp': null,
    }});
}

// nbgen: protection marker end
