const app = require('../src/server');

// This file simply exports the unified Express application 
// so Vercel can run all our API endpoints in a single Serverless instance.
module.exports = app;
