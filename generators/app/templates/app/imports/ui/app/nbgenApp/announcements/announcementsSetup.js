import moduleName from '../nbgenApp';
import { setupTmvCollection } from '../../../components/nbgenComponents';
import config from './announcementsConfig.js';
import { appRoles } from '../../../../common/app.roles';

const stateName = 'announcements';

const rolesAllowed = [ appRoles.SUPER_ADMIN, appRoles.USER_ADMIN ];
const i18npart = 'nbgenApp/announcements';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
