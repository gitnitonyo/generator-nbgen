/* global device */
import angular from 'angular';
import _ from 'underscore';

import template from './nbgenFileUpload.html';
import fileUploadDialogTmp from './fileUploadDialog.html';
import fileUploadActionTmp from './fileUploadAction.html';
import inlineViewerTemplate from './inlineViewer.html';
import nbgenViewerTemplate from './nbgenViewer.html';

import moduleName from '../nbgenForm.js';

import { Meteor } from '../../nbgenMeteor';
import { Accounts } from '../../nbgenMeteor';

import screenfull from '../../misc/screenfull.js';
import '../../misc/imageviewer.js';

const componentName = 'nbgenFileUpload';

const getUrl = 'files/get/';
const downloadUrl = 'files/download/';
const sessionIdKey = '_sessionId';

const previewWidth = 200;

let uploadUrl = Meteor.absoluteUrl('files/upload');

const noPreviewAvailable = './assets/images/no-preview-available.png';
const _webkitUrl = window.URL || window.webkitURL;

class NbgenFileUploadCtrl {
    constructor($scope, $element, $timeout, $tmvUiData, $translate, $tmvUiUtils, $compile, $sce, $window, $q, Upload, $mdMedia, $nbgenViewer) {
        'ngInject';

        this.$scope = $scope;
        this.$element = $element;
        this.$timeout = $timeout;
        this.$tmvUiData = $tmvUiData;
        this.$translate = $translate;
        this.$tmvUiUtils = $tmvUiUtils;
        this.$sce = $sce;
        this.$window = $window;
        this.Upload = Upload;
        this.$compile = $compile;
        this.$q = $q;
        this.$mdMedia = $mdMedia;
        this.$nbgenViewer = $nbgenViewer;

        // make the controller also available as $ctrl and vm in $scope
        $scope.$ctrl = $scope.vm = this;

        this._noPreviewAvailable = noPreviewAvailable;
    }

    $onInit() {
        if (!this.descriptionPrompt) {
            this.descriptionPrompt = 'global.common.fileDescription';
        }

        if (this.multiple) {
            this.limit = parseInt(this.limit) || 1000;     // default limit of 1000 attachments
        } else {
            this.limit = 1;
        }

        if (!this.filters) {
            // default filters; accepts image/audio/video and pdf
            this.filters = 'image\/.*|audio\/.*|video\/.*|application\/pdf';
        }

        if (!this.maxSize) {
            this.maxSize = '15MB';      // by default the maximum size which can be uploaded
        }
    }

    _convertToInternal() {
        // convert value of model to internal data storage
        const modelValue = this.ngModelCtrl.$modelValue;
        let files = angular.copy(modelValue) || [ ];
        if (!_.isArray(files)) files = [files];

        return files;
    }

    _convertToExternal() {
        const files = this._files;
        let newModelValue = [ ];
        if (_.isArray(files)) {
            _.each(files, v => {
                newModelValue.push(angular.copy(v));
            })
        }

        if (!this.multiple && this.limit === 1) {
            newModelValue = newModelValue[0];
        }

        return newModelValue;
    }

    $doCheck() {
        // syncing between ng mode and internal data storage
        if (!_.isEqual(this.$currentModelValue, this.ngModelCtrl.$modelValue)) {
            this.$currentModelValue = angular.copy(this.ngModelCtrl.$modelValue);
            let files = this._convertToInternal();
            if (!_.isEqual(files, this._files)) {
                this.$currentInternalValue = angular.copy(files);
                this._files = files;
            }
        }

        if (!_.isEqual(this.$currentInternalValue, this._files)) {
            this.$currentInternalValue = angular.copy(this._files);
            let modelValue = this._convertToExternal();
            let comparedValue = this.ngModelCtrl.$modelValue;
            if (!this.multiple && _.isArray(comparedValue) && comparedValue.length > 0) {
                comparedValue = comparedValue[0];
            }
            if (!_.isEqual(modelValue, comparedValue)) {
                if (_.isArray(modelValue) && modelValue.length === 0) {
                    this.$currentModelValue = null;
                    this.ngModelCtrl.$setViewValue(null);
                } else {
                    this.$currentModelValue = angular.copy(modelValue);
                    this.ngModelCtrl.$setViewValue(modelValue);
                }
            }
        }

        this.doCheck({$modelValue: this.$currentModelValue, $ctrl: this});
    }

    $postLink() {
        // check if there's a viewerLocation is specified
        this._uploadContainerDom = this.$element.find('.nbgen-file-upload-container');
        this._mdInputDom = this.$element.find('.md-input');
    }

    /**
     * Include infotext on messages
     */
    _errorObjects() {
        return _.extend({infotext: true}, this.ngModelCtrl.$error);
    }

    _isRequired() {
        return this.$element.attr('required');      // whether it's a required field
    }

    _onFocus() {
        this._uploadContainerDom.addClass('md-input-focused');
    }

    _onBlur() {
        this._uploadContainerDom.removeClass('md-input-focused');
        if (!this._mdInputDom.hasClass('ng-touched')) {
            this._mdInputDom.addClass('ng-touched');
            this._hasBeenTouched = true;
        }
    }

    _rawUrl(fileItem, preview, url, noEscape) {
        if (!url) { url = getUrl; }
        const _absoluteUrl = Meteor.absoluteUrl();
        let fileName = noEscape ? fileItem._file.name : encodeURIComponent(fileItem._file.name);
        let sessionId = Accounts._storedLoginToken();
        sessionId = noEscape ? sessionId : encodeURIComponent(sessionId);

        let _getUrl = `${_absoluteUrl}${url}${fileName}?docId=${fileItem.docId}&${sessionIdKey}=${sessionId}`;
        if (preview) {
            _getUrl += '&preview=yes'
        }
        return _getUrl;
    }

    _getUrl(fileItem, preview, url, noEscape) {
        if (!url) { url = getUrl; }
        const _absoluteUrl = Meteor.absoluteUrl();
        let fileName = noEscape ? fileItem._file.name : encodeURIComponent(fileItem._file.name);
        let sessionId = Accounts._storedLoginToken();
        sessionId = noEscape ? sessionId : encodeURIComponent(sessionId);

        let _getUrl = `${_absoluteUrl}${url}${fileName}?docId=${fileItem.docId}&${sessionIdKey}=${sessionId}`;
        if (preview) {
            _getUrl += '&preview=yes'
        }
        let result;
        if (Meteor.isCordova && fileItem._file.type === 'application/pdf' && device.platform.toLowerCase() === 'android') {
            result = _getUrl;
        } else {
            result = this.$sce.trustAsResourceUrl(_getUrl);
        }
        return result;
    }

    _getDownloadUrl(fileItem) {
        return this._getUrl(fileItem, false, downloadUrl);
    }

    _retrieveUrl(url) {
        return this.$q((_resolve, _reject) => {
            this.Upload.urlToBlob(url).then((blob) => {
                _resolve(_webkitUrl.createObjectURL(blob));
            }, (error) => {
                _reject(error);
            })
        })
    }

    viewFileItem(fileItem) {
        if (this.canView === false || (fileItem.isUploaded === false)) return;

        return this.$nbgenViewer(fileItem, this.viewerLocation, this.$scope);
    }

    removeFileItem(fileItem, $event) {
        $event.stopPropagation();   // prevent the higher click event to view
        // provide confirmation first
        this.$tmvUiUtils.confirm('tx:global.common.removeConfirm').then(() => {
            const itemPos = this._files.indexOf(fileItem);
            if (itemPos >= 0) {
                this._files.splice(itemPos, 1);
                fileItem.remove && fileItem.remove();
            }
            if (fileItem && fileItem.docId) {
                Meteor.call('uploadedFiles.removeItem', fileItem.docId, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        this.$timeout(() => this.onRemove({$item: fileItem, $ngModel: this.ngModelCtrl}));
                    }
                });
            }
        });
    }

    // creates a preview and include it in the files to upload
    __createPreview(file) {
        if (/^image/.test(file.type) && this.Upload.isResizeSupported()) {
            return this.Upload.resize(file, {width: previewWidth, quality: 0.6});
        }
    }

    __uploadFile(file) {
        if (!this.editForm || !this.editForm.uploadFile || this.editForm.uploadFile.$invalid) return;

        this._progressMode = 'determinate';
        this._isUploading = true;
        // create a preview of the file
        this.$q.when(this.uploadCtrl.__createPreview(file)).then(preview => {
            const dataToUpload = _.extend({}, {file: file, preview: preview}, (this.uploadCtrl && this.uploadCtrl.includedData({$file: file})) || {});

            this._currentUpload = this.Upload.upload({
                url: uploadUrl,
                data: dataToUpload,
                headers: {
                    'X-Auth-Token': Accounts._storedLoginToken(),
                    'X-User-Id': Meteor.userId(),
                }
            })

            this._currentUpload.then((resp) => {
                // successful upload
                this.$currentItem.fileItem = {
                    docId: resp.data.docId,
                    isUploaded: true,
                    _file: {
                        name: resp.data.filename,
                        size: resp.data.size,
                        type: resp.data.mimetype,
                    },
                    formData: [{}]
                }
                this._isUploading = false;
            }, (resp) => {
                // not successful upload
                this.$tmvUiUtils.error(resp);
                this._isUploading = false;
            }, (evt) => {
                let progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                this._progressPercentage = progressPercentage;
            })
        })
    }

    __performCancel() {
        if (this._isUploading) {
            this.$tmvUiUtils.confirm("There's an upload in progress. Are you sure you want to cancel?")
                .then(() => {
                    this._currentUpload.abort();
                    if (this.$currentItem.fileItem && this.$currentItem.fileItem.docId) {
                        this.removeUploadedItem(this.$currentItem.fileItem.docId);
                    }
                    this.close();
                })
        } else if (this.$currentItem.fileItem && this.$currentItem.fileItem.docId) {
            this.removeUploadedItem(this.$currentItem.fileItem.docId);
            this.close();
        } else {
            this.close();
        }
    }

    __removeUploadedItem(docId) {
        Meteor.call('uploadedFiles.removeItem', docId, (err) => {
            if (err) console.log(err);
        });
    }

    __saveUpload() {
        if (this.$currentItem.fileItem && this.$currentItem.fileDescription) {
            this.$currentItem.fileItem.formData = [{
                fileDescription: this.$currentItem.fileDescription
            }]
            this.hide(this.$currentItem.fileItem);
        }
    }

    uploadFileClick() {
        // display the file upload dialog
        const formModel = { }
        this.$tmvUiData.formDialog({
            formModel,
            template: fileUploadDialogTmp,
            cssClass: 'nbgen-file-upload-dialog',
            actionTemplate: fileUploadActionTmp,
            locals: {
                descriptionPrompt: this.descriptionPrompt,
                $tmvUiUtils: this.$tmvUiUtils,
                Upload: this.Upload,
                $sce: this.$sce,

                // upload file settings
                _isMultiple: false,
                _capture: 'camera',
                _description: this.description,
                _noDescription: this.noDescription,
                _filtersRe: new RegExp(this.filters),
                _maxSize: this.maxSize,

                uploadCtrl: this,
            },
            functions: {
                $initController() {
                    if (this._description) {
                        this.$currentItem.fileDescription = this._description;
                    }
                },

                _validateFile(file) {
                    return this._filtersRe.test(file.type);
                },

                uploadFile: this.__uploadFile,
                performCancel: this.__performCancel,
                removeUploadedItem: this.__removeUploadedItem,
                saveUpload: this.__saveUpload,
            }
        }).then((fileItem) => {
            this._files.push(fileItem);
            // call the on add event
            this.$timeout(() => this.onAdd({$item: fileItem, $ngModel: this.ngModelCtrl}));
        })
    }

    _pickRandomStyle(index) {
        if (!this._randomStyles) this._randomStyles = [ ];
        if (this._randomStyles[index]) return this._randomStyles[index];
        this._randomStyles[index] = this.$tmvUiUtils.pickRandomColor(true);
        return this._randomStyles[index];
    }
}

class NbgenViewerCtrl {
    constructor($sce, $tmvUiUtils) {
        'ngInject';
        this.$sce = $sce;
        this.$tmvUiUtils = $tmvUiUtils;
    }

    $onInit() {
        if (!this.type && this.fileItem) {
            this.type = (this.fileItem._file && this.fileItem._file.type) || (this.fileItem.file && this.fileItem.file.mimetype);
        }
        if (!this.docId && this.fileItem) {
            this.docId = this.fileItem.docId;
        }
        if (!this.filename && this.fileItem) {
            this.filename = (this.fileItem._file && this.fileItem._file.name) || (this.fileItem.file && this.fileItem.file.originalname);
        }
        if (this.$tmvUiUtils.isMobile()) {
            // force the use of pdfjs in mobile
            this.pdfJs = 'true';
        }
    }

    /**
     * Returns a non-sanitized url
     */
    getRawUrl() {
        let result = this.srcUrl;
        if (!result) {
            const _absoluteUrl = Meteor.absoluteUrl(getUrl);
            let fileName = encodeURIComponent(this.filename);
            let sessionId = encodeURIComponent(Accounts._storedLoginToken());
            let docId = encodeURIComponent(this.docId);

            result = `${_absoluteUrl}${fileName}?docId=${docId}&${sessionIdKey}=${sessionId}`;
        }

        return result;
    }

    /**
     * Returns a sanitized url
     */
    getUrl() {
        let url = this.getRawUrl();
        if (this.type ==='application/pdf' && this.pdfJs === 'true') {
            url = encodeURIComponent(url);
            url = `/pdfjs/web/viewer.html?file=${url}`;
        }
        return this.$sce.trustAsResourceUrl(url);
    }

}

class NbgenInlineViewerCtrl {
    constructor($element, $scope) {
        'ngInject';

        this.$element = $element;
        this.$scope = $scope;
        this.$isCordova = Meteor.isCordova;
    }

    closeInlineViewer() {
        this.$element.remove();
        this.onClose();
    }

    isFullscreenSupported() {
        return screenfull.enabled;
    }

    $postLink() {
        this._listenerFn = function() {
            this.$scope.$apply(() => {
                this.inFullscreen = screenfull.isFullscreen;
            })
        }.bind(this);
        screenfull.on('change', this._listenerFn)
    }

    $destroy() {
        screenfull.off('change', this._listenerFn);
    }

    gotoFullscreen() {
        screenfull.request(this.$element[0]);
    }

    isInFullscreen() {
        return this.inFullscreen;
    }
}

angular.module(moduleName)
    .component(componentName, {
        controllerAs: componentName,
        controller: NbgenFileUploadCtrl,
        require: {
            ngModelCtrl: 'ngModel',
        },
        template,
        bindings: {
            label: '@',
            multiple: '@',
            name: '@',
            filters: '@',
            maxSize: '@',
            limit: '@',
            noAdd: '&',
            noRemove: '&',
            canView: '&',
            readOnly: '&',
            noDescription: '@',
            description: '@',
            alwaysRed: '@',

            hint: '@',
            hintLabel: '@',
            infoText: '@',

            descriptionPrompt: '@',
            descriptionOnly: '@',
            noDirty: '@',
            includedData: '&',

            // events
            onAdd: '&',
            onRemove: '&',

            // support for inline viewer
            viewerLocation: '@',

            doCheck: '&',
        }
    }).directive('nbgenImageViewer', function() {
        'ngInject';
        let viewerOptions = {

        };

        return {
            restrict: 'AC',
            link: function($scope, $element, $attrs) {
                $element.ImageViewer(viewerOptions);
                let viewer = $element.data('ImageViewer');

                $attrs.$observe('nbgenImageViewer', (value) => {
                    if (value && value.length > 0) {
                        viewer.load(value);
                    }
                });

                $scope.$on('$destroy', function() {
                    viewer.destroy();
                })
            }
        }
    })
    .component('nbgenViewer', {
        template: nbgenViewerTemplate,
        controller: NbgenViewerCtrl,
        controllerAs: 'vm',
        bindings: {
            fileItem: '<file',
            pdfJs: '@',
            type: '@',
            docId: '@',
            filename: '@',
            srcUrl: '@src',
        }
    })
    .component('nbgenInlineViewer', {
        template: inlineViewerTemplate,
        controllerAs: 'inlineViewer',
        controller: NbgenInlineViewerCtrl,
        bindings: {
            fileItem: '<file',
            pdfJs: '@',
            onClose: '&',
        }
    })
    .factory('$nbgenViewer', function($tmvUiData, $rootScope, $compile) {
        'ngInject';

        return nbgenViewerFn;

        function nbgenViewerFn(fileItem, location, scopeToUse) {
            if (!location) {
                // use a form dialog
                return $tmvUiData.formDialog({
                    mode: 'view',
                    template: `<nbgen-inline-viewer file="vm.fileItem" on-close="vm.hide()"></nbgen-inline-viewer>`,
                    useTemplateInFull: true,
                    cssClass: 'tmv-full-viewer-dialog',
                    locals: {
                        fileItem: fileItem,
                    }
                });
            }

            // create a new scope for the inline viewer
            let locDom = angular.element(location);
            if (locDom.length === 1) {
                locDom.empty();     // remove previous content
                scopeToUse = scopeToUse || $rootScope;
                let newScope = scopeToUse.$new(true);
                newScope.fileItem = fileItem;
                let domToInsert = angular.element(`<nbgen-inline-viewer file="fileItem" on-close="onClose()"></nbgen-inline-viewer>`);
                newScope.onClose = function() {
                    domToInsert.remove(); locDom.addClass('ng-hide');
                    newScope.$destroy();
                };
                newScope.$on('$destroy', function() {
                    domToInsert.remove(); locDom.addClass('ng-hide');
                });
                locDom.append(domToInsert);
                $compile(domToInsert)(newScope);
                locDom.removeClass('ng-hide');
            }
        }
    })
