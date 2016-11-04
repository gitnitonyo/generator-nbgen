/**
 * Setup the <%= collectionName %> component
 */

import { setupNbgenComponent } from '<%= componentsImportDir %>/nbgenUtilsUi/nbgenCollectionv2.js';
import { appRoles } from '<%= commonImportDir %>/app.roles.js';

import moduleName from '<%= entryPointImportDir %>/main.js';

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
setupNbgenComponent(componentName, moduleName, <%= collection.name %>Ctrl, { state: stateConfig });
