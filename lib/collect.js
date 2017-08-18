var  _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    naturalSort = require('javascript-natural-sort'),
    readFile = require(path.resolve(__dirname, 'utils', 'fileReader')),
    updateStrings = require(path.resolve(__dirname, 'utils', 'updateStrings'));

var layoutRegexes = {
    collecting: [/.*<userDefinedRuntimeAttribute[^\>]*keyPath="i18n(?!ShouldUppercase)[^"]+"[^\>]*value="([^"]+)"[^\>]*>/gi],
    alerts: [
        {
            regexes: [/.*<userDefinedRuntimeAttribute[^\>]*keyPath="i18nImageBaseName"[^\>]*value="([^"]+)"[^\>]*>/gi],
            description: "localized image found!"
        },
        {
            regexes: [/.*<userDefinedRuntimeAttribute[^\>]*keyPath="i18n[^"]+"[^\>]*value=""[^\>]*>/gi],
            description: "empty translation found!"
        }
    ]
};

var REGEXES = {
    "swift": {
        collecting: [/i18nNavKey[^}]+return\s*"([^"]+)"/gmi, /i18nTabKey[^}]+return\s*"([^"]+)"/gmi, /"([^"]+)"\.i18nLocalized/gi, /localizedStringForKey\("([^"]+)"/gi, /localizedString\(forKey:\s*"([^"]+)"/gi],
        alerts: [
            {
                regexes: [/"([^"]*\\\([^"]*)"\.i18nLocalized/gi],
                description: "translation with variable!"
            }
        ]
    },
    "storyboard": layoutRegexes,
    "xib": layoutRegexes
};

var processFile, collectKeysFromFile;

module.exports = function(srcPath, options) {
    fs.exists(srcPath, function(exists) {
        if (exists) {
            processFile(srcPath, function(collected, alerted) {
                var shouldExitWithError = false;
                console.log(colors.inverse('Please take a look at the following translations:'));

                _.forEach(alerted, function(description, key) {
                    console.log(colors.red('- ' + description + ' (' + key + ')'));
                });

                updateStrings(srcPath, function(currentKeys, locale, updateDataCB) {
                    var i = 0,
                        newKeys = [];

                    for (; i < collected.length; i++) {
                        if (!currentKeys.hasOwnProperty(collected[i])) {
                            newKeys.push(collected[i]);
                        }
                    }

                    if (_.isEmpty(newKeys)) {
                        console.log(colors.green('No new keys found'));
                    } else {
                        console.log(colors.red('File not up to date!'));

                        _.forEach(newKeys, function(key) {
                            console.log(colors.red('- ' + key));
                            currentKeys[key] = {
                                'text': '',
                                'comment': 'Automatically added by i18n collect'
                            };
                        });

                        if (options.updateFiles === true) {
                            updateDataCB(currentKeys);
                        } else {
                            shouldExitWithError = true
                        }
                    }
                }, function() {
                    if (shouldExitWithError) {
                        throw Error('New translation keys found! manually update your translation keys or use the collect command with -u flag to force update the translation files.');
                    }
                });
            });
        } else {
            throw Error('Path ' + srcPath + ' doesn\'t exist!');
        }
    });
};

processFile = function(file, done) {
    fs.stat(file, function(err, stats) {
        if (stats.isDirectory()) {
            fs.readdir(file, function(err, files) {
                var collectedKeys = [],
                    alertedTranslations = {};

                if (_.isEmpty(files)) {
                    done(collectedKeys, alertedTranslations);
                } else {
                    var counter = files.length;
                        dirDone = function(collected, alerted) {
                            counter -= 1;

                            Array.prototype.push.apply(collectedKeys, collected);
                            _.merge(alertedTranslations, alerted);

                            if (0 === counter) {
                                done(collectedKeys, alertedTranslations);
                            }
                        };

                    _.forEach(files, function(f) {
                        processFile(path.resolve(file, f), dirDone);
                    });
                }
            });
        } else {
            collectKeysFromFile(file, done);
        }
    });
};

collectKeysFromFile = function(file, done) {
    var ext = _.trimLeft(path.extname(file), '.');

    var collectedKeys = [],
        alertedTranslations = {};

    if (REGEXES.hasOwnProperty(ext)) {
        var config = REGEXES[ext];
        readFile(file, function(content) {
            console.log(colors.yellow.underline('Start processing: ' + path.basename(file)));
            var fileAlertedKeys = [];

            // Alerts
            i = 0;
            for (; i < config.alerts.length; i++) {
                var alert = config.alerts[i];

                var r = 0;
                for (; r < alert.regexes.length; r++) {
                    var regex = alert.regexes[r];
                    regex.lastIndex = 0

                    while (match = regex.exec(content)) {
                        var key = match[1];
                        console.log(colors.bgRed('- Alert: ' + alert.description + (_.isNull(key) ? '' : ' - ' + key)));

                        if (!_.isNull(key)) {
                            alertedTranslations[key] = alert.description;
                            fileAlertedKeys.push(key);
                        }
                    }
                }
            }

            // Collect keys
            var i = 0;
            for (; i < config.collecting.length; i++) {
                var regex = config.collecting[i];
                regex.lastIndex = 0

                while (match = regex.exec(content)) {
                    var key = match[1];
                    console.log(colors.green('- Key found: ' + key));

                    if (!_.includes(fileAlertedKeys, key)) {
                        collectedKeys.push(key);
                    }
                }
            }

            done(collectedKeys, alertedTranslations);
        });

    } else {
        done(collectedKeys, alertedTranslations);
    }
};
