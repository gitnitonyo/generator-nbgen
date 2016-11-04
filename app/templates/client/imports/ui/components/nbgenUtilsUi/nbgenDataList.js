import angular from 'angular'

import nbgenUtilsUi from './nbgenUtilsUi.js'

import template from './nbgenDataList.html'

const name = 'tmvList'

angular.module(nbgenUtilsUi)
    .directive(name, function($tmvUtils, $tmvUiUtils, $interpolate, $filter, $sce, $parse) {
        'ngInject'

        return {
            template,
            transclude: true,
            controllerAs: name,
            controller: TmvList,
            bindToController: true,
            scope: {
                layout: '<tmvLayout',   // layout on how to render the list
                searchText: '<',        // should be reactive
                indexAt: '&',           // function to call to get index at
                itemCount: '&',         // function to call to get item count
                onClick: '&',
                onDelete: '&',
                onEdit: '&',
                hideEdit: '&',
                hideDelete: '&',
                hideAction: '&',
                initials: '<',
                deleteLabel: '<',
                editLabel: '<'
            },
            link: function(scope, element, attr, ctrl, transclude) {
                transclude(function(el) {
                    let contents = element.contents().detach();
                    element.replaceWith(contents);
                    if (el.size() > 0)
                        contents.append(el)
                })
            }
        }

        function TmvList($scope, $element, $timeout) {
            'ngInject'

            // parent controller
            this.$parentController = $element.controller()
            this.$tmvUtils = $tmvUtils
            this.$tmvUiUtils = $tmvUiUtils
            this.pageSize = 50
            this._randomStyles = { }
            this.$interpolate = $interpolate
            this.$filter = $filter
            this.$sce = $sce
            this.$parse = $parse

            this.$items = this;

            this.lineClass = 'md-3-line';
            if (this.layout.fields.length < 5) {
                this.lineClass = 'md-2-line'
            }
            /**
             * required by md-virtual-repeat, returns the item at specified index
             * @param  {[type]} index [description]
             * @return {[type]}
             */
            this.getItemAtIndex = (index) => {
                return this.indexAt({index: index});
            }
            /**
             * Returns the number of items.
             * @return {[type]}
             */
            this.getLength = () => {
                return this.itemCount();
            }

            /**
             * Retuns random color for avatar backgrund
             * @param  {[type]} index [description]
             * @return {[type]}
             */
            this._pickRandomStyle = (index) => {
                if (this._randomStyles[index]) return this._randomStyles[index];
                this._randomStyles[index] = this.$tmvUiUtils.pickRandomColor(true);
                return this._randomStyles[index];
            }

            this.getFieldValue = (fieldNumber, item) => {
                if (!item) return '';
                if (!angular.isArray(this.layout.fields) || fieldNumber < 0 ||
                    fieldNumber >= this.layout.fields.length) {
                    return '';  // no valid field specified
                }
                let result = '';
                let field = this.layout.fields[fieldNumber];
                if (field.fieldName) {
                    if (angular.isString(field.value)) {
                        // result will be interpolated
                        result = this.$interpolate(field.value)(item);
                    } else if (angular.isString(field.computedValue)) {
                        if (field.computedValue.startsWith('expr:')) {
                            result = this.$interpolate(field.computedValue.substr(5))(item)
                        } else {
                            let context = $scope.$parent
                            if (context.$tmvCollection) context = context.$tmvCollection
                            result = $parse(field.computedValue)(context, {item: item})
                        }
                    } else {
                        result = $parse(field.fieldName)(item);
                    }
                }
                return result;
            }

            this.__getIcon = (item, icon) => {
                if (icon && icon.startsWith('fn:')) {
                    icon = icon.substr(3)
                    let context = $scope.$parent
                    if (context.$tmvCollection) context = context.$tmvCollection
                    return $parse(icon)(context, {item: item})
                }
                return icon
            }

            this.getFieldText = (fieldNumber, item) => {
                let _this = this;
                let result = this.getFieldValue(fieldNumber, item);
                if (angular.isUndefined(result)) result = ''
                let field = this.layout.fields[fieldNumber];
                if (field && field.fieldName && field.searchField && this.searchText) {
                    if (angular.isString(this.searchText) && this.searchText.length > 0 && result && result.length > 0) {
                        let dom = angular.element('<span>' + result + '</span>');
                        dom.contents().each(function() {
                            let thisNode = this;
                            if (thisNode.nodeType == 3) {
                                let textStr = thisNode.nodeValue;
                                textStr = String(_this.$filter('highlight')(textStr, _this.searchText));
                                angular.element(this).replaceWith(textStr);
                            }
                        });
                        result = dom.html();
                    }
                }
                if (field && angular.isString(field.leftIcon)) {
                    const icon = this.__getIcon(item, field.leftIcon)
                    result = '<i class="' + icon + '"></i>&nbsp;' + result
                }
                if (field && angular.isString(field.rightIcon)) {
                    const icon = this.__getIcon(item, field.rightIcon)
                    result = result + '&nbsp;<i class="' + icon + '"></i>'
                }
                return angular.isString(result) ? _this.$sce.trustAsHtml(result) : result;
            }

            this.getInitials = (item) => {
                if (!item) return '';
                let fieldValue = this.getFieldValue(0, item);
                if (!angular.isString(fieldValue)) return '';
                if (this.layout.initialsCharCount == 1) {
                    return fieldValue.charAt(0).toUpperCase()
                }

                return this.$tmvUtils.getInitials(fieldValue);
            }

            this._tmvClick = (event, item, index) => {
                $timeout(() => {
                    this.onClick({event: event, item: item, index: index})
                }, 500)
            }

            if (!this.initials) this.initials = this.getInitials
        }
    })
