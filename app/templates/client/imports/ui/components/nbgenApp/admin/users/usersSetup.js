import { setupNbgenComponent } from '../../../nbgenUtilsUi/nbgenCollectionv2.js';
import { appRoles } from '/imports/common/app.roles.js';
import { UsersCtrl } from './usersCtrl.js';

const componentName = 'users'
const moduleName = 'nbgenApp'

// const rolesAllowed = [appRoles.SUPER_ADMIN, appRoles.NORMAL_USER]
const rolesAllowed = [appRoles.SUPER_ADMIN];    // only super-admin allowed

setupNbgenComponent(componentName, moduleName, UsersCtrl, {
    state: {
        rolesAllowed,
        i18npart: `${moduleName}/${componentName}`,
    }
})
