import { Mongo } from '/client/imports/ui/components/nbgenComponents';
const collectionName = 'announcements';

export const Announcements = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
