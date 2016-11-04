import { appRoles } from '/imports/common/app.roles.js';

const nbgenAppMenu = [
    {
        menuId: "_home",
        label: "global.menu.home",
        iconClass: "mdi-home mdi",
        rolesAllowed: "",
        action: "sref:home",
    },
    // nbgen: menu entry will be added above; don't delete
    {
        menuId: "_admin",
        label: "global.menu.admin",
        iconClass: "mdi-desktop-tower mdi",
        rolesAllowed: [ appRoles.SUPER_ADMIN ],
        submenu: [
            {
                menuId: "_users",
                label: "global.menu.users",
                iconClass: "mdi-account-multiple mdi",
                action: "sref:users",
            },
            {
                menuId: "_serviceConfigurations",
                label: "global.menu.serviceConfigurations",
                iconClass: "mdi-key-change mdi",
                action: "sref:serviceConfigurations",
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
            }
        ]
    },
]

export default nbgenAppMenu
