/**
 * Declares the AuditLogs Mongo collection here.
 */
import {Mongo} from '../common'

const collectionName = 'auditLogs'

export const AuditLogs = Mongo.Collection.get(collectionName) || new Mongo.Collection(collectionName)

// nbgen: protection marker start
// nbgen: protection marker end
