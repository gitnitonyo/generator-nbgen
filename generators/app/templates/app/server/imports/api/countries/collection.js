import { Mongo } from '../common';
const collectionName = 'countries';
export const Countries = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default Countries;
