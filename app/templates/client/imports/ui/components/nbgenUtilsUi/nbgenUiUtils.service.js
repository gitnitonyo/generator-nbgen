import angular from 'angular'
import {Meteor} from 'meteor/meteor'

import nbgenUtilsUi from './nbgenUtilsUi.js'

angular.module(nbgenUtilsUi)
.factory('$tmvUiUtils', function($mdDialog, $translate, $rootScope, $mdMedia, $mdSidenav,
                                 $mdColorPalette, $tmvUtils, $mdColors, $sce, $timeout,
                                 $mdToast, $reactive, $q, $compile) {
    'ngInject'

    // construct the dom to be used for displaying dialog box
    const jqLoadingDivId = 'tmvLoadingMainWrapper',
        jqLoadingElemId = 'tmvLoadingDiv'
    const jqLoadingDiv = angular.element('<div>').addClass(jqLoadingDivId)
        .append(angular.element('<div>').addClass(jqLoadingElemId)
            .addClass('layout-column layout-align-center-center'))
    const jqLoadingElem = jqLoadingDiv.find('.' + jqLoadingElemId)
    jqLoadingDiv.attr('ng-hide', '$$waitModalDisabled === true')
    // jqLoadingDiv.css('background', 'rgba(0, 0, 0, 0.2)')
    jqLoadingElem.empty()   // remove the elements
    let progressElem = angular.element('<div>') // .addClass('md-whiteframe-2dp')
    jqLoadingElem.append(progressElem)
    let backgroundColor = $mdColors.getThemeColor('background')
    let matches = backgroundColor.match(/rgba\((\d+), (\d+), (\d+).+\)/)
    if (matches && matches.length === 4) {
        progressElem.css({
            // 'background': `rgba(${matches[1]}, ${matches[2]}, ${matches[3]}, 0.9)`,
            'background': 'transparent',
            'border-radius': '50%',
            'padding': '8px'
        })
    }
    progressElem.append(angular.element('<md-progress-circular>')
        .attr('md-mode', 'indeterminate')
        .attr('md-diameter', '80')
        .attr('ng-disabled', '$$waitModalDisabled')
        .addClass('md-accent'))
    jqLoadingElem.append(angular.element('<span>')
        .attr('ng-if', '$$waitModalMessage')
        .addClass('md-caption text-emphasis md-whiteframe-2dp')
        .attr('nbgen-color', 'primary')
        .attr('ng-bind-html', '$$waitModalMessage')
        .css({
            'padding': '8px 20px',
            'margin': '8px 0',
            'background': `rgba(${matches[1]}, ${matches[2]}, ${matches[3]}, 0.9)`,
            'border-radius': '8px',
        }))

    // append the loading div to the body of the document
    angular.element('body').append(jqLoadingDiv)
    const loadingDivScope = $rootScope.$new(true)
    $compile(jqLoadingDiv)(loadingDivScope)

    let $tmvUiUtils = {
        /**
         * Display a simple alert dialog
         * @param {string} type type of dialog ('alert', 'confirm', 'prompt')
         * @param {object} param
         * @description
         * if no type is passed, then $mdDialog.show is used passing the param
         * title: Display title
         * textContent: text to display
         * htmlContent: if with embedded html tag
         * ok: ok string
         * theme: theme can be specified
         * targetEvent: can be specified if coming from an event
         * cancel: applicable to type 'confirm'
         * placeholder: applicable to 'prompt'
         * initialValue: applicable to 'prompt'
         */
        dialog: function(param, type) {
            if (angular.isString(param)) {
                param = { textContent: param }
            } else if (!type || !/prompt|confirm|alert/.test(type)) {
                // no type is passed, use the $mdDialog.show function
                return $mdDialog.show(param);
            }

            if (param.textContent && param.textContent.indexOf('tx:') === 0) {
                param.textContent = $translate.instant(param.textContent.substr(3))
            }

            param.ok = param.ok || $translate.instant('global.common.ok');


            let dlg;
            if (type == 'confirm') {
                param.title = param.title || $translate.instant('global.common.confirm')
                dlg = $mdDialog.confirm();
            } else if (type == 'prompt') {
                dlg = $mdDialog.prompt();
            } else {
                dlg = $mdDialog.alert();
            }
            param.title = param.title || $translate.instant('global.common.message');

            if (param.title) dlg.title(param.title);
            if (param.textContent) dlg.htmlContent($sce.trustAsHtml(param.textContent));
            if (param.htmlContent) dlg.htmlContent($sce.trustAsHtml(param.htmlContent));
            if (param.ok) dlg.ok(param.ok);
            if (param.theme) dlg.theme(param.theme);
            if (param.targetEvent) dlg.targetEvent(param.targetEvent);
            if (type == 'confirm') {
                param.cancel = param.cancel || $translate.instant('global.common.cancel');
                if (param.cancel) dlg.cancel(param.cancel);
            }
            if (type == 'prompt') {
                if (param.placeholder) dlg.placeholder(param.placeholder);
                if (param.initialValue) dlg.initialValue(param.initialValue);
            }

            if (dlg._options) {
                dlg._options.onComplete = function(scope, element) {
                    // don't focus buttons
                    element.find('button').blur()
                }
            }
            // check if text content needs translation
            return $mdDialog.show(dlg);
        },

        /**
         * short-hand dialog with type 'alert'
         * @param param
         * @returns {*}
         */
        alert: function(param) {
            return this.dialog(param, 'alert');
        },
        /**
         * short-hand for dialog with type 'confirm'
         * @param param
         */
        confirm: function(param) {
            return this.dialog(param, 'confirm');
        },
        /**
         * short-hand for dialog with type 'prompt'
         * @param param
         */
        prompt: function(param) {
            return this.dialog(param, 'prompt');
        },

        // returns an error message string
        // based on error object
        errorMessage: function(errorObj) {
            let errorMessage, errorParams;
            if (angular.isObject(errorObj)) {
                if (angular.isNumber(errorObj.error)) {
                    errorParams = {
                        message: errorObj.message || '',
                        reason: errorObj.reason || ''
                    };
                    errorMessage = $translate.instant('responseErrors.' + errorObj.error, errorParams);
                } else if (errorObj.reason) {
                    errorMessage = errorObj.reason;
                } else if (errorObj.message) {
                    errorMessage = errorObj.message
                } else if (errorObj.status === -1) {
                    errorMessage = "Connection problem."
                } else {
                    errorMessage = errorObj.toString();
                }
            } else {
                errorMessage = errorObj.toString();
            }
            if (errorMessage.startsWith('tx:')) {
                errorMessage = $translate.instant(errorMessage.substr(3));
            }

            return errorMessage;
        },

        // displays an error message
        error: function(errorObj, title) {
            // console.log(errorObj)
            // style the error message
            let errorMessage = this.errorMessage(errorObj);

            const warnStyle = $mdColors.getThemeColor('warn')
            errorMessage = `<div style="color: ${warnStyle}">${errorMessage}</div>`

            // use $timeout to avoid the angular {{}} being displayed
            return $timeout(function(){
                this.hideWaitDialog()
                this.alert({
                    title: title || $translate.instant('global.common.error'),
                    htmlContent: errorMessage
                })
            }.bind(this));
        },

        showWaitDialog: function(message) {
            loadingDivScope.$$waitModalDisabled = false
            loadingDivScope.$$waitModalMessage = message
            jqLoadingDiv.show()
        },

        hideWaitDialog: function() {
            loadingDivScope.$$waitModalDisabled = true
            loadingDivScope.$$waitModalMessage = undefined
            jqLoadingDiv.hide()
        },


        closeSidenav: function(componentId) {
            return $mdSidenav(componentId).close();
        },

        toggleSidenav: function(componentId) {
            return $mdSidenav(componentId).toggle();
        },

        createStyle(styleClass, styles) {
            let style = document.createElement('style');
            style.type = 'text/css';
            let styleStr = styleClass + '{ ';
            angular.forEach(styles, function(value, key) {  // eslint-disable-line
                styleStr += value + ';';
            });
            styleStr += ' }';
            style.innerHTML = styleStr;

            document.getElementsByTagName('head')[0].appendChild(style);
        },

        openCenteredPopup: function(url, width, height, title) {
            let screenX = angular.isDefined(window.screenX) ?
                window.screenX : window.screenLeft;
            let screenY = angular.isDefined(window.screenY) ?
                window.screenY : window.screenTop;
            let outerWidth = angular.isDefined(window.outerWidth) ?
                window.outerWidth : document.body.clientWidth;
            let outerHeight = angular.isDefined(window.outerHeight) ?
                window.outerHeight : (document.body.clientHeight - 22);
            // XXX what is the 22?

            // Use `outerWidth - width` and `outerHeight - height` for help in
            // positioning the popup centered relative to the current window
            let left = screenX + (outerWidth - width) / 2;
            let top = screenY + (outerHeight - height) / 2;
            let features = ('width=' + width + ',height=' + height +
                ',left=' + left + ',top=' + top + ',scrollbars=yes');

            let newwindow = window.open(url, title, features);

            if (angular.isUndefined(newwindow)) {
                // blocked by a popup blocker maybe?
                let err = new Error(`The ${title} popup was blocked by the browser`);
                err.attemptedUrl = url;
                throw err;
            }

            if (newwindow.focus)
                newwindow.focus();

            return newwindow;
        },

        _hueKeys: [
            '50', '100', '200', '300', '400', '500', '600', '700', '800', '900',
            'A100', 'A200', 'A400', 'A700'
        ],

        /**
         * Pick random color from $mdColorPalette
         * @returns {*}
         */
        pickRandomColor: function(lightColors) {
            let lighFgHues = {
                'red': 4,
                'pink': 3,
                'purple':  3,
                'deep-purple': 3,
                'indigo': 3,
                'blue': 5,
                'light-blue': 6,
                'cyan': 7,
                'teal': 5,
                'green': 6,
                'light-green': 7,
                'lime': 9,
                'orange': 8,
                'deep-orange': 5,
                'brown': 3,
                'grey': 6,
                'blue-grey': 4
            };
            let color, hue, colorSet, colorKey, hueSet;
            if (lightColors) {
                colorSet = Object.keys(lighFgHues);
            } else {
                colorSet = Object.keys($mdColorPalette);
            }
            colorKey = colorSet[$tmvUtils.random(colorSet.length - 1)];
            color = $mdColorPalette[colorKey];
            if (lightColors) {
                hue = ($tmvUtils.random(9, lighFgHues[colorKey]) * 100).toString();
            } else {
                hueSet = Object.keys(color);
                hue = hueSet[$tmvUtils.random(hueSet.length - 1)];
            }
            color = color[hue];

            let fg = 'rgba(' + color.contrast[0] + ',' + color.contrast[1] + ',' +
                color.contrast[2] + ',' + (color.contrast[3] ? color.contrast[3] : '1') + ')';
            let bg = 'rgba(' + color.value[0] + ',' + color.value[1] + ',' +
                color.value[2] + ',' + (color.value[3] ? color.value[3] : '1') + ')';

            return {color: fg, backgroundColor: bg};
        },

        // display an error toast on the screen
        errorToast: function(errorObj) {
            let _this = this;
            let errorMessage = _this.errorMessage(errorObj);
            let dialogDom = angular.element('md-dialog-content');
            if (dialogDom.size() > 0) {
                // there's a dialog window; display the error message on the dialog
                let errorMessageDom = dialogDom.find('.tmv-error-container');
                let errorMessageText;
                if (errorMessageDom.size() === 0) {
                    // there's an existing error message; remove it first
                    errorMessageDom = angular.element(
                        '<div class="tmv-error-container">' +
                        '<div class="tmv-error-container-sub">' +
                        '<div class="tmv-error-message-text"></div>' +
                        '</div>' +
                        '</div>'
                    )
                    errorMessageText = errorMessageDom.find('.tmv-error-message-text');
                    $mdColors.applyThemeColors(errorMessageText, {
                        backgroundColor: 'red-600-0.8',
                        color: 'grey-50'
                    })
                    dialogDom.prepend(errorMessageDom);
                } else {
                    errorMessageText = errorMessageDom.find('.tmv-error-message-text');
                }
                errorMessageText.html(errorMessage).addClass('open');
                // remove after 5s
                $timeout(function() {
                    errorMessageText.removeClass('open');
                }, 5000)
            } else {
                $mdToast.show({
                    template: '<div layout-fill><md-content>{{msg}}</md-content></div>',
                    autoWrap: true,
                    position: 'top right',
                    controller: function() {
                        'ngInject'
                        this.msg = errorMessage
                    },
                    controllerAs: 'vm',
                    parent: angular.element('body')
                })
            }
        },

        // display's an alert about the connection
        meteorConnectionAdvice: function() {
            if (!Meteor.status().connected) {
                return this.alert($translate.instant('global.messages.notConnected'))
            }
            return $q.resolve()
        },

        // for convenient access
        // only use within the view to avoid javascript having dependecies with
        // ngMaterial
        $mdDialog: $mdDialog,
        $mdMedia: $mdMedia,
        $mdSidenav: $mdSidenav
    };

    window.$tmvUiUtils = $rootScope.$tmvUiUtils = $tmvUiUtils;   // for convenient access, so long app.js injected it
    $reactive($tmvUiUtils).attach($rootScope.$new());

    $tmvUiUtils.autorun(function() {
        let wait = $tmvUiUtils.getReactively('$wait');
        if (wait) {
            $tmvUiUtils.showWaitDialog();
        } else {
            $tmvUiUtils.hideWaitDialog();
        }
    })

    return $tmvUiUtils;
})
.factory('$tmvUtils', function($window, $timeout, $log) {
    'ngInject'

    let keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    let $tmvUtils = {
        /**
         * Returns a random number from `start` to `end`
         * @param end
         */
        random: function(end, start) {
            start = start || 0;
            return Math.floor(Math.random() * ((end-start)+1)) + start;
        },

        /**
         * @param func
         * @param wait
         * @param scope
         * @param invokeApply
         * @returns {debounced}
         */
        debounce: function(func, wait, scope, invokeApply) {
            let timer;

            return function debounced() {
                let context = scope,
                    args = Array.prototype.slice.call(arguments);

                $timeout.cancel(timer);
                timer = $timeout(function() {

                    timer = undefined;
                    func.apply(context, args);

                }, wait || 10, invokeApply);
            };
        },

        /**
         * @name convertObjectWithDates
         * @methodOf $tmvUtils
         * @param {object} obj the object which may contain string in date format
         * @description
         * Traverse the specified object, and inspect for possible date string,
         * if found, these are converted to Date objects
         */
        convertObjectWithDates: function(obj) {
            let _this = this;
            for (let prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    let propValue = obj[prop];
                    if ((typeof propValue) == 'string') {
                        let dateRx = /^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/;
                        if (dateRx.test(propValue)) {
                            obj[prop] = Date.fromISO(propValue); // convert to date
                        }
                    } else if ((typeof propValue) == 'object') {
                        _this.convertObjectWithDates(obj[prop]);
                    }
                }
            }
        },
        /**
         * @name storageGet
         * @param {string} key
         * @description
         * Retrieves values from browser's local storage using the specified key
         */
        storageGet: function(key) {
            return angular.fromJson($window.localStorage.getItem(key));
        },
        /**
         * @name storageSave
         * @param key
         * @param data
         * @description
         * Save the specified data to the browser's local storage using the specified key
         */
        storageSave: function(key, data) {
            $window.localStorage.setItem(key, angular.toJson(data));
        },
        /**
         * @name storageRemove
         * @param key
         * @description
         * Remove the specified storage item from browser's local storage
         */
        storageRemove: function(key) {
            $window.localStorage.removeItem(key);
        },
        /**
         * @name storageClear
         * @description
         * Clear browser's local storage
         */
        storageClear: function() {
            $window.localStorage.clear();
        },
        /**
         * @name base64Encode
         * @param input
         * @returns {string}
         */
        base64Encode: function(input) {
            if (angular.isFunction(window.btoa)) return window.btoa(input);

            let output = "";
            let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            let i = 0;

            input = this._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) + keyStr.charAt(enc4);

            }

            return output;
        },
        /**
         * @name base64Decode
         * @param input
         * @returns {string}
         */
        base64Decode: function(input) {
            if (angular.isFunction(window.atob)) return window.atob(input);

            let output = "";
            let chr1, chr2, chr3;
            let enc1, enc2, enc3, enc4;
            let i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = this._utf8_decode(output);

            return output;
        },
        // private method for UTF-8 encoding
        _utf8_encode : function (string) {
            string = string.replace(/\r\n/g,"\n");
            let utftext = "";

            for (let n = 0; n < string.length; n++) {

                let c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },
        // private method for UTF-8 decoding
        _utf8_decode : function (utftext) {
            let string = "";
            let i = 0;
            let c = 0, c2 = 0, c3 = 0;

            while ( i < utftext.length ) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i+1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i+1);
                    c3 = utftext.charCodeAt(i+2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        },
        getInitials: function(words, regex) {
            /* global _ */
            if (_.isEmpty(words)) return '';
            let result = '';
            // default regex to use to get initials
            regex = regex || /\b(\w+)\b/g
            let matches = words.match(regex)
            if (matches.length > 0) {
                result += matches[0].charAt(0)
                if (matches.length > 1) {
                    result += matches[matches.length-1].charAt(0)
                }
            }
            // split the value
            return result.toUpperCase();
        },
        // copies all attributes of sourceElem to targetElem
        copyElemAttrs: function($attrs, targetElem) {
            angular.forEach($attrs, function(value, key) {
                if (key.indexOf('$') !== 0) {
                    targetElem.attr($attrs.$attr[key], value)
                }
            })
        }
    };

    window.$tmvUtils = $tmvUtils;   // for convenient access, so long app.js injected it
    window.$log = $log

    return $tmvUtils;
})
