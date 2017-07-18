/**
 * Contains data initialization routines for <%= collection.name %> collection
 */
import {Meteor} from 'meteor/meteor'
import {<%= collection.name %>} from '/imports/common/<%= collectionName %>/collection.js'

import {COLLECTION_GROUP_FIELD, GLOBAL_GROUP} from '/imports/common/app.roles.js'

// add indices for the collection here
// properties:
// index - object to be passed as index
// options - options for the index (e.g. {unique: true})
const indices = [ ];
/* global Assets */

Meteor.startup(() => {
    indices.forEach(item => {
        <%=collection.name%>._ensureIndex(item.index, item.options);
    });

    if (<%= collection.name %>.find({}).count() == 0) {
        // initial load
        Assets.getText('dataload/<%= collectionName %>.json', function(err, result) {
            if (!err) {
                let collectionList = JSON.parse(result)

                collectionList.forEach(function(doc) {
                    if (!doc[COLLECTION_GROUP_FIELD]) {
                        doc[COLLECTION_GROUP_FIELD] = GLOBAL_GROUP
                    }
                    <%= collection.name %>.insert(doc);
                });
            }
        })
    }
})

// nbgen: protection marker start
// nbgen: protection marker end
