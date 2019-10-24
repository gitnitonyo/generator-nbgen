/**
 * Defines remotely accessible methods pertinent to Messages collection
 */
import { Meteor } from '../common'
import { Messages } from '.';
import { check } from '../common'
import  apiai from 'apiai';

let app
if (Meteor.settings.apiai) {
    app = apiai(Meteor.settings.apiai)
}

function _checkApiRequest(request, chatId, cb) {
    request.on('response', (response) => {
        cb(null, response);
    })

    request.on('error', (error) => {
        cb(error);
    })

    request.end();
}

Meteor.methods({
    // enumerate remote methods here
    'messages.insert'(text, chatId) {
        if (!app) {
            throw new Meteor.Error(404, 'Chatbot not initialized.')
        }
        check(text, String);

        Messages.insert({
            text,
            chatId,
            user: this.userId || '__unknown__',
            createdAt: new Date()
        });

        this.unblock();         // so other clients can make a call

        let options = {
            sessionId: chatId
        };

        let request = app.textRequest(text, options);

        let response = Meteor.wrapAsync(_checkApiRequest)(request, chatId);
        text = response.result.fulfillment.speech;

        Messages.insert({
            text,
            chatId,
            user: false,
            createdAt: new Date()
        });

        return response;
    },

    'messages.remove'(messageId) {
        check(messageId, String);

        const message = Messages.findOne(messageId);
        Messages.remove(message._id);
    },
})
