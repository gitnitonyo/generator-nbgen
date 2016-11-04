/**
 * UI utilities for nbgen
 */
import angular from 'angular'
import ngMaterial from 'angular-material'
import ngTranslate from 'angular-translate'

const moduleName = 'nbgenUtilsUi'

export default moduleName

angular.module(moduleName, [
    ngMaterial,
    ngTranslate
])
