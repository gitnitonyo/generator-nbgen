/**
 * Declares the nbgenAuth module and it's dependencies
 */
import angular from 'angular';
import ngTranslate from 'angular-translate';

import nbgenUiUtils from '../nbgenUtilsUi';
import nbgenMeteor from '../nbgenMeteor';

const moduleName = 'nbgenAuth'
export default moduleName

angular.module(moduleName, [
    ngTranslate,
    nbgenUiUtils,
    nbgenMeteor,
])
