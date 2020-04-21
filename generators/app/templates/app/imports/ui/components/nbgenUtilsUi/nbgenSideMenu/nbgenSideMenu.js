import angular from 'angular'

import nbgenUtilsUi from '../nbgenUtilsUi.js'

import template from './nbgenSideMenu.html'

const name = 'nbgenSideMenu'

class NbgenSideMenuCtrl {
    constructor($scope, $state, $mdSidenav, $parse, $injector) {
        'ngInject';

        this.$state = $state
        this.$mdSidenav = $mdSidenav
        this.$parse = $parse
        this.$injector = $injector
        this.$scope = $scope
    }

    $postLink() {
        if (!this.context) {
            this.context = this.$scope.$parent
        }
    }

    doFilterFn(menuItem) {
        if (angular.isString(menuItem.showIf)) {
            if (!this.context.$eval(menuItem.showIf)) {
                return false;
            }
        }

        const _filterFn = this.filterFn || function() { return true; };

        return _filterFn(menuItem);
    }

    _processMenuItems(menuItems, targetMenuItems) {
        angular.forEach(menuItems, (currentItem) => {
            const allowed = this.doFilterFn(currentItem);

            if (allowed) {
                const targetItem = angular.copy(currentItem);
                targetItem.isOpen = false;
                if (angular.isString(currentItem.iconClass)) {
                    const iconClasses = currentItem.iconClass.split(' ');
                    targetItem.iconClass = iconClasses[0];
                    if (iconClasses.length > 1) {
                        targetItem.additionalIconClasses = iconClasses.slice(1).join(' ');
                    } else {
                        targetItem.additionalIconClasses = 'md-icon';
                    }
                }
                targetMenuItems.push(targetItem);
                if (angular.isDefined(currentItem.submenu)) {
                    targetMenuItems.submenu = [];
                    this._processMenuItems(currentItem.submenu, targetMenuItems.submenu);
                }
            }
        });
    }

    _closeOpenItems(menuItems) {
        angular.forEach(menuItems, (item) => {
            if (angular.isDefined(item.submenu))
                item.isOpen = false;
        })
    }

    // close sidenav after action if one is found, since most of the time side menu
    // is placed inside a sidenav
    _closeSidenav() {
        if (this.sidenavId && !this.$mdSidenav(this.sidenavId).isLockedOpen()) {
            return this.$mdSidenav(this.sidenavId).close()
        }

        return Promise.resolve()
    }

    isActive(menuItem) {
        if (menuItem.action && menuItem.action.substr(0, 5) == "sref:") {
            const srefTarget = menuItem.action.substr(5).trim();
            return this.$state.includes(srefTarget);
        }

        return false;
    }

    performAction(menuItem, ev) {
        if (menuItem.action && menuItem.action.indexOf("sref:") == 0) {
            // state is specified
            this._closeSidenav().finally(() => {
                const srefTarget = menuItem.action.substr(5).trim();
                this.$state.go(srefTarget, menuItem.srefParams, menuItem.srefOptions);
            });
        } else if (menuItem.action && menuItem.action.indexOf('call:') == 0) {
            // invoke the specified function; function must defined
            // on the parent scope where the sidenav was put
            this._closeSidenav().finally(() => {
                const funcName = menuItem.action.substr(5).trim();
                const fn = this.context.$eval(funcName);
                if (angular.isFunction(fn)) {
                    fn(ev, menuItem);
                } else {
                    console.error(funcName + ' is not a function');  // eslint-disable-line
                }
            });
        } else if (menuItem.action && menuItem.action.indexOf('service:') == 0) {
            this._closeSidenav().finally(() => {
            // it's a service
                const serviceName = menuItem.action.substr(8).trim()
                if (this.$injector.has(serviceName)) {
                    this.$injector.get(serviceName)(ev, menuItem)
                }
            });
        } else if (angular.isDefined(menuItem.submenu)) {
            if (menuItem.isOpen) {
                menuItem.isOpen = false;
            } else {
                // this._closeOpenItems(this.menuItems);
                menuItem.isOpen = true;
            }
        }
    }

    $onChanges(changesObj) {
        if (changesObj.menuSchema && angular.isDefined(changesObj.menuSchema.currentValue)) {
            this.menuItems = changesObj.menuSchema.currentValue
        }
    }

    $doCheck() {

    }
}

angular.module(nbgenUtilsUi)
.component(name, {
    template,
    controllerAs: name,
    controller: NbgenSideMenuCtrl,
    bindings: {
        menuSchema: '<',
        filterFn: '<',
        sidenavId: '@',
        context: '<'
    }
})
