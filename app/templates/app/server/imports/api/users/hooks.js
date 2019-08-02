import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { generateOTP } from './methods.js';

const Users = Meteor.users;     //

Meteor.startup(() => {
    // start the hookup on startup
    Users.after.insert((userId, doc) => {
        // send enrollment email if necessary
        if (_.isEmpty(doc.services)) {
            // send an enrollment email to this user
            Meteor.defer(() => Accounts.sendEnrollmentEmail(doc._id));
        } else if (doc.services.password) {
            // TODO: send OTP code
            generateOTP(doc._id);
        }
    })
})
