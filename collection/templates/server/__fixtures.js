/**
 * Contains data initialization routines for <%= collection.name %> collection
 */
import {Meteor} from 'meteor/meteor'
import {<%= collection.name %>} from '<%= relativePathToCollection %>/collection.js'

import {COLLECTION_GROUP_FIELD, GLOBAL_GROUP} from '/imports/common/app.roles.js'

/* global Assets */

Meteor.startup(() => {
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
