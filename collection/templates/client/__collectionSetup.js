import moduleName from '../nbgenApp';
import { setupTmvCollection } from '/client/imports/ui/components/nbgenComponents';
import config from './<%=collectionName%>Config.js';
import { appRoles } from '/imports/common/app.roles.js';

const stateName = '<%=collectionName%>';

const rolesAllowed = [ appRoles.NORMAL_USER ];
const i18npart = '<%=collectionName%>';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
