import angular from 'angular';
import _ from 'underscore';
import moduleName from '../nbgenUtilsUi';
import template from './nbgenNav.html';

const name = 'nbgenNav',
      controllerAs = name;

class NbgenNavCtrl {
    constructor($nbgenIdentityService, $reactive, $scope, $state, $element, $timeout) {
        'ngInject'
        this.$nbgenIdentityService = $nbgenIdentityService;
        $reactive(this).attach($scope);
        this.$state = $state;
        this.$element = $element;
        this.$timeout = $timeout;
        this.eventsSuspended = false;    // indicates if mouse over is suspended
    }

    $onInit() {
        this.toggledItem = null;
        this._checkStateChanges();
        this.nbgenTheme = this.nbgenTheme || 'dark'
    }

    $postLink() {
        // find the closest toolbar
        const toolbarElem = this.$element.closest('md-toolbar');
        // make the z-index greater than other md-toolbars so the submenu will be fully visible
        if (toolbarElem.length > 0) toolbarElem.css({'z-index': 32});
    }

    __checkSubMenus(submenu) {
        let item = _.find(submenu, m => {
            if (m.action && m.action.startsWith('sref:')) {
                let mState = m.action.substr(5);
                if (this.$state.includes(mState)) return true;
            } else if (m.submenu) {
                return this.__checkSubMenus(m.submenu);
            }
            return false;
        })
        return !! item;
    }

    _checkStateChanges() {
        this.autorun(() => {
            this.getReactively('$state.current');
            if (this.menu) {
                let menuItem = _.find(this.menu, m => {
                    if (m.action && m.action.startsWith('sref:')) {
                        let mState = m.action.substr(5);
                        if (this.$state.includes(mState, m.stateParams)) return true;
                    } else if (m.submenu) {
                        return this.__checkSubMenus(m.submenu);
                    }
                    return false;
                })
                if (menuItem && this.currentNavItem !== menuItem.menuId) {
                    this.currentNavItem = menuItem.menuId
                }
            }
        })
    }

    isVisible(menuItem) {
        if (menuItem.menuId === '__divider__') return false;        // ignore divider
        if (!_.isEmpty(menuItem.rolesAllowed)) {
            if (!this.$nbgenIdentityService.isInRole(menuItem.rolesAllowed)) {
                return false;
            }
        }
        return true;
    }

    isDisabled(menuItem) {
        return menuItem.menuId === this.currentNavItem;
    }

    isToogled(menuItem) {
        return this.toggledItem === menuItem.menuId;
    }

    doAction(menuItem) {
        if (menuItem.submenu) {
            this.toggledItem = menuItem.menuId;
        } else {
            this.$timeout(() => this.toggledItem = null);
            if (menuItem.action && menuItem.action.startsWith('sref')) {
                const stateToGo = menuItem.action.substr(5);
                this.$state.go(stateToGo, menuItem.stateParams)
            }
        }
    }

    mouseEnter(menuItem) {
        if (this.eventsSuspended || this.noHoverExpand) return;         // no handling if set
        if (this.toggledItem !== menuItem.menuId) {
            this.toggledItem = menuItem.menuId;
        }
    }

    mouseLeave(menuItem) {          // eslint-disable-line
        if (this.eventsSuspended || this.noHoverExpand) return;
        this.toggledItem = null;
    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controller: NbgenNavCtrl,
        controllerAs,
        bindings: {
            menu: "<",
            noHoverExpand: "@",     // disable expand of submenu on hover
            nbgenTheme: "@",
        }
    })