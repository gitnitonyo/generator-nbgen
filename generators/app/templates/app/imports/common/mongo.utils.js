import { Mongo } from 'meteor/mongo';

import _ from 'underscore';

export function createLocalMongoCollection(initValues, name) {
    const collection = new Mongo.Collection(name || null, {connection: null});
    if (_.isArray(initValues)) {
        initValues.forEach((item) => {
            if (_.isObject(item)) {
                collection.insert(item);
            } else {
                collection.insert({_id: item, description: item});
            }
        })
    }

    return collection;
}
