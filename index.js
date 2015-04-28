#!/usr/bin/env node
require('source-map-support').install();

require('dotenv').load({ silent: true });

var Server = require('./lib/src/server.js');

(new Server(process.env.HTTP_PORT, {
  github_secret_key: process.env.GITHUB_SECRET_KEY,
  pivotal_api_key  : process.env.PIVOTAL_API_KEY
}, {
  pivotal: {
    project_id    : process.env.PIVOTAL_PROJECT_ID,
    integration_id: process.env.PIVOTAL_INTEGRATION_ID
  }
}));
