#!/usr/bin/env node
var path = require('path'),
   fs = require('fs'),
   extend = require('util')._extend,
   exec = require('child_process').exec,
   processes = [];

var baseDir = path.resolve(__dirname, '..'),
   srcDir = path.resolve(baseDir, 'src'),
   testsDir = path.resolve(baseDir, 'tests'),
   chimpBin = path.resolve(baseDir, 'node_modules/.bin/chimp');

var RUNTESTS = process.env.TESTS || 1;

var appOptions = {
  settings: 'settings-local.json',
  port: 3002,
  env: {
    ROOT_URL: 'http://localhost:3002/',
    VELOCITY: RUNTESTS,
    JASMINE_CLIENT_UNIT: 1,
    JASMINE_SERVER_UNIT: 0,
    JASMINE_CLIENT_INTEGRATION: 1,
    JASMINE_SERVER_INTEGRATION: 1,
    JASMINE_BROWSER: 'PhantomJS', // npm install -g phantomjs
    //NODE_OPTIONS: '--debug',
    NEW_RELIC_NO_CONFIG_FILE: 1,
    NEW_RELIC_LICENSE_KEY: 'a5e7269b86e72876fa18df3e434d22bc24105593',
    NEW_RELIC_APP_NAME: 'PortalV2-LOCAL',
    NEW_RELIC_LOG_LEVEL: 'debug'
  }
};

var mirrorOptions = {
  settings: appOptions.settings,
  port: 3100,
  env: {
    IS_MIRROR: 1,
    MONGO_URL: 'mongodb://localhost:' + 3001 + '/chimp_db',
    ROOT_URL: 'http://localhost:3100/'
  },
  logFile: './chimp-mirror.log'
};

var chimpSwitches =
  ' --path=' + path.resolve(testsDir, 'features') +
  //' -r=' + path.resolve(testsDir, 'features/step_definitions/domain') +
  //' --criticalSteps=' + path.resolve(testsDir, 'features/step_definitions/critical') +
  //' --singleSnippetPerFile=1' +
  ''
  ;

if (process.env.CI || process.env.TRAVIS || process.env.CIRCLECI) {
  // when not in Watch mode, Chimp existing will exit Meteor too
  // we also don't need Velocity for the app chimp will run against
  appOptions.env.VELOCITY = 0;
} else {
  chimpSwitches += ' --watch';
}

if (process.env.SIMIAN_API && process.env.SIMIAN_REPOSITORY) {
  chimpSwitches += ' --simianRepositoryId=' + process.env.SIMIAN_REPOSITORY;
  chimpSwitches += ' --simianAccessToken=' + process.env.SIMIAN_API;
}

if (process.env.CUCUMBER_JSON_OUTPUT) {
  chimpSwitches += ' --jsonOutput=' + process.env.CUCUMBER_JSON_OUTPUT;
}

// set this flag to start with a mirror locally (ala Velocity xolvio:cucumber style)
if (RUNTESTS && parseInt(RUNTESTS)!==0) {
  console.log('RUNTESTS: ' + RUNTESTS);
  console.log('  disable tests with: $ TESTS=0 npm start');
  if (process.env.WITH_MIRROR) {
    chimpWithMirror();
  } else if (process.env.NO_METEOR) {
    startChimp('--ddp=' + appOptions.env.ROOT_URL + chimpSwitches);
  } else {
    chimpNoMirror();
  }
} else {
  console.log('NO TESTS');
  console.log('  enable tests with: $ npm start');
  startApp();
}

// *************************************************

function chimpWithMirror() {
  appOptions.waitForMessage = 'Started MongoDB';
  startApp(function () {
    startMirror(function () {
      console.log('=> Test App running at:', mirrorOptions.env.ROOT_URL);
      console.log('=> Log file: tail -f', path.resolve(mirrorOptions.logFile), '\n');
      startChimp('--ddp=' + mirrorOptions.env.ROOT_URL + chimpSwitches
      )
    });
  });
}

function chimpNoMirror() {
  appOptions.waitForMessage = 'App running at';
  startApp(function () {
    startChimp('--ddp=' + appOptions.env.ROOT_URL + chimpSwitches);
  });
}

function startApp(callback) {
  startProcess({
    name: 'Meteor App',
    command: 'meteor --settings ' + appOptions.settings + ' --port ' + appOptions.port,
    waitForMessage: appOptions.waitForMessage,
    options: {
      cwd: srcDir,
      env: extend(appOptions.env, process.env)
    }
  }, callback);
}

function startMirror(callback) {
  startProcess({
    name: 'Meteor Mirror',
    command: 'meteor --settings ' + mirrorOptions.settings + ' --port ' + mirrorOptions.port,
    silent: true,
    logFile: mirrorOptions.logFile,
    waitForMessage: 'App running at',
    options: {
      cwd: srcDir,
      env: extend(mirrorOptions.env, process.env)
    }
  }, callback);
}

function startChimp(command) {
  startProcess({
    name: 'Chimp',
    command: chimpBin + ' ' + command
  });
}

function startProcess(opts, callback) {
  var proc = exec(
     opts.command,
     opts.options
  );
  if (opts.waitForMessage) {
    proc.stdout.on('data', function waitForMessage(data) {
      if (data.toString().match(opts.waitForMessage)) {
        if (callback) {
          callback();
        }
      }
    });
  }
  if (!opts.silent) {
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  }
  if (opts.logFile) {
    var logStream = fs.createWriteStream(opts.logFile, {flags: 'a'});
    proc.stdout.pipe(logStream);
    proc.stderr.pipe(logStream);
  }
  proc.on('close', function (code) {
    console.log(opts.name, 'exited with code ' + code);
    for (var i = 0; i < processes.length; i += 1) {
      processes[i].kill();
    }
    process.exit(code);
  });
  processes.push(proc);
}
