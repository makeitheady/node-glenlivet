/**
 * This file is used to autoload all of the other files in this directory.  When
 * this directory is required each files exports will be accessible by the files name
 * as a key.
 */

var files = {};

require('fs').readdirSync(__dirname + '/').forEach(function (file) {
  files[file.split('.')[0]] = require('./' + file);
});

module.exports = files;
