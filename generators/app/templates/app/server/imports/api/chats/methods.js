/**
 * Defines remotely accessible methods pertinent to Chats collection
 */
import { Meteor } from '../common'
import { Chats } from './index';

Meteor.methods({
    // enumerate remote methods here

    // insert a chat
    'chats.insert'() {
        return Chats.insert({
            createdAt: new Date(),
            user: this.userId || '__unknown__'
        })
    }
})
