/**
 * Declares the Messages Mongo collection here.
 */
import { Mongo } from '../common';

const collectionName = 'messages';

export const Messages = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default Messages;
