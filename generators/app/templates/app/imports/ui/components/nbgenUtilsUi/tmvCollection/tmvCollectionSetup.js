/**
 * For setting up states for tmvCollection
 */
import angular from 'angular';
import _ from 'underscore';
import _s from 'underscore.string';
import moduleName from '../nbgenUtilsUi.js';
import { TmvCollectionFormBaseCtrl } from './tmvCollectionForm.js';
import { TmvCollectionListBaseCtrl } from './tmvCollectionList.js';
import formTemplate from './tmvCollectionForm.html';
import listTemplate from './tmvCollectionList.html';

const stateControllerAs = '$ctrl';
const formControllerAs = '$tmvCollection';
const listControllerAs = '$tmvCollection';
const formComponent = 'tmvCollectionForm';
const listComponent = 'tmvCollectionList';

const listBindings = {
    options: '<',
    subscription: '@',
    collection: '<',
    translatePrefix: '@',
}

const formBindings = {
    options: '<',
    subscription: '@',
    collection: '<',
    translatePrefix: '@',
    $currentItem: '<currentItem',
    currentItemId: '@',
    viewMode: '@',
}

class TmvCollectionStateCtrl {
    constructor($scope, $state, $stateParams, $options, $tmvUiUtils) {
        'ngInject';
        this.$state = $state;
        this.options = $options;
        this.$stateParams = $stateParams;
        this.currentItemId = $stateParams && $stateParams.doc;
        this.viewMode = $stateParams && $stateParams.viewMode;
        this.$tmvUiUtils = $tmvUiUtils;
        this.$scope = $scope;
    }

    showForm() {
        return /\.form$/.test(this.$state.current.name);
    }
}

class TmvCollectionFormStateCtrl extends TmvCollectionStateCtrl {
    $onInit() {
        super.$onInit && super.$onInit();

        if (this.viewMode !== 'del') {
            // ask user if there are changes in the form
            let unregister = this.$scope.$on('$stateChangeStart', (event, toState, toParams) => {
                let formCtrl = angular.element('tmv-collection-form').controller('tmvCollectionForm');
                if (formCtrl && formCtrl.editForm && formCtrl.editForm.$dirty) {
                    event.preventDefault();
                    this.$tmvUiUtils.confirm('tx:global.common.loseChangesConfirmation')
                        .then(() => {
                            unregister();       // so we don't have double prompting
                            this.$state.transitionTo(toState, toParams)
                        });
                }
            })
        }
    }
}

angular.module(moduleName)
    .component(listComponent, {
        template: listTemplate,
        controller: TmvCollectionListBaseCtrl,
        controllerAs: listControllerAs,
        bindings: listBindings,
        require: { nbgenApp: '^nbgenApp' },
    })
    .component(formComponent, {
        template: formTemplate,
        controller: TmvCollectionFormBaseCtrl,
        controllerAs: formControllerAs,
        bindings: formBindings,
        require: { nbgenApp: '^nbgenApp' },
    })

export function setupTmvCollection(stateName, moduleName, stateOptions, ctrlOptions) {
    let { name, url, parent, rolesAllowed, i18npart, data, resolve, formData, formResolve, listStateTemplate, formStateTemplate } = stateOptions;
    if (!name) {
        name = stateName;
    }
    if (!url) {
        url = `/${name}/`;
    }
    if (!parent) {
        parent = 'secureContent';
    }

    let listComponentDashed = _s.dasherize(listComponent);
    let className = _s.dasherize(stateName);

    // state data
    let stateData = { };
    if (rolesAllowed !== undefined) stateData.roles = rolesAllowed;
    stateData = _.extend(stateData, data);

    // view
    let stateTemplate = listStateTemplate || [
        `<md-content class="full-absolute tmv-list-section ${className}">`,
        `<${listComponentDashed} options="${stateControllerAs}.options"></${listComponentDashed}>`,
        `</md-content>`,
        `<div ui-view="tmvForm" class="tmv-form-section ${className} tmv-my-fade"></div>`,
    ].join('');

    let views = {
        'content@': {
            template: stateTemplate,
            controller: TmvCollectionStateCtrl,
            controllerAs: stateControllerAs,
        }
    };

    // resolve
    resolve = _.extend({
        $options: [() => Promise.resolve(ctrlOptions)],        // set up the options
    }, resolve);

    // i18n
    if (i18npart) {
        if (_.isString(i18npart)) {
            i18npart = [i18npart];
        }
        _.extend(resolve, {
            translatePartialLoader: ['$translate', '$translatePartialLoader',
                function ($translate,$translatePartialLoader) {
                    i18npart.forEach((i) => {
                        $translatePartialLoader.addPart(i);
                    })
                    return $translate.refresh();
                }]
        })
    }

    // build state configuration of collection list
    let stateConfig = {
        url, parent,
        data: stateData,
        views, resolve,
    };

    stateTemplate = formStateTemplate || `<tmv-collection-form options="${stateControllerAs}.options" view-mode="{{${stateControllerAs}.viewMode}}" current-item-id="{{${stateControllerAs}.currentItemId}}"></tmv-collection-form>`

    // main state
    let ngModule = angular.module(moduleName).config(function($stateProvider) {
        'ngInject';
        $stateProvider.state(name, stateConfig);
    });

    // construct the form state
    let formStateName = `${name}.form`;
    formResolve = _.extend({
        $options: [() => Promise.resolve(ctrlOptions)],        // set up the options
    }, formResolve);

    let formStateConfig = {
        parent: name,
        url: ':viewMode/:doc?:extra',
        data: formData || { },
        resolve: formResolve || { },
        views: {
            'tmvForm': {
                template: stateTemplate,
                controller: TmvCollectionFormStateCtrl,
                controllerAs: stateControllerAs,
            }
        }
    }

    ngModule.config(function($stateProvider) {
        'ngInject';
        $stateProvider.state(formStateName, formStateConfig)
    })
}
