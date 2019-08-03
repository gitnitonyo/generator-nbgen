#### Still under construction...
# Introduction
This is a yeoman generator for generating code baseline for developing full stack web application. It is composed of opinionated use of [AngularJS][angularjs] as front-end framework and [Meteor][meteor] as the backend.

On the front-end the following frameworks/libraries are used:
* [AngularJS][angularjs] - main framework used
* [AngularJS Material Design](material.angularjs.org) - For defining look and feel
* [Angular UI-Router](https://ui-router.github.io/ng1/) - For client-side routing
* [Angular Translate](https://angular-translate.github.io/) - For implementing internalization & localization
* [Angular Meteor](https://angular-meteor.com/) - For handling meteor inside AngularJS framework

On the back-end the following frameworks/libraries are used:
* [Meteor][meteor] - main backend application server and framework used including the following modules:
    * Publish / Subscribe
    * Methods - implementing remote APIs
    * Collections - encapsulate MongoDB operations
    * Accounts / Roles - for handling user identity and roles management to enforce application access control
    * Email - for sending email
* [HTML PDF](https://github.com/marcbachmann/node-html-pdf) - for generating reports in pdf
* [later](https://bunkat.github.io/later/) - for handling task scheduling

Other components used both on front-end and backend:
* [momentjs](https://momentjs.com/) - handling dates
* [underscore](https://underscorejs.org/) - extend javascript with numerous useful functions.
* [underscore.string](https://github.com/epeli/underscore.string) - string handling and manipulations

# Getting Started

## Installation

1. Install [Meteor](https://www.meteor.com/install).
2. Install [Node.js](nodejs.org). V8 is the preferred version. You may also opt not to install Node.js and use the version that comes with Meteor. To run node that comes with Meteor just prepend the command with `meteor` (e.g. `meteor npm install`).
3. Install Yeoman CLI  
```sh
npm install -g yo
```
4. Install nbgen generator.

```sh
npm install -g generator-nbgen
```
## Usage

### Creating a Baseline Code

- Create a project folder, and from the project folder run the following to generate the code baseline.

- ```sh
  yo nbgen
  ```

  You will be prompted with application name. Enter your desired application name. The tool will then start scaffolding the code baseline.

- To run the application

- ```sh
  npm start
  ```

### Customising Basic UI Components

#### Change Color Theme
* To change the color theme used by the app, edit `client/imports/ui/app/nbgenApp/nbgenAppConfig.js` and modify the default color theme. Optionally, add a secondary theme. For color theme reference, please visit [Material Design's color palette reference](https://material.io/archive/guidelines/style/color.html#color-color-palette).
```javascript
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
```
#### Images
* `public/assets/images/application-bg.jpg` - application background.
* `public/assets/images/application-logo.png` - used in the toolbar header
* `public/assets/images/application-logo-square.png` - used in sidenav navigation

You may also want to change the favicons located in `public/assets/icons` folder.

### Built-in Routes

There are client-side routes that came with the generated baseline codes. You may customize these according to your application needs.

* **nbgenMain** - The home screen located in `client/imports/ui/app/nbgenApp/nbgenMain/` directory.
* **nbgenLogin** - Contains the login facility. Located in `client/imports/ui/app/nbgenApp/nbgenLogin/` directory.
* **nbgenRegister** - Contains the self-registration facility. Located in `client/imports/ui/app/nbgenApp/nbgenRegister/` directory.

## Sub-Generators

### Mongo DB Collection Maintenance

To generate set of codes for maintaining a MongoDB collection, complete with front-end and back-end codes:

```sh
yo nbgen:collection collectionName
```

You must provide the name of the mongo collection to create (e.g. `yo nbgen:collection Customers`)

Generated codes:

- Front end mainly located in `client/imports/ui/app/collectionName` folder
  - `collection.js` - declaration of minimongo collection which can be imported to access from other parts of the code.
  - `_collection.scss` - may be modified to change css styles of the component
  - `actionToolbarListView.html` - to include other UI components on the top toolbar shown when viewing the collection list
  - `actionToolbarFormView.html` - to include other UI components on the top toolbar shown when viewing or editing a specific document from the collection.
  - `config.js` - this is where you mostly put codes to customize the behaviour of the component. There are several options you can put in here to modify or override the default operations of the collection maintenance which will be explained on a separate section below.
  - `setup.js` - this is where the component and its options are setup. For instance if you want to limit the access to of the client-side route to a set of roles, you will modify the alloweRoles variable declared in this file.
  - `i18n.hjson` - this is located in client/imports/i18n/en
  - An entry into the menu will be injected into `client/imports/ui/app/nbgenApp/nbgenAppMenu.js`
- Back end mainly located in `server/imports/api/collectionName` folder
  - `index.js` - declaration of mongo collection
  - `fixture.js` - where you put initialization routines
  - `publish.js` - control the publication of the collection to the client including filtering of exposed information based on user's group or role
  - `permissions.js` - provides mechanism to control who can perform *create*, *update* and *delete* operations.
  - `methods.js` - where to declare and define remote API methods, specific to the application requirements.

### Angular Component

To generate code templates for creating an angular component

```sh
yo nbgen:ngcomponent componentName
```

Generated codes will be located in client/imports/ui/app/componentName.

- `_component.scss` - may contain styles specific to the component
- `component.html` - the UI template used by the component
- `config.js` - any pertinent data which may be used by the component
- `ctrl.js` - the actual implenentation of the component

*documentation on other sub-generators to follow*.

## UI Components

### Security and Identity Service

*documentation to be provided later*

### Collection Maintenance Component

*documentation to be provided later*

### Form Components

*documentation to be provided later*

### i18n Provisioning

*documentation to be provided later*

### UI Helper Services

*documentation to be provided later*

## Server Components

### Collection Initialization

*documentation to be provided later*

### Publish Control

*documentation to be provided later*

### Permission Handling

*documentation to be provided later*

### Provisioning APIs

*documentation to be provided later*


[angularjs]: https://angular.js.org
[meteor]: https://www.meteor.com

