/**
 * This is the entry point for the server
 */
import { Meteor } from 'meteor/meteor';

// collection for application parameters
import '/imports/common/applicationParameters/collection.js';

import './imports/imports.js';

Meteor.startup(() => {
  // code to run on server at startup
});
