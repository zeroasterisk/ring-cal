#!/usr/bin/env node
var path = require('path'),
   fs = require('fs'),
   extend = require('util')._extend,
   exec = require('child_process').exec,
   async = require('async'),
   _ = require('lodash'),
   processes = [];

var baseDir = path.resolve(__dirname, '..'),
   srcDir = path.resolve(baseDir, 'src'),
   packagesDir = path.resolve(baseDir, 'eltoro-packages');


// do work
async.series(
  [
    verifyStructure
  ],
  function(err) {
    if (err) throw err;
    console.log('setup complete');
  }
);

// *************************************************

// Verify directory structure
function verifyStructure(callback) {
  var asyncFuncs = [];
  _.each(
    [
      baseDir,
      srcDir,
      path.resolve(srcDir, 'packages'),
      path.resolve(srcDir, 'server'),
      path.resolve(srcDir, 'client'),
      path.resolve(srcDir, 'public'),
      path.resolve(srcDir, 'tests')
    ],
    function(dir) {
      asyncFuncs.push(function(cb) {
        fs.exists(dir, function(exists) {
          if (!exists) return cb(new Error('Unable to find directory: ' + dir));
          cb(null, dir);
        });
      });
    }
  );
  async.parallel(asyncFuncs, function(err) {
    if (err) throw err;
    callback(null, 'good');
  });
}

