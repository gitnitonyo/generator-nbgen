/**
 * Entry point for <%= collection.name %> collection.
 * Should be imported into the main.js entry point
 */
import {<%= collection.name %>} from '/imports/common/<%= collectionName %>/collection.js'
import './fixtures.js'
import './publish.js'
import './permissions.js'
import './methods.js'

export default <%= collection.name %>
