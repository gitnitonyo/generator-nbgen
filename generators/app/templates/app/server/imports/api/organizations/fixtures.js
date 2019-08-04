/**
 * Contains data initialization routines for Organizations collection
 */
// import _ from 'underscore';
import { Meteor } from '../common'
import { Organizations } from './collection.js';
// import { Users } from '../users/collection.js';
// import { Announcements } from '../announcements/collection.js';

import { COLLECTION_GROUP_FIELD, GLOBAL_GROUP } from '/imports/common/app.roles.js'

/* global Assets */

Meteor.startup(() => {
    if (Organizations.find({}).count() == 0) {
        // initial load
        Assets.getText('dataload/organizations.json', function(err, result) {
            if (!err) {
                let collectionList = JSON.parse(result)

                collectionList.forEach(function(doc) {
                    if (!doc[COLLECTION_GROUP_FIELD]) {
                        doc[COLLECTION_GROUP_FIELD] = GLOBAL_GROUP
                    }
                    Organizations.insert(doc);
                });
            }
        })
    }

    /*
    // fixed the pattern
    const oldTinPattern = /^[0-9]{3,3}\-[0-9]{3,3}\-[0-9]{3,3}\-[0-9]{3,3}\$/;
    const orgsToHandle = [];
    Organizations.find({}).forEach((org) => {
        if (oldTinPattern.test(org._id)) {
            console.log(`${org.name} is using old TIN. Migrating to new format...`);
            orgsToHandle.push(org);
        }
    });

    orgsToHandle.forEach((org) => {
        let oldId = org._id;
        let newId = oldId.replace(/\-/g, '');

        // migrate Users collection
        Users.find({$or: [{
            'profile._activeGroup': oldId,
        }, {
            _group: oldId
        }, {
            [`roles.${oldId}`]: { $exists: true }
        }]}).forEach((item) => {
            let set = { }, unset: { };
            if (item.profile._activeGroup === oldId) {
                set['profile._activeGroup'] = newId;
            }
            if (item._group === oldId) {
                set['_group'] = newId;
            }
            if (item.roles && item.roles[oldId]) {
                unset[`roles.${oldId}`] = null;
                set[`roles.${newId}`] = item.roles[oldId];
            }
            let updates = { };
            if (!_.isEmpty(set)) {
                updates.$set = set;
            }
            if (!_.isEmpty(unset)) {
                updates.$unset = unset;
            }
            if (!_.isEmpty(updates)) {
                Users.update({_id: item._id}, updates);
            }
        });

        // migrate announcements
        Announcements.find({_group: oldId}).forEach((item) => {
            Announcements.update({_id: item._id}, {$set: { _group: newId}});
        })
    })
    */
})

// nbgen: protection marker start
// nbgen: protection marker end
