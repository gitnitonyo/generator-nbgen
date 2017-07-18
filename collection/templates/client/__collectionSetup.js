/**
 * Setup the <%= collectionName %> component
 */

import { setupNbgenComponent } from '/client/imports/ui/components/nbgenUtilsUi/nbgenCollection/nbgenCollectionv2.js';
import { appRoles } from '/imports/common/app.roles.js';

import moduleName from '/client/imports/ui/components/nbgenApp/nbgenApp.js';

import { <%= collection.name %>Ctrl } from './<%= collectionName %>Ctrl.js';

import config from './<%= collectionName %>Config.js';

const componentName = '<%= collectionName %>';

// specify the user roles which can access this component's url
const rolesAllowed = [ appRoles.NORMAL_USER ];
let stateConfig;    // set to configure ui-router state
if (!config || !config.options || config.options.noState !== true) {
    stateConfig = {
        rolesAllowed,
        i18npart: componentName
    }
}

// initialize <<%= collectionName %>> component
setupNbgenComponent(componentName, moduleName, <%= collection.name %>Ctrl, { require: {nbgenApp: '^nbgenApp'}, state: stateConfig });
