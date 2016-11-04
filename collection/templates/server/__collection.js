/**
 * Declares the <%= collection.name %> Mongo collection here.
 */
<% if (collectionName === 'users') { -%>
import {Meteor} from 'meteor/meteor'
<% } else { -%>
import {Mongo} from 'meteor/mongo'
<% } -%>

const collectionName = '<%= collectionName %>'

<% if (collectionName === 'users') { -%>
export const <%= collection.name %> = Meteor.users
<% } else { -%>
export const <%= collection.name %> = new Mongo.Collection(collectionName)
<% } -%>

// nbgen: protection marker start
// nbgen: protection marker end
