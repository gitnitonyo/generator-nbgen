/**
 * Defines remotely accessible methods pertinent to NbHistories collection
 */
import _ from 'underscore';
import { Meteor } from '../common';
import { NbHistories } from '.';
import { getActiveGroup, COLLECTION_GROUP_FIELD } from '../../common/app.roles';
import { escapeRegExp } from '../common/utils.js';

const maxHistory = 30;

Meteor.methods({
    // enumerate remote methods here
    'nbHistories.pickMatches': pickMatches,
    'nbHistories.saveHistory': saveHistory,
});

function pickMatches(fieldId, matchStr) {
    if (!this.userId) {
        throw new Meteor.Error(401, "Unauthorized");
    }
    let activeGroup = getActiveGroup(this.userId);
    let selector = {
        [COLLECTION_GROUP_FIELD]: activeGroup,
        fieldId: fieldId,
    }

    if (matchStr && matchStr.length > 0) {
        selector.historyStr = { $regex: '^' + escapeRegExp(matchStr) + '.*', $options: 'i' };
    }

    let sortOptions = { entryDate: -1 },
        limit = maxHistory,
        fields = { historyStr: 1, entryDate: 1 };

    return NbHistories.find(selector, {sort: sortOptions, limit: limit, fields: fields}).fetch();
}

function saveHistory(fieldId, historyStr) {
    if (!this.userId) {
        throw new Meteor.Error(401, "Unauthorized");
    }
    let activeGroup = getActiveGroup(this.userId);
    let selector = {
        [COLLECTION_GROUP_FIELD]: activeGroup,
        fieldId: fieldId
    }

    // check if there's an exact match
    let exactMatch = NbHistories.findOne(_.extend({}, selector, {historyStr: historyStr}));
    if (!exactMatch) {
        let sortOptions = {entryDate: 1};

        let cursor = NbHistories.find(selector);
        let count = cursor.count();
        if (count >= maxHistory) {
            // remove the oldest entry
            let numItemsToRemove = (count - maxHistory + 1);
            NbHistories.find(selector, {sort: sortOptions, limit: numItemsToRemove}).forEach((history) => {
                NbHistories.remove({_id: history._id});
            })
        }

        // insert to the history
        NbHistories.insert({
            [COLLECTION_GROUP_FIELD]: activeGroup,
            fieldId: fieldId,
            entryDate: new Date(),
            historyStr: historyStr,
        })
    }
}
