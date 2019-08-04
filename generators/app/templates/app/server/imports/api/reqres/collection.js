import { Meteor } from '../common';
import { Mongo } from '../common';
import { COLLECTION_GROUP_FIELD } from '/imports/common/app.roles.js';

const collectioName = 'uploadedFiles';

export const UploadedFiles = new Mongo.Collection(collectioName);

Meteor.startup(() => {
    UploadedFiles.rawCollection().createIndex({[COLLECTION_GROUP_FIELD]: 1})
})
