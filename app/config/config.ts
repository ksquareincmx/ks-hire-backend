require("dotenv").config();

import * as ip from "ip";
import * as path from "path";

export const config: any = {
  root: path.normalize(`${__dirname}/..`),

  env: process.env.NODE_ENV || "development",

  jwt: {
    secret: process.env.JWT_SECRET || "(your jwt secret)",
    access: {
      expiry: {
        unit: "hours",
        length: 8,
      },
      subject: "access",
      audience: "user",
    },
    refresh: {
      expiry: {
        unit: "hours",
        length: 8,
      },
      subject: "refresh",
      audience: "user",
    },
    reset: {
      expiry: {
        unit: "hours",
        length: 8,
      },
      subject: "reset",
      audience: "user",
    },
  },

  email: {
    from_address:
      process.env.EMAIL_FROM_ADDRESS || "MyApp <no-reply@example.com>",
    auth: {
      api_key: process.env.EMAIL_API_KEY || "(your sendgrid api key)",
      domain: process.env.EMAIL_DOMAIN || "(your sendgrid domain)",
    },
  },

  server: {
    port: process.env.SERVER_PORT || 8888,
  },

  api: {
    // Default limit and offset levels for responses
    limit: 99,
    offset: 0,
    // Show detailed error responses or not
    debug: true,
  },

  log: {
    // Console Log levels: error, warn, info, verbose, debug, silly
    level: process.env.LOG_LEVEL || "debug",
  },

  urls: {
    // Url config as seen from the user NOT NECESSARILY THE SAME AS SERVER
    // http or https
    protocol: process.env.URLS_PROTOCOL || "https",
    url: process.env.URLS_URL || ip.address(),
    port: process.env.URLS_PORT ? String(process.env.URLS_PORT) : "",
    apiRoot: process.env.URLS_API_ROOT || "/api/v1",
  },

  db: {
    database: process.env.DB_NAME || "ks_hire",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    port: process.env.DB_PORT || "3306",
    //storage: 'db.sqlite',
    timezone: "+0:00", // IMPORTANT For correct timezone management with DB, Tasks etc.
  },
};

let portString = "";
if (Number.isInteger(parseInt(config.urls.port)))
  portString = `:${config.urls.port}`;

config.urls.base = `${config.urls.protocol}://${config.urls.url}${portString}`;
config.urls.baseApi = `${config.urls.base}${config.urls.apiRoot}`;
