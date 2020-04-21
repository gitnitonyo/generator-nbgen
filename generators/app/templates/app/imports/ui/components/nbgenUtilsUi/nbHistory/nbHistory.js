import _ from 'underscore';
import angular from 'angular';
import moduleName from '../nbgenUtilsUi';

import nbHistoryPanelTemplate from './nbHistoryPanel.html';

const directiveName = 'nbHistory';

angular.module(moduleName)
    .directive(directiveName, function($reactive, $tmvUiUtils, $mdPanel) {
        'ngInject';

        class NbHistoryCtrl {
            constructor($scope, $element, $attrs) {
                'ngInject';

                this.$element = $element;
                this.$attrs = $attrs;
                $reactive(this).attach($scope);

                let $nbHistory = this;

                this.$panelCtrl = class PanelCtrl {
                    constructor() {
                        this.$nbHistory = $nbHistory;
                    }

                    selectEntry(item) {
                        if (item && item.historyStr) {
                            this.$nbHistory.$element[0].value = item.historyStr;
                            this.$nbHistory.$element.change();   // trigger change event
                        }
                        this.$nbHistory.$panelRef.close();
                    }
                }
            }

            $onInit() {
                this.fieldId = this.$attrs[directiveName];
                this.minimumNumChars = parseInt(this.$attrs.nbHistoryMinChars) || 3;    // default to 3 characters before searching
                this.debounceTime = 300;     // 300 ms before calling the handle for search
            }

            openHistoryList() {
                if (!this.$panelRef) {
                    // create the panel first
                    let position = $mdPanel.newPanelPosition()
                        .relativeTo(this.$element[0])
                        .addPanelPosition($mdPanel.xPosition.ALIGN_START, $mdPanel.yPosition.BELOW);

                    let animation = $mdPanel.newPanelAnimation()
                        .withAnimation($mdPanel.animation.SCALE)
                        .duration(150)
                        .openFrom(this.$element[0])
                        .closeTo(this.$element[0]);

                    // attach the closest md content
                    let attachTo;
                    if (this.$attrs.nbHistoryTobody) {
                        attachTo = angular.element(document.body);

                    } else {
                        attachTo = this.$element.closest('md-content');
                        if (attachTo.length === 0) {
                            attachTo = this.$element.parent();
                        }
                    }

                    this.$panelRef = $mdPanel.create({
                        template: nbHistoryPanelTemplate,
                        controller: this.$panelCtrl,
                        controllerAs: '$ctrl',
                        bindToController: true,
                        attachTo: attachTo,
                        panelClass: 'nb-history-panel',
                        position: position,
                        animation: animation,
                        clickOutsideToClose: true,
                        escapeToClose: true,
                        focusOnOpen: false,
                        disableParentScroll: false,
                        onDomAdded: () => {
                            this.$panelRef.panelEl.width(this.$element.width());
                        }
                    })
                }

                this.$panelRef.open();
            }

            searchHandler() {
                let searchValue = this.$element[0].value;   // retrieve to value to be used for searching
                if (searchValue && searchValue.length >= this.minimumNumChars) {
                    // only do searching if minimum length is reached
                    this.displayHistory(searchValue);
                } else {
                    this.$panelRef && this.$panelRef.close();
                }
            }

            displayAll() {
                this.displayHistory();
            }

            displayHistory(searchValue) {
                this.historyResult = null;
                this.openHistoryList();
                this.call('nbHistories.pickMatches', this.fieldId, searchValue, (err, result) => {
                    if (err) {
                        this.$panelRef && this.$panelRef.close();
                        $tmvUiUtils.error(err);
                    } else if (result.length > 0) {
                        // TODO: display a panel below the element to display search results
                        this.historyResult = result;
                    } else {
                        this.$panelRef && this.$panelRef.close();
                    }
                })
            }

            saveHistory() {
                let historyStr = this.$element[0].value;
                if (historyStr && historyStr.length >= this.minimumNumChars) {
                    this.call('nbHistories.saveHistory', this.fieldId, historyStr, (err) => {
                        if (err) {
                            $tmvUiUtils.error(err);
                        }
                    })
                }
            }

            $postLink() {
                let debounceFn = _.debounce(this.$bindToContext(this.searchHandler.bind(this)), this.debounceTime);

                // attach keyup handle
                this.$element.keyup(debounceFn);

                // dblclick event
                this.$element.dblclick(this.displayAll.bind(this));

                // attach blur event
                this.$element.blur(this.saveHistory.bind(this));

                // remove autocomplete attr if present to avoid conflict with the history pull down
                this.$element.attr('autocomplete', 'off');
            }
        }

        return {
            restrict: 'A',
            controller: NbHistoryCtrl,
        }
    })
