import { Mongo } from '../../../components/nbgenComponents';
const collectionName = 'appUsers';

export const AppUsers = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
