/**
 * UI utilities for nbgen
 */
import angular from 'angular'
import ngMaterial from 'angular-material'
import ngTranslate from 'angular-translate'
import 'oclazyload/dist/ocLazyLoad.js';

const moduleName = 'nbgenUtilsUi'

export default moduleName

angular.module(moduleName, [
    ngMaterial,
    ngTranslate,
    'oc.lazyLoad'
])
