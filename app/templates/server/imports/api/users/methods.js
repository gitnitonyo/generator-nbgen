/**
 * Defines remotely accessible methods pertinent to Users collection
 */
import {Meteor} from 'meteor/meteor'
import {Accounts} from 'meteor/accounts-base'
import {check} from 'meteor/check'

Meteor.methods({
    // enumerate remote methods here
    'users.registerUser': registerUser,
    'users.resetPassword': resetPassword,
    'users.verifyEmail': verifyEmail
})

// nbgen: protection marker start
function registerUser(options) {
    // validate parameters
    check(options.email, String);
    check(options.profile.name, String);
    check(options.password, String)

    let newUserId = Accounts.createUser(options);
    if (newUserId) {
        // send email notification for account activation
        Accounts.sendVerificationEmail(newUserId)
    }
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

// nbgen: protection marker end
