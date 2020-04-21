/**
 * Contains data initialization routines for NbHistories collection
 */
import { Meteor } from '../common';
import { NbHistories } from '.';

import { COLLECTION_GROUP_FIELD, GLOBAL_GROUP } from '../../common/app.roles';

// add indices for the collection here
// properties:
// index - object to be passed as index
// options - options for the index (e.g. {unique: true})
const indices = [{
    index: {[COLLECTION_GROUP_FIELD]: 1},
}, {
    index: {[COLLECTION_GROUP_FIELD]: 1, fieldId: 1, historyStr: 1}
}, {
    index: {entryDate: 1}
}];

const fileToLoad = 'dataload/nbHistories.json';
/* global Assets */

Meteor.startup(() => {
    indices.forEach(item => {
        NbHistories._ensureIndex(item.index, item.options);
    });

    if (NbHistories.find({}).count() == 0) {
        // initial load
        Assets.getText(fileToLoad, function(err, result) {
            if (!err) {
                let collectionList = JSON.parse(result)

                collectionList.forEach(function(doc) {
                    if (!doc[COLLECTION_GROUP_FIELD]) {
                        doc[COLLECTION_GROUP_FIELD] = GLOBAL_GROUP
                    }
                    NbHistories.insert(doc);
                });
            }
        })
    }
})
