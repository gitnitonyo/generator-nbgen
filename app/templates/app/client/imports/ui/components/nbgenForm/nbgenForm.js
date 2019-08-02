import angular from 'angular'

import ngMaterial from 'angular-material';
import './datePicker/md-datetimepicker.js';
import './timepicker/md-time-picker.js';
import './mdSteppers/mdSteppers.js';
import nbgenUtilsUi from '../nbgenUtilsUi/nbgenUtilsUi.js';
import ngFileUpload from 'ng-file-upload';

const moduleName = 'nbgenForm'
export default moduleName

angular.module(moduleName, [
    ngMaterial,
    'mdSteppers',
    'ngMaterialDatePicker',
    'md.time.picker',
    ngFileUpload,
    nbgenUtilsUi,
])
