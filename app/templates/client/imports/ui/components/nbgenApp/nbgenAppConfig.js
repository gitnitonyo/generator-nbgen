const config = {
    applicationLogo: "/assets/images/application-logo.png",
    applicationBg: "/assets/images/application-bg.jpg",
    appThemes: {
        default: {
            primary: {
                palette: "blue-grey",
                hues: {
                    "default": "800",
                    "hue-1": "700",
                    "hue-2": "600",
                    "hue-3": "500"
                }
            },
            accent: {
                palette: "deep-orange",
                hues: {
                    "default": "800",
                    "hue-1": "700",
                    "hue-2": "600",
                    "hue-3": "500"
                }
            }
        },
        dark: {
            primary: {
                palette: "grey",
                hues: {
                    "default": "50",
                    "hue-1": "100",
                    "hue-2": "200",
                    "hue-3": "A100"
                }
            },
            accent: {
                palette: "orange",
                hues: {
                    "default": "50",
                    "hue-1": "100",
                    "hue-2": "200",
                    "hue-3": "A100"
                }
            },
            dark: true
        },
        secondaryToolbar: {

        },
    }
}

export default config
