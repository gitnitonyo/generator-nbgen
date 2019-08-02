import angular from 'angular';

import config from './tmvImageViewerConfig.js';
import template from './tmvImageViewer.html';
import moduleName from '../nbgenUtilsUi';
import '../../misc/imageviewer';
import screenfull from '../../misc/screenfull';

const name = 'tmvImageViewer';
const controllerAs = name;
const defaultOptions = {
    zoomValue: 100,
    snapView: true,
    zoomOnMouseWheel: true,
}

class TmvImageViewerCtrl {
    constructor($element, $timeout) {
        'ngInject';

        this.$config = config;
        this.$element = $element;
        this.$timeout = $timeout;
    }

    $onInit() {
        // all controllers have been initialized
        if (this.zoomChange) {
            this.zoomChange = parseInt(this.zoomChange);
        } else {
            this.zoomChange = 20;
        }
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
        this.$imageViewer && this.$imageViewer.destroy();
    }

    $postLink() {
        // all elements have been linked
    }

    $onChanges(changesObj) {    // eslint-disable-line
        if (changesObj.imgUrl.currentValue !== changesObj.imgUrl.previousValue && this.imgUrl) {
            // there's an image URL initialze image viewer
            this.$imageViewer && this.$imageViewer.destroy();
            this.$imageContainer = this.$element.find('.image-container');
            this.$imageContainer.ImageViewer(angular.extend({}, defaultOptions, this.options || {}));
            this.$imageViewer = this.$imageContainer.data('ImageViewer');
            this.$timeout(() => {
                this.$imageViewer.load(this.imgUrl);
            })
        }
    }

    $doCheck() {

    }

    zoomIn() {
        this.$imageViewer.zoom(this.$imageViewer.zoomValue + this.zoomChange);
    }

    zoomOut() {
        this.$imageViewer.zoom(this.$imageViewer.zoomValue - this.zoomChange);
    }

    resetZoom() {
        this.$imageViewer.resetZoom();
    }

    isFullscreenSupported() {
        return screenfull.enabled;
    }

    isInFullscreen() {
        return screenfull.isFullscreen;
    }

    fullscreen() {
        screenfull.request(this.$element.parent()[0]);
    }

    exitFullscreen() {
        screenfull.exit().finally(() => {
            this.$imageViewer.refresh();
        });
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: controllerAs,
        controller: TmvImageViewerCtrl,
        bindings: {
            imgUrl: '@',
            options: '<',
            zoomChange: '@',
            $imageViewer: '=viewer',    // for accessing the viewer outside of the component
        }
    })
