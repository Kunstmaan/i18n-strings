var _ = require('lodash'),
    fs = require('fs'),
    path = require('path');

var locateStringFiles;

var cachedStringFiles;

module.exports = function(file, done) {
    if (cachedStringFiles) {
        done(cachedStringFiles);
    } else {
        locateStringFiles(file, function(stringFiles) {
            cachedStringFiles = stringFiles;

            done(stringFiles);
        });
    }
};

var locateStringFiles = function(file, done) {
    fs.stat(file, function(err, stats) {
        if (stats.isDirectory()) {
            fs.readdir(file, function(err, files) {
                var collectedFiles = {};

                if (_.isEmpty(files)) {
                    done(collectedFiles);
                } else {
                    var counter = files.length;
                        dirDone = function(collected) {
                            counter -= 1;

                            _.merge(collectedFiles, collected);

                            if (0 === counter) {
                                done(collectedFiles);
                            }
                        };

                    _.forEach(files, function(f) {
                        locateStringFiles(path.resolve(file, f), dirDone);
                    });
                }
            });
        } else {
            var result = {};
            if (path.basename(file) === 'Localizable.strings') {
                var parentDir = path.dirname(file);

                if (path.extname(parentDir) === '.lproj') {
                    var locale = path.basename(parentDir, '.lproj');
                    result[locale] = file;
                }
            }

            done(result);
        }
    });
};
