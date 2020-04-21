import angular from 'angular';
import nbgenUtilsUi from '../nbgenUtilsUi.js';

import { Meteor } from '../../nbgenMeteor';

import _ from 'underscore';

import defaultPrintStyleTemplate from './print-style.html';
import defaultDialogTemplate from './nbgen-print.html';

import moment from 'moment';

/* globals CKEDITOR */

angular.module(nbgenUtilsUi)
    .factory('$tmvPrint', function ($interpolate, $tmvUiData) {
        'ngInject';

        return tmvPrintFn;

        function tmvPrintFn(options) {
            // ckeditor must be loaded for this function to work
            const printStyleTemplate = options.printStyleTemplate || defaultPrintStyleTemplate;
            if (angular.isString(options.templates)) {
                options.templates = [options.templates];
            }
            let htmlTemplate = printStyleTemplate
            options.templates.forEach((t, i) => {
                if (i > 0) {
                    htmlTemplate += '<br/><div style="page-break-after: always;"></div>'
                }
                htmlTemplate += t;
            })
            const context = { }
            context[options.contextAs] = options.context;
            context.imageAssetsPath = Meteor.absoluteUrl('assets/images');
            context.moment = moment;

            // add the currentUser info to the context
            context.$currentUser = Meteor.user();

            let templateStr = _.template(htmlTemplate)(context);

            $tmvUiData.formDialog({
                resolve: {
                    // load ck editor
                    ckEditorOcLazyLoad: ['$ocLazyLoad', function($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            serie: true,
                            files: [
                                Meteor.absoluteUrl('assets/ckeditor/ckeditor/ckeditor.js'),
                                Meteor.absoluteUrl('assets/ckeditor/ckeditor/ng-ckeditor.min.js'),
                            ]
                        })
                    }]
                },
                cssClass: 'tmv-print',
                template: options.dialogTemplate || defaultDialogTemplate,
                title: options.title || 'global.common.print',
                okLabel: 'global.common.print',

                okFn: performPrint,
                functions: {
                    editorOptions: function() {
                        return {
                            contentsCss: [CKEDITOR.basePath + 'contents.css', CKEDITOR.basePath + 'templates.css'],
                            allowedContent: true,
                            readOnly: true,
                            extraPlugins: 'print',
                            removePlugins: 'toolbar,elementspath',
                            height: window.innerHeight - 200
                        }
                    },
                    $initController: function($scope) {  // eslint-disable-line
                        this.templateStr = templateStr;
                    }
                },
                /*
                actions: [
                    {
                        label: "Download",
                        fn: function() {
                            $tmvUiUtils.showWaitDialog('Generating PDF...');
                            const title = options.title.replace(/\./g, '_');
                            getPDF(templateStr, {printId: options.context._id, title: title})
                                .then((buffer) => {
                                    const pdfBuffer = buffer;
                                    let blob = _toBlob(pdfBuffer);
                                    let suffix = moment().format('YYYYMMDDhhmmss');
                                    saveAs(blob, `ctpl-${suffix}.pdf`);
                                }, (err) => $tmvUiUtils.error(err))
                                .finally($tmvUiUtils.hideWaitDialog);
                        }
                    }
                ]
                */
            })
        }

        function performPrint() {
            if (CKEDITOR && CKEDITOR.instances.nbCkPrint) {
                CKEDITOR.instances.nbCkPrint.execCommand('print');
            } else {
                console.error("CKEDITOR or print plugin is not found");
            }
        }
    });
