import {Meteor} from 'meteor/meteor'
import {Email} from 'meteor/email'

Meteor.methods({
    'email.send': sendEmail
})

/**
 * options is an object which can have the ff. properties:
 * from: sender (e.g. 'Nubevision <helpdesk@nubevtech.com>')
 * to, cc, bcc, replyTo
 * subject
 * text, html
 * headers
 */
function sendEmail(options) {
    this.unblock()
    Email.send(options)
}
