import { Mongo } from '/client/imports/ui/components/nbgenComponents';
const collectionName = 'organizations';

export const Organizations = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default Organizations;
