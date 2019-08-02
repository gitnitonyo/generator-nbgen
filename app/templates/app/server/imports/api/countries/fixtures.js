/**
 * Contains data initialization routines for Countries collection
 */
import {Meteor} from 'meteor/meteor'
import {Countries} from './collection.js'

/* global Assets */

Meteor.startup(() => {
    if (Countries.find({}).count() == 0) {
        // initial load
        Assets.getText('dataload/countries.json', function(err, result) {
            if (!err) {
                let collectionList = JSON.parse(result)

                collectionList.forEach(function(doc) {
                    Countries.insert(doc);
                });
            }
        })
    }
})

// nbgen: protection marker start
// nbgen: protection marker end
