import { appRoles } from '../../../common/app.roles';

const nbgenAppMenu = [
    {
        menuId: "_home",
        label: "global.menu.home",
        iconClass: "mdi-home mdi",
        rolesAllowed: "",
        action: "sref:home",
    },
    {
        menuId: "__divider__",
        showIf: "nbgenApp.isAdmin()",
    },
    {
        menuId: "_admin",
        label: "global.menu.admin",
        iconClass: "mdi-desktop-tower mdi",
        rolesAllowed: [ appRoles.SUPER_ADMIN, appRoles.USER_ADMIN ],
        submenu: [
            {
                menuId: "_users",
                label: "global.menu.users",
                iconClass: "mdi-account-multiple mdi",
                action: "sref:appUsers",
            },
            /*:nbgen:social:service-configurations*/
            /* PLEASE DO NOT REMOVE THIS MARKER */
            {
                menuId: '_appSettings',
                label: 'global.menu.appSettings',
                iconClass: 'mdi-settings mdi',
                action: 'sref:appSettings',
                rolesAllowed: [appRoles.SUPER_ADMIN],
            },
            {
                menuId: "_announcements",
                label: "global.menu.announcements",
                iconClass: "mdi-bell mdi",
                action: "sref:announcements",
            },
            {
                menuId: "_appDbStats",
                label: "global.menu.appDbStats",
                iconClass: "mdi-database mdi",
                action: "sref:dbStatistics",
                rolesAllowed: [appRoles.SUPER_ADMIN]
            }
        ]
    },
    {
        menuId: "__divider__",
        rolesAllowed: [appRoles.NORMAL_USER],
    },
    // nbgen: menu entry will be added above; don't delete
    // {
    //     menuId: "__divider__"
    // },
    // {
    //     menuId: '_support',
    //     label: 'global.menu.support',
    //     iconClass: 'mdi-help mdi',
    //     rolesAllowed: "",
    //     submenu: [
    //         {
    //             menuId: '_supportedBrowsers',
    //             iconClass: "mdi-web mdi",
    //             label: 'global.menu.supportedBrowsers',
    //             showIf: "!nbgenApp.$isCordova",
    //             action: 'sref:supportedBrowsers',
    //         },
    //         {
    //             menuId: '_termsOfUse',
    //             label: 'global.menu.termsOfUse',
    //             iconClass: 'mdi-file-check mdi',
    //             rolesAllowed: "",  // specify roles which can access this
    //             action: 'sref:termsOfUse',
    //         },
    //         {
    //             menuId: '_privacy',
    //             label: 'global.menu.privacy',
    //             iconClass: 'mdi-account-key mdi',
    //             rolesAllowed: "",  // specify roles which can access this
    //             action: 'sref:privacy',
    //         },
    //         {
    //             menuId: '_aboutUs',
    //             label: 'global.menu.aboutUs',
    //             iconClass: 'mdi-comment-question-outline mdi',
    //             rolesAllowed: "",  // specify roles which can access this
    //             action: 'sref:aboutUs',
    //         },
    //     ]
    // },
    // {
    //     menuId: '_contactUs',
    //     label: 'global.menu.contactUs',
    //     iconClass: 'mdi-deskphone mdi',
    //     rolesAllowed: "",  // specify roles which can access this
    //     action: 'sref:contactUs',
    // },
]

export default nbgenAppMenu
