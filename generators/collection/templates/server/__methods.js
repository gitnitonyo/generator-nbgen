/**
 * Defines remotely accessible methods pertinent to <%= collection.name %> collection
 */
import { Meteor } from '../common';

<%_ if (collection.options.isVirtual) {_%>
import { <%= collection.name %>, publishName } from '.';
import { PERMISSIONS } from './permissions';
<%_ } _%>

Meteor.methods({
    <%_ if (collection.options.isVirtual) {_%>
    // built-in methods
    [`/${publishName}/insert`]: collectionInsert,
    [`/${publishName}/update`]: collectionUpdate,
    [`/${publishName}/remove`]: collectionRemove
    <%_ } _%>
    // application-specific methods here
});

<%_ if (collection.options.isVirtual) {_%>
function collectionInsert(doc) {
    PERMISSIONS.insert.call(this, this.userId, doc);
    return <%= collection.name %>.insert(doc);
}

function collectionUpdate(selector, modifier) {
    const doc = <%= collection.name %>.findOne(selector);
    PERMISSIONS.update.call(this, this.userId, doc, modifier && modifier.$set, modifier);
    return <%= collection.name %>.update(selector, modifier);
}

function collectionRemove(selector) {
    const doc = <%= collection.name %>.findOne(selector);
    PERMISSIONS.remove.call(this, this.userId, doc);
    return <%= collection.name %>.remove(selector);
}
<%_ } _%>