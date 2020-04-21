/* globals Assets */
import { Meteor } from '../common';

import _ from 'underscore';
import _s from 'underscore.string';
import { sprintf } from 'sprintf-js';
import ngExpressions from 'angular-expressions';

import pdf from 'html-pdf';

import moment from 'moment';
import 'moment-timezone';

import { getApplicationInfo } from '../../common/applicationParameters/collection';

const defaultPrintOptions = {
    width: 8.5,
    height: 11,
}

const printDpi = 72;

const basePrintTemplatesPath = 'printTemplates';

Meteor.methods({
    'pdfPrint.generate': remoteGeneratePDF,
})

function remoteGeneratePDF(templateFile, context, options) {
    return generatePDFFromTemplate.call(this, templateFile, context, options);
}

export const generatePDFFromTemplate = Meteor.wrapAsync(_syncGenerate);

function _syncGenerate(templateFile, context, options, callback) {
    _generatePDFFromTemplate.call(this, templateFile, context, options, function(err, buffer) {
        callback(err, buffer);
    })
}

function ngEval(str, context) {
    return ngExpressions.compile(str)(context || this);
}

export function _generatePDFFromTemplate(templateFile, context, options, cb) {

    // include utilities into the context
    context.applicationInfo = getApplicationInfo();
    context.moment = moment;
    context._ = _;
    context._s = _s;
    context.sprintf = sprintf;
    context.$ng = ngEval.bind(context);

    if (this.userId) {
        context.user = Meteor.users.findOne({_id: this.userId});
    }

    // the style first
    let htmlText = '';

    // append the template
    htmlText += Assets.getText(`${basePrintTemplatesPath}/${templateFile}`);

    htmlText = _.template(htmlText)(context);

    return _generatePDF.call(this, htmlText, options, cb);
}

export function _generatePDF(htmlText, options, cb) {
    options = _.extend({ }, defaultPrintOptions, options || { });

    // setup html headers
    const baseUrl = Meteor.absoluteUrl();
    const baseTag = `<base href=${baseUrl}>`;
    options.viewportSize = options.viewportSize || { width: 612, height: 792 };
    if (_.isNumber(options.width)) {
        options.viewportSize.width = printDpi * options.width;
        options.width = `${options.width}in`;
    }
    if (_.isNumber(options.height)) {
        options.viewportSize.height = printDpi * options.height;
        options.height = `${options.height}in`;
    }
    const baseLineStyle = `<style>html {  }</style>`

    // const styleSections = '<style> html { zoom: 0.5; } html,body { font-size: 8pt; } </style>';
    const styleSections = Assets.getText(`${basePrintTemplatesPath}/printStyle.html`);
    const fontSection = '<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">';

    htmlText = `<html><head><meta charset="utf8">${baseTag}${fontSection}${baseLineStyle}${styleSections}</head><body>${htmlText}</body></html>`;
    pdf.create(htmlText, options).toBuffer(cb);
}
