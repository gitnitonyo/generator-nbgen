import angular from 'angular'
import _ from 'underscore';

import nbgenUtilsUi from '../nbgenUtilsUi.js'

import template from './nbgenDataList.html';
import actionTemplate from './listActionsTemplate.html';

const componentName = 'tmvList';
const controllerAs = `$${componentName}`;

class TmvList {
    constructor($scope, $element, $injector, $mdMedia) {
        'ngInject';

        // parent controller
        this.$scope = $scope;
        this.$element = $element;
        this.$tmvUtils = $injector.get('$tmvUtils');
        this.$tmvUiUtils = $injector.get('$tmvUiUtils');
        this.$interpolate = $injector.get('$interpolate');
        this.$filter = $injector.get('$filter');
        this.$sce = $injector.get('$sce');
        this.$parse = $injector.get('$parse');
        this._randomStyles = { };
        this.$mdMedia = $mdMedia;
    }

    $onInit(){
        this.$items = this;

        this._context = this.$scope.$parent;
        this._exported = { };
        if (this.contextStr) {
            // there is a specified context to be used in computed value
            this._context = this._exported[this.contextStr] = this.$scope[this.contextStr] = this.$scope.$parent[this.contextStr];
        }

        this.lineClass = '';
        this.lineHeight =  56;
        if (this.layout.fields.length >= 5) {
            this.lineClass = 'md-3-line'
            this.lineHeight = 88;
        } else if (this.layout.fields.length >= 3) {
            this.lineClass = 'md-2-line';
            this.lineHeight = 72;
        }

        if (!this.initials) {
            this.initials = this.layout.getInitials || this.getInitials;
        }

        if (!this.layout.actionListTemplate) {
            this.layout.actionListTemplate = actionTemplate;
        }
    }

    /**
     * required by md-virtual-repeat, returns the item at specified index
     * @param  {[type]} index [description]
     * @return {[type]}
     */
    getItemAtIndex(index){
        return this.indexAt({index: index});
    }

    /**
     * Returns the number of items.
     * @return {[type]}
     */
    getLength() {
        return this.itemCount();
    }

    /**
     * Retuns random color for avatar backgrund
     * @param  {[type]} index [description]
     * @return {[type]}
     */
    _pickRandomStyle(index) {
        if (this._randomStyles[index]) return this._randomStyles[index];
        this._randomStyles[index] = this.$tmvUiUtils.pickRandomColor(true);
        return this._randomStyles[index];
    }

    getFieldValue(fieldNumber, item) {
        if (!item) return '';
        if (!angular.isArray(this.layout.fields) || fieldNumber < 0 ||
            fieldNumber >= this.layout.fields.length) {
            return '';  // no valid field specified
        }
        let result = '';
        let field = this.layout.fields[fieldNumber];
        let ngIf = true;
        if (field.ngIf) {
            ngIf = this.$parse(field.ngIf)(this._context, {item: item, $item: item});
        }
        if (field.fieldName && ngIf) {
            if (angular.isString(field.value)) {
                // result will be interpolated
                result = this.$interpolate(field.value)(_.extend({}, this._exported, {$item: item}, item));
            } else if (_.isString(field.fieldDisplay)) {
                // use the context of the layout
                result = this.$interpolate(field.fieldDisplay)({$tmvCollection: this.layout.context, $item: item});
            } else if (angular.isString(field.computedValue)) {
                if (field.computedValue.startsWith('expr:')) {
                    result = this.$interpolate(field.computedValue.substr(5))(_.extend({$context: this._context}, item))
                } else {
                    result = this.$parse(field.computedValue)(this._context, {item: item})
                }
            } else {
                result = this.$parse(field.fieldName)(item);
            }
        }
        return result;
    }

    __getIcon(item, icon) {
        if (icon && icon.startsWith('fn:')) {
            icon = icon.substr(3)
            return this.$parse(icon)(this._context, {item: item})
        }
        return icon
    }

    getFieldText(fieldNumber, item) {
        if (!item) return;
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

    getInitials(item) {
        if (!item) return;
        let fieldValue = this.getFieldValue(0, item);
        if (!angular.isString(fieldValue)) return '';
        if (this.layout.initialsCharCount == 1) {
            return fieldValue.charAt(0).toUpperCase()
        }

        return this.$tmvUtils.getInitials(fieldValue);
    }

    _tmvClick(event, item, index) {
        this.onClick({event: event, item: item, index: index})
    }

    stringify(obj) {
        return JSON.stringify(obj);
    }

    _hideAction(item) {
        return this.hideAction({item}) || (!this.layout.actionTemplate && this.hideEdit({item}) && this.hideDelete({item}))
    }

    handleClass(fieldSchema, item) {
        if (!fieldSchema || !_.isString(fieldSchema.cssClass)) return;
        if (fieldSchema.cssClass.startsWith('expr:')) {
            return this.$parse(fieldSchema.cssClass.substr(5))(this._context, {item: item});
        }
        return fieldSchema.cssClass;
    }

    handleStyle(fieldSchema, item) {
        if (!fieldSchema || !_.isString(fieldSchema.cssStyle)) return;
        if (fieldSchema.cssStyle.startsWith('expr:')) {
            return this.$parse(fieldSchema.cssStyle.substr(5))(this._context, {item: item});
        }
        return fieldSchema.cssStyle;
    }
}

angular.module(nbgenUtilsUi)
    .component(componentName, {
        template,
        controllerAs: controllerAs,
        controller: TmvList,
        bindings: {
            layout: '<tmvLayout',   // layout on how to render the list
            searchText: '<',        // should be reactive
            indexAt: '&',           // function to call to get index at
            itemCount: '&',         // function to call to get item count
            onClick: '&',
            onDelete: '&',
            onEdit: '&',
            onSort: '&',
            hideEdit: '&',
            hideDelete: '&',
            hideAction: '&',
            editDisabled: '&',
            deleteDisabled: '&',
            initials: '<',
            deleteLabel: '<',
            editLabel: '<',
            miscData: '=',
            onItem: '&',
            contextStr: '@context',           // serve as context for computed value
            tabular: '@'
        }
    });
