import { Mongo } from '../common';
const collectionName = 'organizations';
export const Organizations = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default Organizations;
