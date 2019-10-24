/**
 * Declares the Chats Mongo collection here.
 */
import { Mongo } from '../common';

const collectionName = 'chats';

export const Chats = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default Chats;
