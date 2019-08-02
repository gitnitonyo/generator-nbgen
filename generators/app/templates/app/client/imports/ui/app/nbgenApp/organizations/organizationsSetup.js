import moduleName from '../nbgenApp';
import { setupTmvCollection } from '/client/imports/ui/components/nbgenComponents';
import config from './organizationsConfig.js';
import { appRoles } from '/imports/common/app.roles.js';

const stateName = 'organizations';

const rolesAllowed = [ appRoles.SUPER_ADMIN ];
const i18npart = 'nbgenApp/organizations';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
