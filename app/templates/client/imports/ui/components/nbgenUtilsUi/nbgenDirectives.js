/**
 * Common UI directives
 */
import angular from 'angular'
import nbgenUtilsUi from './nbgenUtilsUi.js'

import _ from 'underscore'

const utils = angular.module(nbgenUtilsUi);
/**
 * A directive to immediately blur a control once it receives focus
 */
function nbgenNoFocusDirective($timeout) {
    'ngInject';

    return {
        restrict: 'AC',
        link: function(scope, elem) {
            $timeout(() => {
                elem.focus((ev) => {
                    ev.target.blur()
                })
            })
        }
    }
}

utils.directive('nbgenNoFocus', nbgenNoFocusDirective)
utils.directive('tmvNoFocus', nbgenNoFocusDirective)

/**
 * Put the content to the specified location
 */
function nbgenPutDirective($timeout) {
    'ngInject';
    return {
        restrict: 'E',
        transclude: 'element',
        compile: compileFn
    }

    function compileFn(elem, attrs) {
        let domLocation, jQueryObj

        if (_.isString(attrs.nbgenPut) && attrs.nbgenPut.length > 0) {
            // it's an attribute
            domLocation = '#' + attrs.nbgenPut
        } else if (_.isString(attrs.location)) {
            domLocation = '#' + attrs.location
        } else if (_.isString(attrs.onTitle)) {
            domLocation = '#nbgenTitleArea'
        } else if (_.isString(attrs.onSearch)) {
            domLocation = "#nbgenSearchArea";
        } else if (_.isString(attrs.onAction)) {
            domLocation = "#nbgenActionArea";
        } else if (_.isString(attrs.onAccount)) {
            domLocation = '#nbgenAccountArea';
        } else if (_.isString(attrs.onFab)) {
            domLocation = '#nbgenFloatingButtonArea';
        }

        jQueryObj = angular.element(domLocation);
        jQueryObj.empty(); // empty current content

        const placedContents = []; // use for later removing

        return function(scope, elem, attrs, ctrl, transclude) {
            jQueryObj.each(function() {
                transclude(function(clone) {
                    clone.css('width', '100%').addClass('ng-hide fade-anim');
                    placedContents.push(clone)
                    angular.element(this).append(clone);
                }.bind(this))
            })

            $timeout(() => {
                if (attrs.onlyChildren !== undefined) {
                    placedContents.forEach((item) => {
                        item.replaceWith(item.children());
                    })
                } else {
                    placedContents.forEach((item) => {
                        item.removeClass('ng-hide');
                    })
                }
            }, 0.5)

            scope.$on("$destroy", function() {
                // empty contents of the target dom
                angular.forEach(placedContents, function(dom) {
                    dom.remove();
                })
            })
        }
    }
}

utils.directive('nbgenPut', nbgenPutDirective)
utils.directive('tmvPut', nbgenPutDirective)

// Put icon into a button
function nbgenIconDirective() {
    'ngInject';

    function _compileFn(tElement, tAttrs) {
        // check if md-icon is already define
        if (tElement[0].tagName !== 'MD-BUTTON') return; // only applicable to md-button tag

        const directiveName = this.name

        // no md-icon yet
        const mdIcon = angular.element('<md-icon>');
        const iconValue = tAttrs[directiveName].split(' ');
        mdIcon.attr('md-font-icon', iconValue[0]);

        if (iconValue.length > 1) {
            mdIcon.addClass(iconValue.slice(1).join(' '));
        } else {
            // default font category is 'mdi'
            mdIcon.addClass('mdi');
        }
        const c = tElement.children()
        if (c.size() > 0) {
            if (tAttrs[`${directiveName}After`]) {
                c.first().after(mdIcon)
            } else {
                c.first().before(mdIcon)
            }
        } else {
            tElement.append(mdIcon)
        }

    }

    return {
        restrict: 'A',
        scope: false,
        priority: 1, // increase priority so we can inject the md-icon tag
        compile: _compileFn
    }
}

utils.directive('nbgenIcon', nbgenIconDirective)
utils.directive('tmvIcon', nbgenIconDirective)

// for putting label when tooltip on button
function nbgenLabelDirective() {
    'ngInject';
    function _compileFn(element, attrs) {
        if (element[0].tagName !== 'MD-BUTTON') return; // only applicable to md-button tag

        const directiveName = this.name

        let nbgenLabel = attrs[directiveName];
        if (nbgenLabel && nbgenLabel.indexOf('tx:') === 0) {
            nbgenLabel = "{{'" + nbgenLabel.substr(3) + "' | translate}}";
        }
        if (!element.hasClass('md-fab') && !element.hasClass('md-icon-button')) {
            const labelElem = angular.element('<span>');
            labelElem.text(nbgenLabel);
            const c = element.children()
            if (c.size() > 0) {
                if (angular.isDefined(attrs[`${directiveName}Before`])) {
                    c.first().before(labelElem)
                } else {
                    c.first().after(labelElem)
                }
            } else {
                element.append(labelElem);
            }
        } else if (angular.isUndefined(attrs.nbgenNoTooltip) && angular.isUndefined(attrs.noTooltip) && !(window.$$isMobile)) {
            // add a tool tip
            const tooltipElem = angular.element('<md-tooltip>')
                .addClass('nbgen-tooltip')
                .attr('md-autohide', 'true')
                .attr('md-direction', 'bottom').text(nbgenLabel);
            element.prepend(tooltipElem);
        }

        return {
            pre: function(scope, element) {
                // dir
                element.attr('aria-label', nbgenLabel);
            },
        }
    }

    return {
        restrict: 'A',
        scope: false,
        priority: 1,
        compile: _compileFn
    }
}

utils.directive('nbgenLabel', nbgenLabelDirective)
utils.directive('tmvLabel', nbgenLabelDirective)

// for coloring element
function nbgenColorDirective($mdColors) {
    'ngInject';

    function _constructMdColorAttr(colorStr) {
        const colors = colorStr.split(':');
        let theme, color;
        if (colors.length == 0) return '';
        if (colors.length == 1) {
            theme = 'default';
            color = colors[0];
        } else {
            theme = colors[0];
            color = colors[1].trim();
            if (color.length == 0) color = 'primary';
        }

        return theme + "-" + color;
    }

    return {
        restrict: 'A',
        scope: false,
        priority: 1,
        compile: function() {
            const directiveName = this.name;
            return function(scope, element, attrs) {
                // check if there's already an md-colors attribute
                if (attrs.mdColors) return;

                // parse the parameter
                const param = attrs[directiveName].split(';');

                if (param.length > 0) {
                    const mdColorAttr = {};

                    const foreground = param[0].trim();
                    if (foreground.length > 0) {
                        mdColorAttr.color = _constructMdColorAttr(foreground);
                    }

                    // background color setting
                    if (param.length > 1) {
                        const background = param[1].trim();
                        if (background.length > 0) {
                            mdColorAttr.backgroundColor = _constructMdColorAttr(background);
                        }
                    }

                    // border color setting
                    if (param.length > 2) {
                        const borderColor = param[2].trim();
                        if (borderColor.length > 0) {
                            mdColorAttr.borderColor = _constructMdColorAttr(borderColor);
                        }
                    }

                    $mdColors.applyThemeColors(element, mdColorAttr);
                }
            }
        }
    }
}

utils.directive('nbgenColor', nbgenColorDirective)
utils.directive('tmvColor', nbgenColorDirective)

function nbgenTemplateDirective($compile) {
    'ngInject';
    return {
        restrict: 'EA',
        compile: function() {
            const directiveName = this.name;
            return ($scope, $element, $attrs) => {
                const templateStr = $scope.$eval($attrs[directiveName] || $attrs.value);
                const templateDom = angular.element(templateStr);
                $element.prepend(templateDom);
                $compile(templateDom)($scope);
            }
        }
    }
}

utils.directive('nbgenTemplate', nbgenTemplateDirective);

function uppercaseDirective($timeout) {
    'ngInject';
    return {
        restrict: 'A',
        link: function($scope, $element) {
            // only applicable if place on input element
            if ($element[0].nodeName === 'INPUT') {
                $timeout(function() {
                    $element.keydown(function(ev) {
                        $timeout(function() {
                            ev.target.value = ev.target.value.toUpperCase()
                        }, 1)
                    })
                })
            }
        }
    }
}

utils.directive('nbgenUppercase', uppercaseDirective)
utils.directive('tmvUppercase', uppercaseDirective)

// avoid input field from getting maximum length by preventing
// event
function nbgenMaxlengthDirective($timeout) {
    'ngInject';
    const ignoreCodes = [8, 9, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46]
    return {
        restrict: 'A',
        require: '^ngModel',
        compile: function() {
            const directiveName = this.name
            return function($scope, $element, $attrs) {
                let maxLength = $attrs[directiveName]
                maxLength = (maxLength && parseInt(maxLength))
                if ($element[0].nodeName === 'INPUT' && maxLength) {
                    $timeout(function() {
                        $element.keydown(function(ev) {
                            if (ignoreCodes.indexOf(ev.keyCode) >= 0) return // disregard backspace and delete
                            const currentValue = ev.target.value
                            if (currentValue && currentValue.length === maxLength) {
                                ev.preventDefault()
                            }
                        })
                    })
                }
            }
        }
    }
}
utils.directive('nbgenMaxlength', nbgenMaxlengthDirective)

/**
 * For highlighting matched search
 */
utils.filter('highlight', function($mdColors, $sce) {
    function escapeRegexp(queryToEscape) {
        return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }

    return function(matchItem, query) {
        const accentColor = $mdColors.getThemeColor('accent');
        const accentColorStyle = '<span style="color: ' + accentColor + '"><b>$&</b></span>';
        const result = query && matchItem ? matchItem.replace(new RegExp(escapeRegexp(query), 'gi'),
            accentColorStyle) : matchItem;

        return $sce.trustAsHtml(result);
    };
})

// Add this directive where you keep your directives
utils.directive('onLongPress', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, $elm, $attrs) {
            $elm.bind('touchstart', function() {
                // Locally scoped variable that will keep track of the long press
                $scope.longPress = true;

                // We'll set a timeout for 600 ms for a long press
                $timeout(function() {
                    if ($scope.longPress) {
                        // If the touchend event hasn't fired,
                        // apply the function given in on the element's on-long-press attribute
                        $scope.$apply(function() {
                            $scope.$eval($attrs.onLongPress)
                        });
                    }
                }, 600);
            });

            $elm.bind('touchend', function() {
                // Prevent the onLongPress event from firing
                $scope.longPress = false;
                // If there is an on-touch-end function attached to this element, apply it
                if ($attrs.onTouchEnd) {
                    $scope.$apply(function() {
                        $scope.$eval($attrs.onTouchEnd)
                    });
                }
            });
        }
    };
})
