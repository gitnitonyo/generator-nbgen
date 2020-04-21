import moduleName from '../nbgenApp';
import { setupTmvCollection } from '../../../components/nbgenComponents';
import config from './serviceConfigurationsConfig.js';
import { appRoles } from '../../../../common/app.roles';

const stateName = 'serviceConfigurations';

const rolesAllowed = [ appRoles.SUPER_ADMIN ];
const i18npart = 'nbgenApp/serviceConfigurations';

setupTmvCollection(stateName, moduleName, { rolesAllowed, i18npart }, config);
