/**
 * Contains data initialization routines for Countries collection
 */
import {Meteor} from 'meteor/meteor'
import {Countries} from '../../../../imports/common/countries/collection.js'
import {COLLECTION_PUBLIC_FIELD} from '/imports/common/app.roles.js'

/* global Assets */

Meteor.startup(() => {
    if (Countries.find({}).count() == 0) {
        // initial load
        Assets.getText('dataload/countries.json', function(err, result) {
            if (!err) {
                let collectionList = JSON.parse(result)

                collectionList.forEach(function(doc) {
                    doc[COLLECTION_PUBLIC_FIELD] = true;    // make this public
                    Countries.insert(doc);
                });
            }
        })
    }
})

// nbgen: protection marker start
// nbgen: protection marker end
