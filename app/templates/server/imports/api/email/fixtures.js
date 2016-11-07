import {Meteor} from 'meteor/meteor'
import {Accounts} from 'meteor/accounts-base'

Meteor.startup(() => {
    if (!process.env.MAIL_URL) {
        // setup default email service
        const smtp = {
            username: "xxxxxxxxxxx@gmail.com",  // replace with your own email
            password: "xxxxxxxxxxxx",       // replace with your own password
            server: "smtp.gmail.com",       // replace with proper smtp server
            port: 465
        }

        process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':'
            + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
    }
})

// customize email templates
Accounts.emailTemplates.from = 'NubeVision Tech <tony.villadarez@gmail.com>';
Accounts.emailTemplates.siteName = 'nubeVision';
