import _ from 'underscore';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { appRoles } from '/imports/common/app.roles.js';

import appInfo from '/package.json';

const collectionName = 'applicationParameters';
export const applicationInfoId = '__application_params__'

export const ApplicationParameters = new Mongo.Collection(collectionName);

export function getApplicationInfo() {
    return ApplicationParameters.findOne(applicationInfoId);
}

if (Meteor.isServer) {
    Meteor.startup(() => {
        if (ApplicationParameters.find({}).count() == 0) {
            ApplicationParameters.insert({
                _id: applicationInfoId,
                name: appInfo.name,
                version: appInfo.version
            })

        } else {
            ApplicationParameters.update({ _id: applicationInfoId }, { $set: { version: appInfo.version } });
        }

        // set default GST value
        const applicationInfo = ApplicationParameters.findOne(applicationInfoId);

        // Set Default Schedule Params
        if (!applicationInfo.emailSchedule) {
            ApplicationParameters.update({ _id: applicationInfoId }, {
                $set: {
                    emailSchedule: {
                        notifyNumberParam: 1, // send email notification x time before schedule
                        notifyTimeParam: 'hour',
                        checkScheduleParam: 10
                    }
                }
            });
        }

        // Set Default Timezone Params
        if (!applicationInfo.timeZone) {
            ApplicationParameters.update({ _id: applicationInfoId }, {
                $set: {
                    timeZone: 'Asia/Manila'
                }
            });
        }

        if (!applicationInfo.contacts) {
            ApplicationParameters.update({ _id: applicationInfoId }, {
                $set: {
                    contacts: {
                        helpdeskEmail: 'helpdesk@nubevtech.com',
                        landLine: '+60.3.1234-5678',
                        mobile: '+60.12.123-456',
                        adminEmail: 'tony.villadarez@gmail.com',
                    }
                }
            });
        }
    })

    Meteor.publish('$applicationParameters', function() {
        return ApplicationParameters.find({ _id: applicationInfoId });
    });

    const saveSettingsFn = function(appSettings) {
        if (!Roles.userIsInRole(this.userId, [appRoles.SUPER_ADMIN, appRoles.USER_ADMIN], Roles.GLOBAL_GROUP)) {
            throw new Meteor.Error(401, "Operation not permitted");
        }
        const excludedFields = [
            '_id',
            'name',
            'version',
        ]

        const setParam = {};
        _.each(appSettings, (v, k) => {
            if (excludedFields.indexOf(k) < 0) {
                setParam[k] = v;
            }
        });

        ApplicationParameters.update({ _id: applicationInfoId }, { $set: setParam });
    }

    Meteor.methods({
        'applicationParameters.saveSettings': saveSettingsFn
    });

}
