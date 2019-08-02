import moduleName from '../nbgenApp';
import { setupTmvCollection } from '/client/imports/ui/components/nbgenComponents';
import config from './serviceConfigurationsConfig.js';
import { appRoles } from '/imports/common/app.roles.js';

const stateName = 'serviceConfigurations';

const rolesAllowed = [ appRoles.SUPER_ADMIN ];
const i18npart = 'nbgenApp/serviceConfigurations';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
