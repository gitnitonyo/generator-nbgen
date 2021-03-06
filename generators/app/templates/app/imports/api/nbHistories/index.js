/**
 * Declares the NbHistories Mongo collection here.
 */
import { Mongo } from '../common';

const collectionName = 'nbHistories';

export const NbHistories = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName);
export default NbHistories;
