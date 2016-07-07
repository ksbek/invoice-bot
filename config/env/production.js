'use strict';

module.exports = {
  secure: {
    ssl: true,
    privateKey: './config/sslcerts/key.pem',
    certificate: './config/sslcerts/cert.pem'
  },
  port: process.env.PORT || 8443,
  // Binding to 127.0.0.1 is safer in production.
  host: process.env.HOST || '0.0.0.0',
  db: {
    uri: process.env.MONGOHQ_URL,
    options: {
      user: 'genrich',
      pass: '!QAZ2wsx'
    },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  },
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: process.env.LOG_FORMAT || 'combined',
    options: {
      // Stream defaults to process.stdout
      // Uncomment/comment to toggle the logging to a log on the file system
      stream: {
        directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
        fileName: process.env.LOG_FILE || 'access.log',
        rotatingLogs: { // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
          active: process.env.LOG_ROTATING_ACTIVE === 'true', // activate to use rotating logs
          fileName: process.env.LOG_ROTATING_FILE || 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
          frequency: process.env.LOG_ROTATING_FREQUENCY || 'daily',
          verbose: process.env.LOG_ROTATING_VERBOSE === 'true'
        }
      }
    }
  },
  baseUrl: 'https://www.nowdue.ai',
  stripe: {
    apiKey: 'sk_live_4YXldnXlwst5j1FWza4Di37q',
    apiPubKey: 'pk_live_4YXlSIEysOA7ERb61H32Kl3C',
    clientID: 'ca_8VAoM49zUOuy94tRB9Op87Gqy8t137Ih',
    access_token: "sk_live_lPqnttFfvnLfpYjQdUCdzVZ5",
    refresh_token: "rt_8VIAF4yOb1EhKSvUQhc7SyRBvmftjEk1dYyHm9URLOgvMz0X",
    stripe_publishable_key: "pk_live_KMYP3Sjwv5mcL179p9QO6juk",
    stripe_user_id: "acct_14PQfYC61nQir0i8",
    application_fee: 0.01
  },
  sendgrid: {
    apiKey: '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',
    templates: {
      invoicePaid: '16f65b4c-b93f-44a0-aae9-6a3ddae3ced4',
      invoiceCreated: '4d01add6-571a-4772-801b-47dfaccb84e8'
    },
    from: 'jimmy@nowdue.ai'
  },
  slack: {
    clientID: process.env.SLACK_ID || '36622746837.37185968785',
    clientSecret: process.env.SLACK_SECRET || 'f0e2f39e649fa97106d53e695561bdc1',
    callbackURL: '/api/auth/slack/callback',
    scope: 'bot,incoming-webhook,chat:write:bot,chat:write:user,users:read,im:read,im:write'
  },
  apiai: {
    clientAccessToken: process.env.APIAI_ACCESS_TOKEN || '33f92d3d56ec46a18047faecf0e23555'
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID || 'APP_ID',
    clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/facebook/callback'
  },
  twitter: {
    clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
    clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
    callbackURL: '/api/auth/twitter/callback'
  },
  google: {
    clientID: process.env.GOOGLE_ID || 'APP_ID',
    clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/google/callback'
  },
  linkedin: {
    clientID: process.env.LINKEDIN_ID || 'APP_ID',
    clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/linkedin/callback'
  },
  github: {
    clientID: process.env.GITHUB_ID || 'APP_ID',
    clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/github/callback'
  },
  paypal: {
    clientID: process.env.PAYPAL_ID || 'CLIENT_ID',
    clientSecret: process.env.PAYPAL_SECRET || 'CLIENT_SECRET',
    callbackURL: '/api/auth/paypal/callback',
    sandbox: false
  },
  mailer: {
    from: process.env.MAILER_FROM || 'MAILER_FROM',
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
      auth: {
        user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
        pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
      }
    }
  },
  seedDB: {
    seed: process.env.MONGO_SEED === 'true',
    options: {
      logResults: process.env.MONGO_SEED_LOG_RESULTS !== 'false',
      seedUser: {
        username: process.env.MONGO_SEED_USER_USERNAME || 'user',
        provider: 'local',
        email: process.env.MONGO_SEED_USER_EMAIL || 'user@localhost.com',
        firstName: 'User',
        lastName: 'Local',
        displayName: 'User Local',
        roles: ['user']
      },
      seedAdmin: {
        username: process.env.MONGO_SEED_ADMIN_USERNAME || 'admin',
        provider: 'local',
        email: process.env.MONGO_SEED_ADMIN_EMAIL || 'admin@localhost.com',
        firstName: 'Admin',
        lastName: 'Local',
        displayName: 'Admin Local',
        roles: ['user', 'admin']
      }
    }
  }
};
