import { Mongo } from 'meteor/mongo';

import _ from 'underscore';
import { PersistentMinimongo2 } from 'meteor/frozeman:persistent-minimongo2'

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

export function createOfflineMongoCollection(name, appName, cb) {
    const collection = new Mongo.Collection(null)
    collection._name = name
    collection._offline = new PersistentMinimongo2(collection, appName, cb)

    return collection
}