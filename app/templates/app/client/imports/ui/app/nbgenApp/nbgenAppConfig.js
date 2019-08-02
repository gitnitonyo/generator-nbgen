import angular from 'angular';

const applicationBgs = [
    "./assets/images/application-bg.jpg",
];

const imagesToPreload = [
    './assets/images/application-logo.png',
    './assets/images/application-logo-square.png',
    './assets/images/no-preview-available.png',
    './assets/images/icon-user-default.png',
    // add additional images to preload here

    // mobile store badges
    './assets/images/google-play-badge.png',
    './assets/images/apple-store-badge.svg',
];

const config = {
    // change to the user readable application name
    applicationName: "nbGenAppBase",
    applicationLogo: imagesToPreload[0],
    applicationLogoSquare: imagesToPreload[1],
    applicationBgs: applicationBgs,
    imagesToPreload,
    colorTheme: {
        // change the default color theme used by application
        primary: "indigo",
        accent: "teal",
    },
    secondaryTheme: {
        // secondary color theme used
        primary: "indigo",
        accent: "amber",
    }
}

export default config

document.title = config.applicationName;
angular.element('#_appLoadingText').text(`${config.applicationName} is loading...`);
