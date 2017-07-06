var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    readFile = require(path.resolve(__dirname, 'utils', 'fileReader')),
    colors = require('colors'),
    i18nStrings = require('i18n-strings-files'),
    GS = require('google-spreadsheet'),
    stringFileLocator = require(path.resolve(__dirname, 'utils/stringFileLocator')),
    updateStrings = require(path.resolve(__dirname, 'utils', 'updateStrings')),
    Promise = require('bluebird'),

    google = require(path.resolve(__dirname, 'providers', 'googleSpreadsheet')),
    stringsUrl = require(path.resolve(__dirname, 'providers', 'stringsUrl'));

var doubleEscape = function(string) {
    return string.replace(/[^\\]\\(n|r|t)/g, '\\\\$1');
};

var createProvider = function (config) {
    switch (config.sync.provider) {
        case "google":
            return google;

        case "url":
            return stringsUrl;

        default:
            throw new Error('Unknown provider: ' + config.sync.provider);
    }
};

var locateStringFiles = function (srcPath) {
    return new Promise(function (resolve, reject) {
        stringFileLocator(srcPath, resolve);
    });
};

module.exports = function(srcPath, options) {
    var configFile = path.resolve(srcPath, options.config);

    fs.exists(configFile, function(exists) {
        if (exists) {
            readFile(path.resolve(process.cwd(), configFile), function(rawConfig) {
                var config = JSON.parse(rawConfig);
                var provider = createProvider(config);

                provider.processConfig(config.sync.config)
                    .then(function (config) {
                        return locateStringFiles(srcPath)
                            .then(function (stringFiles) {
                                return Object.keys(stringFiles);
                            })
                            .then(function (languages) {
                                return provider.getTranslations(config, languages);
                            })
                    }).then(function (translations) {
                        var shouldExitWithError = false;
                        updateStrings(srcPath, function(currentTranslations, locale, updateDataCB) {
                            var i = 0,
                                updates = {};

                            _.forEach(translations[locale], function(value, key) {
                                var oldValue = _.trim(currentTranslations[key] ? currentTranslations[key].text : ''),
                                    newValue = _.trim(value);

                                // hack to work arround double escaped strings coming from the google sheets module (something with the SAX)
                                if (!_.isEqual(oldValue, newValue)) {
                                    currentTranslations[key] = newValue;
                                    updates[key] = {
                                        'old': oldValue,
                                        'new': newValue
                                    };
                                }
                            });

                            if (_.isEmpty(updates)) {
                                console.log(colors.green('No updates found!'));
                            } else {
                                console.log(colors.red('Updates found!'));
                                _.forEach(updates, function(values, key) {
                                    console.log(colors.grey('[' + key + '] changed from "' + values['old'] + '" to "'  + values['new'] + '"'));
                                });

                                if (options.updateFiles === true) {
                                    updateDataCB(currentTranslations);
                                } else {
                                    shouldExitWithError = true;
                                }
                            }
                        }, function() {
                            if (shouldExitWithError) {
                                throw Error('Updates available! manually sync your translation file or use the sync command with -u flag to force update the translation files.');
                            }
                        });
                    });
                });
        } else {
            throw Error('Config file not found.');
        }
    });
};
