import angular from 'angular'

const moduleName = 'nbgenApp', name = 'nbgenContacthd'

import template from './nbgenContacthd.html'

class NbgenContacthdCtrl {
    constructor() {
        'ngInject';

        // TODO: retrieve from DB
        this.hdContact = {
            phone: '+63-000-000-0000',
            email: 'helpdesk@nubevtech.com'
        }
    }

}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: name,
        controller: NbgenContacthdCtrl,
        require: {
            nbgenApp: '^nbgenApp'
        }
    })
