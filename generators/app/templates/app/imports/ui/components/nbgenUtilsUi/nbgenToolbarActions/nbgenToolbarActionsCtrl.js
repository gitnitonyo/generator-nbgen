import angular from 'angular';
import _ from 'underscore';
import config from './nbgenToolbarActionsConfig.js';
import template from './nbgenToolbarActions.html';
import moduleName from '../nbgenUtilsUi.js';

const name = 'nbgenToolbarActions', controllerAs = '$ctrl';

class NbgenToolbarActionsMenuCtrl {
    constructor($element, mdPanelRef, $ctrlTransclude, $timeout) {
        'ngInject';
        this.$mdPanelRef = mdPanelRef;
        this.$timeout = $timeout;
        this._toolBarElem = $element.find('.tmv-toolbar-actions-menu');
        $ctrlTransclude((el) => {
            this._toolBarElem.append(el);
        })
    }

    panelClick(ev) {
        let node = angular.element(ev.target);
        if (node.closest('md-select').length === 0) {
            this.$timeout(() => this.$mdPanelRef.close());
        }
    }

    close() {
        this.$mdPanelRef.close();
    }
}

class NbgenToolbarActionsCtrl {
    constructor($scope, $element, $transclude, $mdMedia, $compile, $timeout, $mdPanel, $tmvUiUtils) {
        'ngInject';

        this.$config = config;
        this.$scope = $scope;
        this.$transclude = $transclude;
        this.$element = $element;
        this.$mdMedia = $mdMedia;
        this.$timeout = $timeout;
        this.$mdPanel = $mdPanel;
        this.$tmvUiUtils = $tmvUiUtils;
        this._numEntries = 0;
        this._numDisplay = 0;
        this._entries = [ ];    // contains entries

        this.$transclude((el) => {
            this._expandedElm = this.$element.find('.ta-full-expanded');
            this._expandedElm.append(el);
        });

        this._throttledCheckEntries = _.throttle(this._checkEntries.bind(this), 500);
    }

    _checkEntries() {
        this._numEntries = this._expandedElm.children().length;
        let _numHidden = this._expandedElm.children('.ng-hide').length;
        this._numDisplay = this._numEntries - _numHidden;
        this.showExpanded = this._showExpanded();
    }

    showMenu(ev) {
        if (this.$panelRef) {
            this.$panelRef.open();
        } else {
            let self = this;
            let position = this.$mdPanel.newPanelPosition()
                .relativeTo(ev.target)
                .addPanelPosition(this.$mdPanel.xPosition.ALIGN_END, this.$mdPanel.yPosition.ALIGN_TOPS);

            let animation = this.$mdPanel.newPanelAnimation()
                .withAnimation(this.$mdPanel.animation.SCALE)
                .duration(150)
                .openFrom(ev.target)
                .closeTo(ev.target)

            this.$panelRef = this.$mdPanel.create({
                template: '<md-content layout="column" class="tmv-toolbar-actions-menu md-whiteframe-z2" ng-click="$ctrl.panelClick($event)"></md-content>',
                controller: NbgenToolbarActionsMenuCtrl,
                controllerAs: '$ctrl',
                bindToController: true,
                resolve: {
                    $ctrlTransclude: () => { return self.$transclude }
                },
                attachTo: angular.element(document.body),
                panelClass: 'tmv-toolbar-actions-menu-wrapper',
                position: position,
                animation: animation,
                clickOutsideToClose: true,
                escapeToClose: true,
                openFrom: ev,
                trapFocus: true,
            });
            this.$panelRef.open();
        }
    }

    $doCheck() {
        this._throttledCheckEntries();
    }

    $onInit() {
        // all controllers have been initialized
        if (!this.menuPosition) {
            this.menuPosition = 'target-right target';
        }
        if (!this.icon) {
            this.icon = 'mdi-dots-vertical mdi'
        }
        if (!this.menuWidth) {
            this.menuWidth = '4';
        }

        if (!this.screenSize) {
            this.screenSize = 'gt-xs';
        }

        this.maxEntries = parseInt(this.maxEntries) || 4;
        this.minEntries = parseInt(this.minEntries) || 2;
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
        this.$panelRef && this.$panelRef.destroy();
    }

    $postLink() {
        // all elements have been linked
        if (this._numEntries > 0) {
            const parent = this.$element.parent();
            if (parent.length > 0) {
                parent.addClass('has-toolbar-actions');
            }
        }

        // make it ready after some timeout
        this.$tmvUiUtils.showWaitDialog();
        _.defer(() => {
            this.__isReady = true;
            this.$tmvUiUtils.hideWaitDialog();
        })
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    _showExpanded() {
        if (this._numDisplay <= this.minEntries) return true;    // always expand if <= minimum entries

        return this.$mdMedia(this.screenSize) && this._numDisplay <= this.maxEntries;
    }
}

angular.module(moduleName)
    .component(name, {
        transclude: true,
        template,
        controllerAs,
        controller: NbgenToolbarActionsCtrl,
        bindings: {
            menuPosition: '@',  // target position for the menu passed into md-menu
            icon: '@',          // the icon used as main button; vertical dots as default
            menuWidth: '@',     // width of the drop down menu
            maxEntries: '@',    // maximum number of items to force to use drop down
            screenSize: '@screen',        // screen size when to use dropdown
            minEntries: '@',    // minimum number of entries before responsive dropdown is created
        }
    });
