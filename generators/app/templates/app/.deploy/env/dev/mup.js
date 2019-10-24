
module.exports = {
    servers: {
        one: {
            host: '52.77.100.222',
            username: 'ubuntu',
            pem: 'env.pem'
        }
    },

    app: {
        name: 'nbgen-cms',
        path: '../../..',
        type: 'meteor',

        servers: {
            one: {}
        },
        buildOptions: {
            serverOnly: true,
            cleanAfterBuild: true,
            buildLocation: '/tmp',
            server: 'https://appdev.nubevtech.com/cms',
        },
        env: {
            ROOT_URL: 'https://appdev.nubevtech.com/cms',
            MAIL_URL: 'smtp://nubevisiontech%40gmail.com:NubeVision2017@smtp.gmail.com:587',

            // MONGO_URL: 'mongodb://localhost/meteor'
            // 54.169.171.87
            MONGO_URL: 'mongodb://nbgenCMS:nbgenCMS2019@172.31.3.49:27017/nbgenCMS',
            PORT: 5004,
        },

        docker: {
            image: 'abernix/meteord:node-8-base',
            // image: 'zodern/meteor:root',
        },
        deployCheckWaitTime: 240,
        enableUploadProgressBar: true
    }
};