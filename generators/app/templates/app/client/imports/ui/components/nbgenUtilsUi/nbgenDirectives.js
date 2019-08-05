/**
 * Common UI directives
 */
import angular from 'angular'
import nbgenUtilsUi from './nbgenUtilsUi.js'
import moment from 'moment'

import _ from 'underscore';
import _s from 'underscore.string';

const utils = angular.module(nbgenUtilsUi);
/**
 * A directive to immediately blur a control once it receives focus
 */
function nbgenNoFocusDirective($timeout) {
    'ngInject';

    return {
        restrict: 'AC',
        link: function($scope, $element, $attrs) { // eslint-disable-line
            $timeout(() => {
                $element.focus((ev) => {
                    $timeout(() => ev.target.blur());
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
function nbgenPutDirective($animate) {
    'ngInject';
    return {
        restrict: 'E',
        transclude: 'element',
        compile: compileFn
    }

    function compileFn(elem, attrs) {
        let domLocation, jQueryObj, parentClass;

        if (_.isString(attrs.nbgenPut) && attrs.nbgenPut.length > 0) {
            // it's an attribute
            domLocation = '#' + attrs.nbgenPut
        } else if (_.isString(attrs.location)) {
            domLocation = '#' + attrs.location
        } else if (_.isString(attrs.onTitle)) {
            domLocation = '#nbgenTitleArea';
            parentClass = 'nbgen-has-title';
        } else if (_.isString(attrs.onSearch)) {
            domLocation = "#nbgenSearchArea";
            parentClass = 'nbgen-has-search';
        } else if (_.isString(attrs.onAction)) {
            domLocation = "#nbgenActionArea";
            parentClass = 'nbgen-has-action';
        } else if (_.isString(attrs.onAccount)) {
            domLocation = '#nbgenAccountArea';
            parentClass = 'nbgen-has-account';
        } else if (_.isString(attrs.onFab)) {
            domLocation = '#nbgenFloatingButtonArea';
            parentClass = 'nbgen-has-floating-button';
        }

        jQueryObj = angular.element(domLocation);
        jQueryObj.empty(); // empty current content

        const placedContents = []; // use for later removing

        return function(scope, elem, attrs, ctrl, transclude) {
            jQueryObj.each(function() {
                transclude(function(clone) {
                    clone.css('width', '100%');
                    clone.addClass('tmv-put');
                    placedContents.push(clone);
                    let targetElement = angular.element(this);
                    $animate.enter(clone, targetElement);
                }.bind(this))
            });

            if (jQueryObj.parent().length === 1 && parentClass) jQueryObj.parent().addClass(parentClass);

            scope.$on("$destroy", function() {
                // empty contents of the target dom
                angular.forEach(placedContents, function(dom) {
                    $animate.leave(dom);
                });
                if (parentClass) jQueryObj.parent().removeClass(parentClass);
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
        if (c.length > 0) {
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
            if (c.length > 0) {
                if (angular.isDefined(attrs[`${directiveName}Before`])) {
                    c.first().before(labelElem)
                } else {
                    c.first().after(labelElem)
                }
            } else {
                element.append(labelElem);
            }
        } else if (angular.isUndefined(attrs.nbgenNoTooltip) && angular.isUndefined(attrs.noTooltip) && !(window.$$isMobile)) {
            // add a tool tip, unless viewing from a mobile; it's distracting in mobile
            if (!window.mobileAndTabletcheck()) {
                const tooltipElem = angular.element('<md-tooltip>')
                    .addClass('nbgen-tooltip')
                    .attr('md-autohide', 'true')
                    .attr('md-direction', attrs.tooltipDirection || 'bottom').text(nbgenLabel);
                element.prepend(tooltipElem);
            }
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

                attrs.$observe(directiveName, function(value) {
                    // parse the parameter
                    const param = value.split(';');

                    if (param.length > 0) {
                        const mdColorAttr = {};

                        const foreground = param[0].trim();
                        if (foreground.length > 0) {
                            mdColorAttr.color = _constructMdColorAttr(foreground);
                            /*
                            // readjust color if only primary or accent to ensure it's visible
                            // on the default background
                            let parts = mdColorAttr.color.split('-');
                            if (parts.length === 2 && (parts[1] !== 'background')) {
                                // append shade depending whether theme is dark or not
                                let  = $mdTheming.THEMES[parts[0]];
                                if (theme && theme.isDark) {
                                    mdColorAttr.color += '-100';    // do a lighter shade if
                                } else if (theme) {
                                    mdColorAttr.color += '-800';    // do d darker color
                                }
                            }
                            */
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

                        if (mdColorAttr.backgroundColor) {
                            mdColorAttr.backgroundColor = $mdColors.getThemeColor(mdColorAttr.backgroundColor);
                        }
                        if (mdColorAttr.color) {
                            mdColorAttr.color = $mdColors.getThemeColor(mdColorAttr.color);
                        }
                        if (mdColorAttr.borderColor) {
                            mdColorAttr.borderColor = $mdColors.getThemeColor(mdColorAttr.borderColor);
                        }

                        element.css(mdColorAttr);
                    }
                })
            }
        }
    }
}

utils.directive('nbgenColor', nbgenColorDirective)
utils.directive('tmvColor', nbgenColorDirective)

function nbgenTemplateDirective($compile, $parse, $q) {
    'ngInject';
    return {
        restrict: 'EA',
        compile: function() {
            const directiveName = this.name;
            return ($scope, $element, $attrs) => {
                const value = $attrs[directiveName] || $attrs.value;
                $q.when($parse(value)($scope)).then((templateStr) => {
                    if (templateStr) {
                        const templateDom = angular.element(templateStr);
                        $element.prepend(templateDom);
                        $compile(templateDom)($scope);
                    }
                })
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
utils.directive('nbgenMaxlength', nbgenMaxlengthDirective);


// only numberic allowed
function nbgenNumbersOnly($timeout) {
    'ngInject';
    const _ignoreCodes = [8, 9, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46];
    return {
        restrict: 'A',
        require: '^ngModel',
        compile: function() {
            return function($scope, $element, $attrs) {
                if ($element[0].nodeName === 'INPUT') {
                    // check if there are additional key codes ignored
                    let ignoreCodes = ($attrs.nbgenNumbersOnly || '').split(/\s+|,\s*/);
                    ignoreCodes = _.map(ignoreCodes, (v) => parseInt(v) || 0);
                    ignoreCodes = ignoreCodes.concat(_ignoreCodes);
                    $timeout(function() {
                        $element.keydown(function(ev) {
                            if (ignoreCodes.indexOf(ev.keyCode) >= 0) return; // disregard backspace and delete

                            // include keycode for numeric keypad
                            if ((ev.keyCode < 48 || ev.keyCode > 57) && (ev.keyCode < 96 || ev.keyCode > 105)) {
                                // it's non-numeric
                                ev.preventDefault();
                            }
                        })
                    })
                }
            }
        }
    }
}
utils.directive('nbgenNumbersOnly', nbgenNumbersOnly);


/**
 * For highlighting matched search
 */
utils.filter('highlight', function($mdColors, $sce) {
    'ngInject';

    function escapeRegexp(queryToEscape) {
        return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }

    return function(matchItem, query) {
        const accentColor = $mdColors.getThemeColor('accent');
        const accentColorStyle = `<span style="color: ${accentColor}" class="text-emphasis">$&</span>`;
        const result = query && matchItem ? matchItem.replace(new RegExp(escapeRegexp(query), 'gi'),
            accentColorStyle) : matchItem;

        return $sce.trustAsHtml(result);
    };
});

/**
 * Provides titleizing string
 */
utils.filter('titleize', function() {
    'ngInject';

    return function(matchItem) {
        return _s.titleize(_s.humanize(matchItem));
    }
})

// REQUIRES:
// moment.js - http://momentjs.com/

// USAGE:
// {{ someDate | moment: [any moment function] : [param1] : [param2] : [param n] 

// EXAMPLES:
// {{ someDate | moment: 'format': 'MMM DD, YYYY' }}
// {{ someDate | moment: 'fromNow' }}

// To call multiple moment functions, you can chain them.
// For example, this converts to UTC and then formats...
// {{ someDate | moment: 'utc' | moment: 'format': 'MMM DD, YYYY' }}

utils.filter('moment', function () {
    'ngInject'

    return function (input, momentFn /*, param1, param2, ...param n */) {
        let args = Array.prototype.slice.call(arguments, 2),
        momentObj = moment(input);
        return momentObj[momentFn].apply(momentObj, args);
    };
});

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

// nbgen directive for bind-html which compiles the resulting html
utils.directive('nbgenBindHtml', function($compile) {
    'ngInject';

    return {
        restrict: 'A',
        link: function($scope, $elm, $attrs) {
            $scope.$watch(function(scope) {
                return scope.$eval($attrs.nbgenBindHtml);
            }, function(value) {
                $elm.html(value); // make the content
                $compile($elm.contents())($scope);
            })
        }
    }
})

utils.directive('nbgenNoclick', function() {
    'ngInject';
    return {
        restrict: 'AC',
        link: function(scope, el) {
            el.on('click', function(e) {
                e.preventDefault();
            });
        }
    };
});

utils.directive('nbgenTheme', function($mdTheming) {
    'ngInject';
    return {
        restrict: 'AC',
        link: function(scope, el) {
            $mdTheming(el);
        }
    }
})

// for displaying hint
utils.component('nbgenHint', {
    template: `<div class="nbgen-hint">` +
        `<md-button aria-hidden="true" tabindex="-1" aria-label="hint" class="md-primary md-no-focus" ng-click="nbgenHint.displayHint()">` +
        `<md-tooltip md-visible="nbgenHint._tooltipVisible" class="nbgen-hint" direction="{{nbgenHint.direction}}"><span translate="{{nbgenHint.value}}"></span></md-tooltip>` +
        `<div class="hint-label">{{ nbgenHint.hintLabel | translate }}</div></md-button>` +
        `</div>`,
    controller: function() {
        'ngInject';

        this.$onInit = function() {
            if (!this.direction) {
                this.direction = "bottom";
            }

            if (!this.hintLabel) {
                this.hintLabel = "What's this?";
            }
        }

        this.displayHint = function() {
            if (!this._tooltipVisible) {
                this._tooltipVisible = true;
            }
        }
    },
    controllerAs: 'nbgenHint',
    bindings: {
        value: '@',
        hintLabel: '@',
    }
})
