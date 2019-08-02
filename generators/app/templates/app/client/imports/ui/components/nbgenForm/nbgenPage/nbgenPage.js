/**
 * Implements pager for especially complex forms
 */
import angular from 'angular';
import _ from 'underscore';
import moduleName from '../nbgenForm.js';
import { getScrollingParent } from '../../nbgenComponents';

import template from './nbgenPages.html';
import pageTemplate from './nbgenPage.html';

const directiveName = 'tmvPages';
const controllerAs = `$${directiveName}`;

angular.module(moduleName)
.directive(directiveName, function($parse, $timeout) {
    'ngInject';

    class TmvPagesCtrl {
        constructor($scope, $element, $attrs, $transclude) {
            'ngInject';
            this.$scope = $scope;
            this.$element = $element;
            this.$attrs = $attrs;
            this.$transclude = $transclude;

            this._pagesSchemaParser = $parse($attrs[directiveName] || $attrs.pagesSchema);
            this.__pageCtrls = [ ];     // contains controller for pages
            this._activePage = 0;
        }

        $onInit() {
            // initialize variables
            this.pagesSchema = this._pagesSchemaParser(this.$scope) || { };
            if (!_.isObject(this.pagesSchema)) {
                throw "No valid page schema specified";
            }

            let activeStr = (this.pagesSchema.activeOn || false).toString();
            this._isActiveParser = $parse(activeStr);
        }

        $postLink() {
            let whereToPut = this.$element.find('.tmv-pages-container.tmv-pages-above');
            this.$transclude(this.$scope.$new(), function(clone) {
                whereToPut.after(clone);
            });

            $timeout(() => {
                this.setActivePage(0);
            })
        }

        setActivePage(pageNo) {
            let currentActivePage = this.getActivePage();
            _.each(this.__pageCtrls, (item, i) => {
                if (i === pageNo) {
                    item.setActive(true);
                    let fromLeft = pageNo < this._activePage;
                    this._activePage = pageNo;
                    let newActivePage = this.getActivePage();
                    if (newActivePage) {
                        if (fromLeft) {
                            newActivePage.setFromLeft();
                        } else {
                            newActivePage.setFromRight();
                        }
                    }
                    currentActivePage && (currentActivePage._visited = true);
                    // use scroll parent to go the top
                    let scrollingParent = getScrollingParent(this.$element);
                    scrollingParent.scrollTop = 0;
                } else {
                    item.setActive(false);
                }
            });
        }

        onLastPage() {
            return this._activePage === this.__pageCtrls.length-1;
        }

        onFirstPage() {
            return this._activePage === 0;
        }

        gotoNextPage() {
            if (!this.onLastPage()) {
                this.setActivePage(this._activePage + 1);
            }
        }

        gotoPreviousPage() {
            if (!this.onFirstPage()) {
                this.setActivePage(this._activePage - 1);
            }
        }

        gotoPage(pageNo) {
            this.setActivePage(pageNo);
        }

        $doCheck() {
            this.__activeState = this.isActive();
            if (this.__previousActiveState !== this.__activeState) {
                this.__previousActiveState = this.__activeState;
                if (this.__activeState === true) {
                    this.__reset();
                }
            }
        }

        __reset() {
            _.each(this.__pageCtrls, (page) => {
                page._visited = false;
                this.setActivePage(0);
                let scrollingParent = getScrollingParent(this.$element);
                scrollingParent.scrollTop = 0;
            })
        }

        addPage(pageCtrl) {
            const pageOrder = pageCtrl.pageSchema.pageOrder || 0;
            if (pageCtrl.pageSchema.pageOrder === undefined) {
                pageCtrl.pageSchema.pageOrder = pageOrder;
            }
            let whereToInsert = this.__pageCtrls.length;
            while (whereToInsert > 0) {
                if (pageOrder >= this.__pageCtrls[whereToInsert-1].pageSchema.pageOrder) {
                    break;
                }
                whereToInsert -= 1;
            }
            this.__pageCtrls.splice(whereToInsert, 0, pageCtrl);
        }

        removePage(pageCtrl) {
            let index = this.__pageCtrls.indexOf(pageCtrl);
            if (index >= 0) {
                this.__pageCtrls.splice(index, 1);
            }
        }

        isActive() {
            return this.__pageCtrls && this.__pageCtrls.length > 1 && this._isActiveParser(this.$scope);
        }

        getPages() {
            return this.__pageCtrls;
        }

        getActivePage() {
            return this.__pageCtrls[this._activePage];
        }

        isPreviousPageInValid() {
            if (this._activePage > 0) {
                return this.__pageCtrls[this._activePage-1].pageForm && this.__pageCtrls[this._activePage-1].pageForm.$invalid;
            }
            return true;
        }

        determineColors(page) {
            if (page === this.getActivePage()) {
                return { backgroundColor: 'primary' };
            }
            if (page._visited === true && page.pageForm.$invalid) {
                return { backgroundColor: 'warn' };
            }
            if (page._visited === true && !page.pageForm.$invalid) {
                return { backgroundColor: 'green-600' }
            }
            return { backgroundColor: 'background-hue-3' };
        }
    }

    return {
        transclude: true,
        restrict: 'EA',
        controller: TmvPagesCtrl,
        controllerAs: controllerAs,
        template: template,
    }
})
.directive('tmvPage', function($parse) {
    'ngInject';

    class TmvPageCtrl {
        constructor($scope, $element, $attrs, $transclude) {
            'ngInject';

            this.$scope = $scope;
            this.$element = $element;
            this.$attrs = $attrs;
            this.$transclude = $transclude;

            this._pageSchemaParser = $parse($attrs['tmvPage'] || $attrs.pageSchema);

            this.$parentPagesCtrl = this.$scope[controllerAs];
            this._isActive = false;
        }

        $onInit() {
            this.pageSchema = this._pageSchemaParser(this.$scope);
            this.$parentPagesCtrl && this.$parentPagesCtrl.addPage(this);
        }

        $postLink() {

        }

        $doCheck() {

        }

        $onDestroy() {
            this.$parentPagesCtrl && this.$parentPagesCtrl.removePage(this);
        }

        setActive(state = true) {
            this._isActive = state;
        }

        isActive() {
            return this._isActive;
        }

        isInvalid() {
            return this.pageForm && this.pageForm.$invalid;
        }

        __refreshClasses() {
            this.$element.removeClass('tmv-page-from-left').removeClass('tmv-page-from-right');
        }

        setFromLeft() {
            this.__refreshClasses();
            this.$element.addClass('tmv-page-from-left');
        }

        setFromRight() {
            this.__refreshClasses();
            this.$element.addClass('tmv-page-from-right');
        }
    }

    return {
        require: '^^tmvPages',
        transclude: true,
        restrict: 'EA',
        controller: TmvPageCtrl,
        controllerAs: '$tmvPage',
        template: pageTemplate,
        scope: true,
    }
})
