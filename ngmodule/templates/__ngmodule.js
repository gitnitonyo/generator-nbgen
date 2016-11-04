import angular from 'angular'

const moduleName = '<%= moduleName %>'

export default moduleName

angular.module(moduleName, [
    // specify module dependencies here

    ])
    .run(function() {
        'ngInject';
        // inject needed services above

        // place module initialization here
    })
    .config(function() {
        'ngInject';
        // inject needed services above

        // place module configuration here
    })
