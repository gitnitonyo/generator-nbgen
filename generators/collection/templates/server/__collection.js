/**
 * Declares the <%= collection.name %> Mongo collection here.
 */
<% if (collectionName === 'users') { -%>
import { Meteor } from '../common';
<% } else { -%>
import { Mongo } from '../common';
<% } -%>

const collectionName = '<%= collectionName %>';

<% if (collectionName === 'users') { -%>
export const <%= collection.name %> = Meteor.users;
<% } else { -%>
export const <%= collection.name %> = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
<% } -%>
export default <%= collection.name %>;
