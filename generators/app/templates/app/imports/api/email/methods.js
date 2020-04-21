/* globals Assets */
import {Meteor} from '../common'
import {Email} from '../common'

import { getUserEmail } from '../users/methods.js';

import _ from 'underscore';
import moment from 'moment';
import { serviceName } from '../common/utils.js';

const fromAddress = (Meteor.settings.email && Meteor.settings.email.fromEmail) || 'helpdesk@nubevtech.com';

const templatePath = 'emailTemplates';

Meteor.methods({
    'email.send': sendEmail,
})

/**
 * options is an object which can have the ff. properties:
 * from: sender (e.g. 'Nubevision <helpdesk@nubevtech.com>')
 * to, cc, bcc, replyTo
 * subject
 * text, html
 * headers
 */
export function sendEmail(options) {
    this.unblock()
    Email.send(options)
}

export function sendEmailUsingTemplate(templateFile, subject, context, userId, bcc, attachments, ccUserId) {
    const html = Assets.getText(`${templatePath}/${templateFile}`);

    return sendHtmlTo.call(this, userId, subject, html, bcc, context, attachments, ccUserId);
}

export function sendHtmlTo(userId, subject, html, bcc, otherContext, attachments, ccUserId) {

    const _from = fromAddress;

    const emailOptions = {
        from: `${serviceName} <${_from}>`,
        subject,
    }
    const emailHeaderHtml = Assets.getText(`${templatePath}/email-header.html`);
    html = emailHeaderHtml + html;

    otherContext = _.extend({
        meteorSettings: Meteor.settings,
        serviceName: serviceName,
    }, otherContext || {});

    if (!bcc) {
        const user = Meteor.users.findOne(userId);
        const recipient = getUserEmail(user);
        if (!recipient) {
            throw new Meteor.Error(404, "User does not have a registered email address");
        }
        emailOptions.to = `${user.profile.name} <${recipient}>`;
        const context = _.extend({}, user, {appUrl: Meteor.absoluteUrl(), moment}, otherContext || {});
        html = _.template(html)(context);
    } else {
        emailOptions.bcc = bcc;
        const context = _.extend({}, {}, {appUrl: Meteor.absoluteUrl(), moment}, otherContext || {});
        html = _.template(html)(context);
    }

    if (attachments) {
        emailOptions.attachments = attachments;
    }

    if (ccUserId) {
        const ccUser = Meteor.users.findOne(ccUserId);
        const ccEmail = getUserEmail(ccUser);
        emailOptions.cc = `${ccUser.profile.name} <${ccEmail}>`;
    }

    emailOptions.html = html;

    // run the email function asynchronously
    return Meteor.defer(() => Email.send(emailOptions));
}
