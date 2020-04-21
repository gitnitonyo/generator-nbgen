import moduleName from '../nbgenApp';
import { setupTmvCollection } from '../../../components/nbgenComponents';
import config from './appUsersConfig.js';
import { appRoles } from '../../../../common/app.roles';

const stateName = 'appUsers';

const rolesAllowed = [ appRoles.SUPER_ADMIN, appRoles.USER_ADMIN];    // only admin allowed
const i18npart = 'nbgenApp/users';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
