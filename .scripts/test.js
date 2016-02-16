#!/usr/bin/env node
var path = require('path'),
   extend = require('util')._extend,
   exec = require('child_process').exec,
   async = require('async'),
   _ = require('lodash'),
   processes = [];

var baseDir = path.resolve(__dirname, '..'),
   srcDir = path.resolve(baseDir, 'src'),
   testsDir = path.resolve(baseDir, 'tests'),
   karmaBin = path.resolve(baseDir, 'node_modules/.bin/karma'),
   velocityBin = path.resolve(baseDir, 'node_modules/.bin/velocity'),
   chimpScript = path.resolve(__dirname, 'start.js');

var appOptions = {
  settings: 'circle-settings.json',
  port: 3002,
  env: {
    ROOT_URL: 'http://localhost:3002/',
    VELOCITY: 1,
    JASMINE_CLIENT_UNIT: 1,
    JASMINE_SERVER_UNIT: 0,
    JASMINE_CLIENT_INTEGRATION: 1,
    JASMINE_SERVER_INTEGRATION: 1
  }
};


// do work
async.series(
  [
    runVelocity,
    runChimp,
  ],
  function(err) {
    if (err) throw err;
    console.log('Yay!');
  }
);

function runVelocity(callback) {
  startProcess({
    name: 'Velocity',
    command: velocityBin + ' test-app --ci' +
      ' --settings ' + appOptions.settings +
      ' --port ' + appOptions.port,
    options: {
      cwd: srcDir,
      env: extend(appOptions.env, process.env)
    }
  }, callback);
}

function runChimp(callback) {
  startProcess({
    name: 'Chimp',
    options: {
      env: extend({CI: 1}, process.env)
    },
    command: chimpScript
  }, callback);
}

function startProcess(opts, callback) {
  var proc = exec(
     opts.command,
     opts.options
  );
  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);
  proc.on('close', function (code) {
    if (code > 0) {
      console.log(opts.name, 'exited with code ' + code);
      process.exit(code);
    } else {
      callback();
    }
  });
}
