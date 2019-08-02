/**
 * Entry point for nbgen components
 */
import angular from 'angular';
import _ from 'underscore';

import '../misc/scrollingElement.js';       // polyfill for document.scrollingElement
import '../misc/jquery.fixedheadertable.min.js';
import scrollParent from '../misc/scrollParent.js';
import detect from '../misc/detect.js';
import nbgenAuth from '../nbgenAuth';
import nbgenForm from '../nbgenForm';
import nbgenSocial from '../nbgenSocial';
import nbgenUtilsUi from '../nbgenUtilsUi';
import nbgenMeteor from '../nbgenMeteor';
import { Meteor, Accounts, Counts, Roles, Tracker, Mongo, TimeSync } from '../nbgenMeteor';
import { NbgenCollectionBaseCtrl, setupNbgenComponent } from '../nbgenUtilsUi/nbgenCollection';
import { TmvCollectionListBaseCtrl, TmvCollectionFormBaseCtrl, setupTmvCollection } from '../nbgenUtilsUi/tmvCollection';

const moduleName = 'nbgenComponents';

export default moduleName;

angular.module(moduleName, [
    nbgenAuth,
    nbgenForm,
    nbgenSocial,
    nbgenUtilsUi,
    nbgenMeteor,
]);

export { detect as nbgenDetect, nbgenAuth, nbgenForm, nbgenSocial, nbgenUtilsUi, nbgenMeteor };
export { Meteor, Accounts, Counts, Roles, Tracker, Mongo, TimeSync };
export { NbgenCollectionBaseCtrl, setupNbgenComponent, TmvCollectionListBaseCtrl, TmvCollectionFormBaseCtrl };
export { setupTmvCollection }


/**
 * Use as base class for controller of ng component
 */
export class NbgenBaseNgComponent {
    constructor(args) {
        if (_.isArray(this.constructor.$inject)) {
            _.each(this.constructor.$inject, (v, idx) => {
                this[v] = args[idx];
            });
        }
    }
}

export function getScrollingParent(element) {
    if (element.length !== undefined) {
        // it's probably a jquery; retrieve the document element
        element = element[0];
    }
    let result = scrollParent(element);

    return result;
}
