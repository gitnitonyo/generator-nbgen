/**
 * Declares the Countries Mongo collection here.
 */
import {Mongo} from 'meteor/mongo'

const collectionName = 'countries'

export const Countries = new Mongo.Collection(collectionName)

// nbgen: protection marker start
// nbgen: protection marker end
