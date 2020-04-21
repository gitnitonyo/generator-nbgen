import angular from 'angular'

import nbgenApp from '../..'

import template from './dbStatistics.html'

import config from './dbStatisticsConfig.js'

const name = 'dbStatistics'

class DbStatisticsCtrl {
    constructor($scope, $reactive, $tmvUiUtils) {
        'ngInject';

        $reactive(this).attach($scope)

        this.call('admin.dbStatistics', (err, result) => {
            if (err) {
                $tmvUiUtils.error(err)
            } else {
                this.dbStats = result
            }
        })

        this.$config = config
    }

    $onInit() {
        // all controllers have been initialized
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
    }

    $postLink() {
        // all elements have been linked
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    $doCheck() {

    }
}

angular.module(nbgenApp)
    .component(name, {
        template,
        controllerAs: name,
        controller: DbStatisticsCtrl,
        require: {
            nbgenApp: '^nbgenApp',
        }
    })
