import angular from 'angular';

const defaultParent = 'secureContent';

function setupNgState($stateProvider, options) {
    const stateConfig = { };        // state configuration parameter
    let { name, url, parent, rolesAllowed, i18npart, controller, resolve, template, controllerAs, viewName, views } = options.state;

    // initialize state configuration
    if (url) stateConfig.url = url;
    stateConfig.parent = parent || defaultParent;
    stateConfig.data = { };
    if (rolesAllowed) stateConfig.data.roles = rolesAllowed;

    // setup views
    if (views) {
        stateConfig.views = views;
    } else {
        if (!viewName) viewName = 'content@';
        const view = { };
        if (template) view.template = template;
        if (controller) view.controller = controller;
        if (controllerAs) view.controllerAs = controllerAs;
        stateConfig.views = {[viewName]: view};
    }

    // setup resolve
    resolve = resolve || { };
    if (i18npart) {
        // there's an i18 file that needs to be loaded
        if (angular.isString(i18npart)) {
            i18npart = [i18npart];
        }
        angular.extend(resolve, {
            translatePartialLoader: ['$translate', '$translatePartialLoader',
                function ($translate,$translatePartialLoader) {
                    i18npart.forEach((i) => {
                        $translatePartialLoader.addPart(i);
                    })
                    return $translate.refresh();
                }]
        })
    }
    stateConfig.resolve = resolve;

    $stateProvider.state(name, stateConfig);
}

export default setupNgState;
