import moduleName from '../nbgenApp';
import { setupTmvCollection } from '../../components/nbgenComponents';
import config from './config.js';
import { appRoles } from '../../../common/app.roles';

const stateName = '<%=collectionName%>';

const rolesAllowed = [ appRoles.NORMAL_USER ];
const i18npart = '<%=collectionName%>';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
