import { Mongo } from '../../../components/nbgenComponents';
const collectionName = 'countries';
export const Countries = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default Countries;
