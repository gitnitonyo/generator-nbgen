import moduleName from '../nbgenApp';
import { setupTmvCollection } from '/client/imports/ui/components/nbgenComponents';
import config from './announcementsConfig.js';
import { appRoles } from '/imports/common/app.roles.js';

const stateName = 'announcements';

const rolesAllowed = [ appRoles.SUPER_ADMIN, appRoles.USER_ADMIN ];
const i18npart = 'nbgenApp/announcements';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
