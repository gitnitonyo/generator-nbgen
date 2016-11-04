/**
 * Declares the Announcements Mongo collection here.
 */
import {Mongo} from 'meteor/mongo'

const collectionName = 'announcements'

export const Announcements = new Mongo.Collection(collectionName)

// nbgen: protection marker start
// nbgen: protection marker end
