import { Mongo } from '../../components/nbgenComponents';
const collectionName = '<%= collectionName %>';

export const <%= collection.name %> = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
