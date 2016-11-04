import {Meteor} from 'meteor/meteor'
import {Roles} from 'meteor/alanning:roles'
import {appRoles} from '/imports/common/app.roles.js'

/* globals Npm */
const Future = Npm.require('fibers/future')

Meteor.methods({
    'admin.dbStatistics': dbStatistics
})

function dbStatistics() {
    if (!Roles.userIsInRole(this.userId, appRoles.SUPER_ADMIN)) {
        throw new Meteor.Error(401, "Access is denied")
    }

    const rawDb = Meteor.users.rawDatabase() // retrieve the raw database of mongodb
    const future = new Future()
    rawDb.stats((err, result) => {
        if (err) {
            future.throw(err)
        } else {
            future.return(result)
        }
    })

    return future.wait()
}
