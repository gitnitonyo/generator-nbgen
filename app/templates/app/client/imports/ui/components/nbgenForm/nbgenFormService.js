import angular from 'angular';

import formModel from './nbgenForm.js';
import { TmvBaseFormController } from './nbgenFormUtils.js';
import defaultFormTemplate from './nbgenFormService.html';
import defaultActionsTemplate from './nbgenFormServiceActions.html';

const formServiceName = '$tmvFormService';

export class FormServiceController extends TmvBaseFormController {
    constructor($injector, $scope, $options, $currentItem) {
        let newScope = $scope.$new()
        super($injector, newScope, $options, $currentItem);

        // remove template from dom tree if scope is destroyed
        newScope.$on('$destroy', () => {
            this.$element && this.$element.remove();
            this.$element = null;
        });

        this.$compile = $injector.get('$compile');
    }

    /**
     * Opens the form at the specified dom location. Returns a promise which
     * get resolves when closing the form
     */
    open(domLocation, template) {
        template = template || defaultFormTemplate;
        let domTemplate = angular.element(template);
        this.$compile(domTemplate)(this.$scope, (clone) => {
            this.$element = clone;      // reference to the element
            angular.element(`#${domLocation}`).append(clone);
        })
        this.$deferred = this.$q.defer();

        return this.$deferred.promise;
    }

    /**
     * destroys the form
     */
    _closeForm() {
        this.$element && this.$element.remove();
        this.$element = null;
    }

    /**
     * Close the form and resolve the promise to specified data
     */
    hide(data) {
        this._closeForm();
        this.$deferred.resolve(data);
    }

    /**
     * Close the form and reject the promise with the specified data
     */
    close(data) {
        this._closeForm();
        this.$deferred.reject(data);
    }

    // standard functions for OK and Cancel

    okFn() {
        if (this.$options.okFn) {
            // if provided function must close the dialog with provided $mdDialog
            this.$options.okFn.call(this, this.formModel, this)
        } else {
            this.hide(this.formModel);
        }
    }

    cancelFn() {
        if (this.$options.cancelFn) {
            // if provided function must close the dialog with provided $mdDialog
            this.$options.cancelFn.call(this, this);
        } else {
            this.close();
        }
    }

    /**
     * an alias to cancelFn
     */
    _doCancel() {
        // check the form if $dirty and prompt first before cancelling
        if (this.editForm && this.editForm.$dirty) {
            this.$tmvUiUtils.confirm('tx:global.common.loseChangesConfirmation')
                .then(() => {
                    this.cancelFn();
                });
        } else {
            this.cancelFn();
        }
    }

    titleDisplay() {
        return this.getFormTitle();
    }

    $onReady() {
        this.$timeout(() => this.editForm && this.editForm.$setPristine());

        // setup default actionsTemplate
        if (!this.actionsTemplate) {
            this.actionsTemplate = defaultActionsTemplate;
        }
    }

    /**
     * Alias to okFn
     * @return {[type]} [description]
     */
    saveDetails() {
        this.okFn();
    }
}

angular.module(formModel)
    .factory(formServiceName, function($injector, $rootScope) {
        'ngInject';

        return function($options, $scope, domLocation, template, $currentItem) {
            if (!$scope) {
                $scope = $rootScope;
            }
            let formControllerInstance = new FormServiceController($injector, $scope, $options, $currentItem);

            return formControllerInstance.open(domLocation, template);
        }
    })

