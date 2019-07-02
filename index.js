#!/usr/bin/env node

global.CONTENT_ROOT = process.cwd();
global.TEMPLATE_ROOT = __dirname + '/package';
require('./lib/index.js');
