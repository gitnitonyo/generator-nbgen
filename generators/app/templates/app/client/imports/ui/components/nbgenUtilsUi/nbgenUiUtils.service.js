import angular from 'angular'
import { Meteor } from '../nbgenMeteor'
import jsondiffpatch from 'jsondiffpatch';

import nbgenUtilsUi from './nbgenUtilsUi.js';
import uiStyles from './nbgenUtilsStyles.html';

angular.module(nbgenUtilsUi)
    .factory('$tmvUiUtils', function($mdDialog, $translate, $rootScope, $mdMedia, $mdSidenav,
        $mdColorPalette, $tmvUtils, $mdColors, $sce, $timeout, $parse,
        $mdToast, $reactive, $q, $state, $nbgenWaitDialog) {
        'ngInject'

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
                    param.htmlContent = $translate.instant(param.textContent.substr(3))
                }
                if (!param.ok) {
                    param.ok = type === 'confirm' ? $translate.instant('global.common.yes') : $translate.instant('global.common.ok');
                }

                let dlg;
                if (type == 'confirm') {
                    param.title = param.title || $translate.instant('global.common.confirm')
                    dlg = $mdDialog.confirm();
                } else if (type == 'prompt') {
                    dlg = $mdDialog.prompt();
                } else {
                    dlg = $mdDialog.alert();
                }
                if (param.title && param.title.startsWith('tx:')) {
                    param.title = $translate.instant(param.title.substr(3));
                } else {
                    param.title = param.title || $translate.instant('global.common.message');
                }

                if (param.title) dlg.title(param.title);
                if (param.htmlContent) {
                    dlg.htmlContent($sce.trustAsHtml(param.htmlContent));
                } else if (param.textContent) {
                    dlg.htmlContent(param.textContent);
                }

                if (param.ok) {
                    dlg.ok(param.ok);
                }
                if (param.theme) dlg.theme(param.theme);
                if (param.targetEvent) dlg.targetEvent(param.targetEvent);
                if (type == 'confirm') {
                    param.cancel = param.cancel || $translate.instant('global.common.no');
                    if (param.cancel) dlg.cancel(param.cancel);
                }
                if (type == 'prompt') {
                    param.cancel = param.cancel || $translate.instant('global.common.cancel');
                    if (param.cancel) dlg.cancel(param.cancel);
                    if (param.placeholder) {
                        if (param.placeholder.startsWith('tx:')) {
                            param.placeholder = $translate.instant(param.placeholder.substr(3));
                        }
                        dlg.placeholder(param.placeholder);
                    }
                    if (param.initialValue) dlg.initialValue(param.initialValue);
                }

                if (dlg._options) {
                    dlg._options.onComplete = function(scope, element) {
                        // don't focus buttons
                        element.find('button').blur();
                    }.bind(this);
                }
                // check if text content needs translation
                return $q((_resolve, _reject) => {
                    // use timeout to avoid the appearance of untranslated string
                    $timeout(() => {
                        $mdDialog.show(dlg).then((data) => _resolve(data), (data) => _reject(data));
                    });
                });
            },

            /**
             * short-hand dialog with type 'alert'
             * @param param
             * @returns {*}
             */
            alert: function(param) {
                // put alert in a timeout, workaround for glitch on displaying uninterpolated string
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
                        let mesg = errorObj.reason || errorObj.message;
                        errorParams = {
                            message: mesg,
                        };

                        errorMessage = mesg || `responseErrors.${errorObj.error}`;
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
                    errorMessage = errorMessage.substr(3);
                }

                return $translate.instant(errorMessage, errorParams);
            },

            // displays an error message
            error: function(errorObj, title) {
                // console.log(errorObj)
                // style the error message
                let errorMessage = this.errorMessage(errorObj);

                const warnStyle = $mdColors.getThemeColor('warn')
                errorMessage = `<div style="color: ${warnStyle}">${errorMessage}</div>`

                this.hideWaitDialog();
                return this.alert({
                    title: title || $translate.instant('global.common.error'),
                    htmlContent: errorMessage
                });
            },

            showWaitDialog: function(message) {
                $nbgenWaitDialog.showDialog(message);
            },

            hideWaitDialog: function() {
                $timeout(() => $nbgenWaitDialog.hideDialog());
            },

            closeSidenav: function(componentId) {
                return $mdSidenav(componentId).close();
            },

            toggleSidenav: function(componentId) {
                return $mdSidenav(componentId).toggle();
            },

            _styleSection: angular.element('<style>').attr('id', 'tmv-style-section').attr('type', 'text/css'),

            createStyle(styleClass, styles) {
                let style = angular.element('#tmv-style-section');
                if (style.length === 0) {
                    style = this._styleSection;
                    angular.element('head').append(style);
                }

                let styleStr = styles;
                if (_.isArray(styles)) {
                    styleStr = styleClass + ' { ';
                    angular.forEach(styles, function(value, key) { // eslint-disable-line
                        styleStr += value + ';';
                    });
                    styleStr += ' }';
                }

                style.append(styleStr);
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
                    'purple': 3,
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

                return { color: fg, backgroundColor: bg };
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
                        template: '<div layout-fill><div class="window-scrollable">{{msg}}</div></div>',
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

            // returns a promise which resolve to an image object if image is successfully loaded
            /*
            loadImage: function(imgUrl) {
                let deferred = $q.defer();

                Upload.urlToBlob(imgUrl).then((blob) => {
                    let reader = new FileReader();
                    reader.onload = function(e) { deferred.resolve(e.target.result); };
                    reader.readAsDataURL(blob);
                }, () => {
                    deferred.reject(`${imgUrl} cannot be loaded.`);
                });

                return deferred.promise;
            },

            loadImages: function(imgArray) {
                const imgPromises = [ ];
                imgArray.forEach((imgUrl, idx) => {
                    imgPromises.push($q((_resolve, _reject) => {
                        this.loadImage(imgUrl).then((dataUrl) => {
                            // replace the content of the array with the data url for faster access to the resources
                            imgArray[idx] = dataUrl;
                            _resolve(dataUrl);
                        }, (err) => {
                            _reject(err);
                        })
                    }));
                })

                return $q.all(imgPromises);
            },
            */
            loadImage: function(imgUrl) {
                const image = new Image(),
                    deferred = $q.defer();

                image.onerror = function() {
                    deferred.reject(`${imgUrl} cannot be loaded.`)
                }
                image.onload = function() {
                    deferred.resolve(image);
                }
                image.src = imgUrl;

                return deferred.promise;
            },

            loadImages: function(imgArray) {
                const imgPromises = [];
                imgArray.forEach((imgUrl) => {
                    imgPromises.push(this.loadImage(imgUrl));
                })

                return $q.all(imgPromises);
            },

            gotoState: function(stateName, stateOperation) {
                const state = $state.get(stateName);
                if (!state) return;
                if (stateOperation) {
                    state.data = state.data || {};
                    state.data.stateOperation = stateOperation;
                }
                $state.go(state, undefined, { reload: true });
            },

            _cleanUpData: function(source, target, dontCleanId) {
                if (angular.isObject(source)) {
                    angular.forEach(source, (propertyValue, propertyName) => {
                        if (!angular.isString(propertyName) || !propertyName.startsWith('$')) {
                            if (angular.isObject(propertyValue)) {
                                target[propertyName] = angular.copy(propertyValue);
                                $tmvUiUtils._cleanUpData(propertyValue, target[propertyName]);
                            } else if (propertyName !== '_id' || dontCleanId === true) {
                                target[propertyName] = propertyValue;
                            }
                        }
                    })
                }
            },

            cleanUpData: function(obj, dontCleanId) {
                if (!angular.isObject(obj)) return;
                let result = {};
                $tmvUiUtils._cleanUpData(obj, result, dontCleanId);
                return result;
            },

            getRgbColor: function(color) {
                let transColor = $mdColors.getThemeColor(color)
                let matches = transColor.match(/rgba\((\d+), (\d+), (\d+).+\)/)
                if (matches && matches.length === 4) {
                    return matches.slice(1);
                }
            },

            rgbToStyle: function(rgbColor, transparency) {
                if (transparency === undefined) transparency = 1;
                if (rgbColor) {
                    return `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, ${transparency})`;
                }
            },

            getRgbLuminance: function(rgbColor) {
                return (parseInt(rgbColor[0]) * 0.299 + parseInt(rgbColor[1]) * 0.587 + parseInt(rgbColor[2]) * 0.114) / 256;
            },

            getStyleColor: function(color, transparency) {
                const rgbColor = this.getRgbColor(color);
                return this.rgbToStyle(rgbColor, transparency);
            },

            getPropertyValue(property, obj) {
                return $parse(property)(obj);
            },

            /**
             *  Returns an object containing dirty fields on the specified controller
             *  with their corresponding values
             */
            getDirtyFields(formCtrl, obj, forceIncludes = {}, forceExcludes = []) {
                let dirtyFields = {};
                _.each(formCtrl, (value, property) => {
                    if (value instanceof Object && value.hasOwnProperty('$modelValue')) {
                        // do not include ngModel which has $ as start
                        if (!property.startsWith('$') && property.indexOf('.$') < 0 &&
                            forceExcludes.indexOf(property) < 0 && value.$dirty === true) {
                            dirtyFields[property] = this.getPropertyValue(property, obj);
                        }
                    }
                });

                _.extend(dirtyFields, forceIncludes);
                return dirtyFields;
            },

            /**
             * Returns true if running on mobile devices
             */
            isMobile() {
                let userAgent = navigator.userAgent || navigator.vendor || window.opera;
                let result = 'unknown';

                // Windows Phone must come first because its UA also contains "Android"
                if (/windows phone/i.test(userAgent)) {
                    result = "Windows Phone";
                } else if (/android/i.test(userAgent)) {
                    result = "Android";
                } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                    // iOS detection from: http://stackoverflow.com/a/9039885/177710
                    result = "iOS";
                }

                return result !== 'unknown';
            },

            /**
             * Creates  a deep copy of the specified object
             */
            deepCopy(obj) {
                if (!_.isObject(obj)) return obj;
                return JSON.parse(JSON.stringify(obj), jsondiffpatch.dateReviver);
            },

            /**
             * Returns an object which contains changes from the objects
             */
            getObjectDiff(prevObj, newObj, prefix = '', result = { }) {
                _.each(newObj, (v, k) => {
                    if (!_.isString(k) || !k.startsWith('$')) {
                        if (_.isArray(v)) {
                            if (!_.isEqual(v, prevObj[k])) {
                                result[`${prefix}${k}`] = v;
                            }
                        } else if (_.isObject(v)) {
                            this.getObjectDiff(prevObj[k], v, `${prefix}${k}.`, result);
                        } else if (v !== prevObj[k]) {
                            result[`${prefix}${k}`] = v;
                        }
                    }
                })

                return result;
            },

            // TODO: use jsondiffpatch to construct the update instruction
            /**
             * For determining $set and $unset
             */
            determineObjSets(prevObj, newObj, prefix='', result = { }) {
                _.each(newObj, (v, k) => {
                    if ((!_.isString(k) || !k.startsWith('$')) && `${prefix}${k}` !== '_id') {
                        if (_.isObject(v) && (_.isObject(prevObj) && _.isObject(prevObj[k]))) {
                            if ((_.isArray(v) || v instanceof Date) && !_.isEqual(v, prevObj[k])) {
                                result[`${prefix}${k}`] = v;
                            } else if (!(v instanceof Date)) {
                                this.determineObjSets(prevObj[k], v, `${prefix}${k}.`, result);
                            }
                        } else if (!_.isObject(prevObj) || !prevObj.hasOwnProperty(k) || v !== prevObj[k]) {
                            result[`${prefix}${k}`] = v;
                        }
                    }
                });

                return result;
            },

            determineObjUnsets(prevObj, newObj, prefix='', result = { }) {
                _.each(prevObj, (v, k) => {
                    if ((!_.isString(k) || !k.startsWith('$')) && `${prefix}${k}` !== '_id') {
                        if (_.isObject(v) && (_.isObject(newObj) && _.isObject(newObj[k]))) {
                            this.determineObjUnsets(v, newObj[k], `${prefix}${k}.`, result);
                        } else if (!_.isObject(newObj) || !newObj.hasOwnProperty(k)) {
                            result[`${prefix}${k}`] = null;
                        }
                    }
                })

                return result;
            },

            escapeRegExp(s) {
                return s.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
            },

            // for convenient access
            // only use within the view to avoid javascript having dependecies with
            // ngMaterial
            $mdDialog: $mdDialog,
            $mdMedia: $mdMedia,
            $mdSidenav: $mdSidenav
        };

        window.$tmvUiUtils = $rootScope.$tmvUiUtils = $tmvUiUtils; // for convenient access, so long app.js injected it
        $reactive($tmvUiUtils).attach($rootScope.$new());

        $tmvUiUtils.autorun(function() {
            let wait = $tmvUiUtils.getReactively('$wait');
            if (wait) {
                $tmvUiUtils.showWaitDialog();
            } else {
                $tmvUiUtils.hideWaitDialog();
            }
        });

        angular.element('head').append($tmvUiUtils._styleSection);

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
                return Math.floor(Math.random() * ((end - start) + 1)) + start;
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
            _utf8_encode: function(string) {
                string = string.replace(/\r\n/g, "\n");
                let utftext = "";

                for (let n = 0; n < string.length; n++) {

                    let c = string.charCodeAt(n);

                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    } else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    } else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }

                }

                return utftext;
            },
            // private method for UTF-8 decoding
            _utf8_decode: function(utftext) {
                let string = "";
                let i = 0;
                let c = 0,
                    c2 = 0,
                    c3 = 0;

                while (i < utftext.length) {

                    c = utftext.charCodeAt(i);

                    if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                    } else if ((c > 191) && (c < 224)) {
                        c2 = utftext.charCodeAt(i + 1);
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    } else {
                        c2 = utftext.charCodeAt(i + 1);
                        c3 = utftext.charCodeAt(i + 2);
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
                        result += matches[matches.length - 1].charAt(0)
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
            },

            // clean up objects for saving to mongodb
            cleanupObjForMongo(obj) {
                if (!angular.isObject(obj)) {
                    return;
                }
                _.each(obj, (value, key) => {
                    if (angular.isString(key) && key.startsWith('$')) {
                        // remove this from object
                        delete obj[key];
                    }
                })
            },

            cleanupArrayForMongo(a) {
                if (!angular.isArray(a)) {
                    return;
                }
                a.forEach((obj) => {
                    $tmvUtils.cleanupObjForMongo(obj);
                })
            },
        };

        window.$tmvUtils = $tmvUtils; // for convenient access, so long app.js injected it
        window.$log = $log

        return $tmvUtils;
    })
    /**
     * A directive to pick random color to decorate the element
     */
    .directive('nbgenRandomColor', function($tmvUiUtils) {
        'ngInject';

        return {
            restrict: 'A',
            link: function(scope, el, attr) {
                let useLightColor = false;
                if (attr.nbgenRandomColor === true || attr.nbgenRandomColor === 'true') {
                    useLightColor = true;
                }
                const colorScheme = $tmvUiUtils.pickRandomColor(useLightColor);
                el.css(colorScheme);
            }
        }
    })
    /**
     * Presents a dialog for entering comments. Useful for approval and rejection routines
     */
    .factory('nbgenCommentsDialog', function($tmvUiData) {
        'ngInject'

        return _commentsDialog;

        function _commentsDialog(okLabel = 'global.common.approve', commentsFieldName = 'comments', commentsMandatory = true) {
            const fields = [{
                fieldName: commentsFieldName,
                fieldInputType: 'textarea',
                fieldRowSize: 3,
                fieldValidateRulesRequired: commentsMandatory,
            }]
            return $tmvUiData.formDialog({
                title: `tx:${okLabel}`,
                formSchema: $tmvUiData.wrapsFieldsToFormLayout(fields, 'global.common'),
                okLabel,
            })
        }
    })
    /**
     * Create styles for the colors
     */
    .run(($mdTheming, $mdColors, $interpolate, $tmvUiUtils) => {
        'ngInject';

        const colorSet = [
            'primary', 'primary-hue-1', 'primary-hue-2', 'primary-hue-3',
            'accent', 'accent-hue-1', 'accent-hue-2', 'accent-hue-3',
            'warn', 'warn-hue-1', 'warn-hue-2', 'warn-hue-3',
            'background', 'background-hue-1', 'background-hue-2', 'background-hue-3',
        ];
        const darkContrastColor = 'rgba(0, 0, 0, 0.87)',
            lightContrastColor = 'rgba(255, 255, 255, 1)';

        let getColorStyle = function(colorStr, theme) {
            theme = theme || 'default';
            let theTheme = $mdTheming.THEMES[theme];
            if (colorStr.startsWith('foreground-')) {
                // it's foreground color
                return theTheme.foregroundPalette[colorStr.substr(-1)]
            }
            if (/\-contrast$/.test(colorStr)) {
                colorStr = colorStr.replace(/\-contrast$/, '');
                let rgbColor = $tmvUiUtils.getRgbColor(colorStr);
                let colorLuminance = $tmvUiUtils.getRgbLuminance(rgbColor);
                return colorLuminance > 0.5 ? darkContrastColor : lightContrastColor;
            }
            return $mdColors.getThemeColor(colorStr);
        }

        let context = {
            c: getColorStyle
        }

        let styleStr = [];

        colorSet.forEach((colorItem) => {
            styleStr.push(`.tmv-${colorItem}-color { color: {{c('${colorItem}')}} !important; }`);
            styleStr.push(`.tmv-${colorItem}-color-bg { background-color: {{c('${colorItem}')}} !important; }`);
            styleStr.push(`.tmv-${colorItem}-color-scheme { color: {{c('${colorItem}-contrast')}} !important; background-color: {{c('${colorItem}')}} !important; }`);
        });

        const defaultTheme = $mdTheming.THEMES[$mdTheming.defaultTheme()];
        if (defaultTheme && defaultTheme.foregroundPalette) {
            // create style for foreground palette
            for (let i = 1; i <= 4; i++) {
                styleStr.push(`.tmv-foreground-${i}-color { color: {{c('foreground-${i}')}} !important; }`);
                styleStr.push(`.tmv-foreground-${i}-color-bg { background-color: {{c('foreground-${i}')}} !important; }`);
                styleStr.push(`.tmv-foreground-${i}-color-border { border-color: {{c('foreground-${i}')}} !important; }`);
            }

            // for enforcing color scheme on forms
            // '1' - main foreground color
            // '2' - label color
            // '3' - disabled color
            // '4' - border color
            styleStr.push(`.nbgen-color { color: {{c('foreground-1')}} !important; }`);
            styleStr.push(`.nbgen-label-color { color: {{c('foreground-2')}} !important; }`);
            styleStr.push(`.nbgen-disabled-color { color: {{c('foreground-3')}} !important; }`);
            styleStr.push(`.nbgen-border-color { border-color: {{c('foreground-4')}} !important; }`);

            styleStr.push(`.form-group-border { border-color: {{c('foreground-3')}} !important }`);
            styleStr.push(`.form-group-border-bottom { border-color: {{c('foreground-4')}} !important }`);
            styleStr.push(`.flat-group-border { border-color: {{c('foreground-4')}} !important }`);
            styleStr.push(`.field-label { color: {{c('foreground-2')}}; }`);
            // styleStr.push(`.tmv-field-container.md-input-has-value:not(.md-input-focused) > label { color: {{c('foreground-2')}}; }`);
            // styleStr.push(`.tmv-form-layout-container[readonly] md-input-container:not(.md-input-focused) > label { color: {{c('foreground-2')}}; }`);
            styleStr.push(`.tmv-form-layout-container md-input-container:not(.md-input-focused):not(.md-input-invalid) > label { color: {{c('foreground-2')}}; }`);
            styleStr.push(`label.hint { color: {{c('foreground-2')}}; }`);
            styleStr.push(`.tmv-static-container label.tmv-static-label { color: {{c('foreground-2')}}; }`);
            styleStr.push(`.tmv-static-container .tmv-static-content { border-bottom-color: {{c('foreground-4')}}; }`);
            styleStr.push(`.tmv-form-group md-select[disabled] .md-select-value:not(.md-select-placeholder) { color: {{c('foreground-1')}}; }`);
            styleStr.push(`.tmv-form-group md-select:not([disabled]) .md-select-value.md-select-placeholder { color: {{c('foreground-2')}}; }`);
            styleStr.push(`.tmv-field-container .hint { color: {{c('foreground-2')}}; }`);
            styleStr.push(`.tmv-form-group-label ~ .hint { color: {{c('foreground-2')}}; }`);
            styleStr.push(`md-input-container:not(.md-input-invalid).md-input-focused md-select:not([disabled]) .md-select-value { border-bottom-color: {{c('primary')}} !important; }`);

            // datapicker component
            styleStr.push(`chip-picker .hint { color: {{c('foreground-2')}}; }`);
            styleStr.push(`chip-picker .chip-picker-content .chip-picker-item { background-color: {{c('background-hue-3')}}; }`);

            // styleStr.push(`.nbgen-table-container { border-color: {{c('foreground-3')}} !important; }`);
            styleStr.push(`.nbgen-table-container .thead > .tr > .td { border-color: {{c('foreground-4')}} !important; }`);
            styleStr.push(`.nbgen-table-container .tbody > .tr > .td { border-color: {{c('foreground-4')}} !important; }`);

            styleStr.push(`.nbgen-table-container .tbody > .tr[ng-click]:not([disabled]):hover { background-color: {{c('background-hue-2')}}; }`);

            // upload color
            styleStr.push(`.nbgen-file-upload-dialog .file-upload-section .drop-box { background-color: {{c('background-hue-2')}}; }`);
            styleStr.push(`.nbgen-file-upload-dialog .file-upload-section .drop-box { border-color: {{c('foreground-4')}}; }`);

            // for card view support on forms
            // styleStr.push(`.tmv-card-view, .tmv-card-view md-content.nbgen-tmv-form { background-color: {{c('background-hue-3')}}; }`);
            // styleStr.push(`.tmv-card-view .form-group-border { background-color: {{c('background')}}; }`);
            // styleStr.push(`.tmv-card-view md-tabs-wrapper { background-color: {{c('background')}}; }`);

            // md-stepper color override
            // styleStr.push(`.md-stepper-indicator-wrapper { background-color: {{c('background')}} !important; }`);

            // restore disabled colors for easier readability
            styleStr.push(`.tmv-form-layout-container md-radio-group[disabled] { color: {{c('foreground-1')}}; }`);
            styleStr.push(`.tmv-form-layout-container md-radio-group[disabled] md-radio-button .md-on { background-color: {{c('foreground-2')}}; }`);
            styleStr.push(`.tmv-form-layout-container md-checkbox[disabled] .md-label { color: {{c('foreground-1')}}; }`);
            styleStr.push(`.tmv-form-layout-container md-input-container .md-input[disabled] { color: {{c('foreground-1')}}; }`);
            styleStr.push(`.tmv-form-layout-container md-input-container md-select[disabled] .md-select-value(:not(.md-select-placeholder)) { color: {{c('foreground-1')}}; }`);

            // color style for progress bars
            styleStr.push(`.nbgen-progress .loader { border: 6px solid {{c('accent')}}; border-top: 6px solid {{c('primary')}}; }`);
        }

        let generatedStyles = $interpolate(styleStr.join(''))(context).replace(/\s+/g, ' ');
        $tmvUiUtils._styleSection.append(generatedStyles);

        // append other styles
        generatedStyles = $interpolate(uiStyles)(context).replace(/\s+/g, ' ');
        angular.element('head').append(generatedStyles);
    })
    .config(function($provide) {
        'ngInject';

        $provide.decorator("$q", function($delegate) {
            'ngInject';

            //Helper method copied from q.js.
            let isPromiseLike = function(obj) { return obj && angular.isFunction(obj.then); }

            /*
             * @description Execute a collection of tasks serially.  A task is a function that returns a promise
             *
             * @param {Array.<Function>|Object.<Function>} tasks An array or hash of tasks.  A tasks is a function
             *   that returns a promise.  You can also provide a collection of objects with a success tasks, failure task, and/or notify function
             * @returns {Promise} Returns a single promise that will be resolved or rejected when the last task
             *   has been resolved or rejected.
             */
            function serial(tasks) {
                //Fake a "previous task" for our initial iteration
                let prevPromise;
                let error = new Error();
                angular.forEach(tasks, function(task, key) {
                    let success = task.success || task;
                    let fail = task.fail;
                    let notify = task.notify;
                    let nextPromise;

                    //First task
                    if (!prevPromise) {
                        nextPromise = success();
                        if (!isPromiseLike(nextPromise)) {
                            error.message = "Task " + key + " did not return a promise.";
                            throw error;
                        }
                    } else {
                        //Wait until the previous promise has resolved or rejected to execute the next task
                        nextPromise = prevPromise.then(
                            /*success*/
                            function(data) {
                                if (!success) { return data; }
                                let ret = success(data);
                                if (!isPromiseLike(ret)) {
                                    error.message = "Task " + key + " did not return a promise.";
                                    throw error;
                                }
                                return ret;
                            },
                            /*failure*/
                            function(reason) {
                                if (!fail) { return $delegate.reject(reason); }
                                let ret = fail(reason);
                                if (!isPromiseLike(ret)) {
                                    error.message = "Fail for task " + key + " did not return a promise.";
                                    throw error;
                                }
                                return ret;
                            },
                            notify);
                    }
                    prevPromise = nextPromise;
                });

                return prevPromise || $delegate.when();
            }

            $delegate.serial = serial;
            return $delegate;
        });
    })
    .animation('.tmv-fold-animation', function($animateCss) {
        'ngInject';
        return {
            enter: function(element, doneFn) {      // eslint-disable-line
                let height = element.height();
                return $animateCss(element, {
                    from: { height: '0px', 'overflow': 'hidden', opacity: '0' },
                    to: { height: height + 'px', 'overflow': 'hidden', opacity: '1' },
                    event: 'enter',
                    structural: true,
                    cleanupStyles: true,
                    duration: 0.2,
                })
            },
            /*
            leave: function(element, doneFn) {      // eslint-disable-line
                let height = element.height();
                return $animateCss(element, {
                    from: { height: height + 'px', 'overflow': 'hidden' },
                    to: { height: '0px', 'overflow': 'hidden' },
                    event: 'leave',
                    structural: true,
                    cleanupStyles: true,
                    duration: 0.2,
                })
            }
            */
        }
    })
    ;

window.mobileAndTabletcheck = function() {
    let check = false;
    (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};
