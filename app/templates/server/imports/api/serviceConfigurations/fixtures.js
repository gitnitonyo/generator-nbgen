/**
 * Contains data initialization routines for ServiceConfigurations collection
 */
import {Meteor} from 'meteor/meteor'
import {ServiceConfigurations} from '../../../../imports/common/serviceConfigurations/collection.js'

const initialServiceConfigurations = [{
    service: 'facebook',
    $set: {
        appId: '909700192506312',
        secret: '59e0672b484d1293b278b70c689854b4'
    }
}, {
    service: 'google',
    $set: {
        clientId: '209870574119-udp9f9v9910aseec55hoe37kb9ica18m.apps.googleusercontent.com',
        secret: 'f80OOeURjTKBaGktW2IdZka1'
    }
}, {
    service: 'twitter',
    $set: {
        consumerKey: '5w4ONAwc9XPNA3JhNzDXNnNjA',
        secret: 'SbkzxWWCtXdXBk4slDzCudCLjOHxQj0nX9uaBDtkMCnjTHClqx'
    }
}]


Meteor.startup(() => {
    // initialize service configuration if not initialize yet
    initialServiceConfigurations.forEach((serviceConfig) => {
        if (ServiceConfigurations.find({service: serviceConfig.service}).count() === 0) {
            // no record yet
            ServiceConfigurations.upsert(
                {service: serviceConfig.service},
                { $set: serviceConfig.$set }
            )
        }
    })
})

// nbgen: protection marker start
// nbgen: protection marker end
