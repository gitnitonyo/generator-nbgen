import { Mongo } from '/client/imports/ui/components/nbgenComponents';
const collectionName = '<%= collectionName %>';

export const <%= collection.name %> = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default <%= collection.name %>;
