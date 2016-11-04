/**
 * This is the entry point for the server
 */
import { Meteor } from 'meteor/meteor';

// inject:imports:js
import './imports/api/admin/methods.js';
import './imports/api/announcements/fixtures.js';
import './imports/api/announcements/methods.js';
import './imports/api/announcements/permissions.js';
import './imports/api/announcements/publish.js';
import './imports/api/common/permissions.js';
import './imports/api/common/publish.js';
import './imports/api/countries/fixtures.js';
import './imports/api/countries/methods.js';
import './imports/api/countries/permissions.js';
import './imports/api/countries/publish.js';
import './imports/api/email/fixtures.js';
import './imports/api/email/methods.js';
import './imports/api/serviceConfigurations/fixtures.js';
import './imports/api/serviceConfigurations/methods.js';
import './imports/api/serviceConfigurations/permissions.js';
import './imports/api/serviceConfigurations/publish.js';
import './imports/api/users/fixtures.js';
import './imports/api/users/methods.js';
import './imports/api/users/permissions.js';
import './imports/api/users/publish.js';
// endinject

Meteor.startup(() => {
  // code to run on server at startup
});
