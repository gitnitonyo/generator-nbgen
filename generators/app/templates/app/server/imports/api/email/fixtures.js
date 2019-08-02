import {Meteor} from 'meteor/meteor'
import {Accounts} from 'meteor/accounts-base'

// initialize email settings
if (!Meteor.settings.email) {
    Meteor.settings.email = {};
}
if (!Meteor.settings.email.fromEmail) Meteor.settings.email.fromEmail = 'helpdesk@nubevtech.com';
if (!Meteor.settings.email.siteName) Meteor.settings.email.siteName = 'NubeVision';
if (!Meteor.settings.email.verifyEmailSubject) Meteor.settings.email.verifyEmailSubject = "Please Verify Email Address on NubeVision service";

Meteor.startup(() => {
    if (!process.env.MAIL_URL) {
        // setup default email service
        // gmail account
        const smtp = {
            username: "xxxxxxxxxx@gmail.com",
            password: "xxxxxxxxxxx",
            server: "smtp.gmail.com",       // replace with proper smtp server
            port: 587
        }

        const mailUrl = 'smtp://' + encodeURIComponent(smtp.username) + ':'
            + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
        process.env.MAIL_URL = mailUrl;
    }
})

// customize email templates
const fromEmail = (Meteor.settings.email && Meteor.settings.email.fromEmail) || 'helpdesk@nubevtech.com';
const siteName = (Meteor.settings.email && Meteor.settings.email.siteName) || 'NubeVision';
Accounts.emailTemplates.from = `${siteName} <${fromEmail}>`;
Accounts.emailTemplates.siteName = (Meteor.settings.email && Meteor.settings.email.siteName) || 'NubeVision';
Accounts.emailTemplates.verifyEmail.subject = function() {
    return (Meteor.settings.email && Meteor.settings.email.verifyEmailSubject) || "Please Verify Email Address on NubeVision service";
}
