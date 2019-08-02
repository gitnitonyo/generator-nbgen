/**
 * Contains data initialization routines for Announcements collection
 */
import {Meteor} from 'meteor/meteor'
import {Announcements} from './collection.js';

import {COLLECTION_GROUP_FIELD, GLOBAL_GROUP, COLLECTION_PUBLIC_FIELD} from '/imports/common/app.roles.js'

import moment from 'moment';

/* global Assets */

const indices = [{
    index: {[COLLECTION_GROUP_FIELD]: 1}
}];

Meteor.startup(() => {
    indices.forEach(item => {
        Announcements.rawCollection().createIndex(item.index, item.options);
    });

    if (Announcements.find({}).count() == 0) {
        // create initial announcement for this collection
        Announcements.insert({
            title: 'Welcome to nbgen 2.0',
            _public: true,
            [COLLECTION_PUBLIC_FIELD]: true,
            [COLLECTION_GROUP_FIELD]: GLOBAL_GROUP,
            dateToPost: moment().startOf('day').toDate(),
            expiryDate: moment().add(7, 'days').startOf('day').toDate(),
            content: "This is the intial generation of nbgen 2. Included are signin/signup functionalities with " +
                "social media integration, and basic user administation, announcement maintenance, " +
                "and settings for social media authentication for admin."
        })
        // initial load
        Assets.getText('dataload/announcements.json', function(err, result) {
            if (!err) {
                let collectionList = JSON.parse(result)

                collectionList.forEach(function(doc) {
                    Announcements.insert(doc);
                });
            }
        })
    }
})

// nbgen: protection marker start
// nbgen: protection marker end
