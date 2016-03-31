var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    readFile = require(path.resolve(__dirname, 'utils', 'fileReader')),
    colors = require('colors'),
    i18nStrings = require('i18n-strings-files'),
    GS = require('google-spreadsheet'),
    stringFileLocator = require(path.resolve(__dirname, 'utils/stringFileLocator')),
    updateStrings = require(path.resolve(__dirname, 'utils', 'updateStrings'));

var doubleEscape = function(string) {
    return string.replace(/[^\\]\\(n|r|t)/g, '\\\\$1');
};

module.exports = function(srcPath, args) {
    var configFile = path.resolve(srcPath, args['config']);


    fs.exists(configFile, function(exists) {
        if (exists) {
            readFile(path.resolve(process.cwd(), configFile), function(rawConfig) {
                var config = JSON.parse(rawConfig), syncProvider, syncConfig,
                    syncConfig, sheet, creds, keyColumn, valueColumns;

                if (_.isObject(config['sync'])) {
                    syncProvider = config['sync']['provider'];

                    if (syncProvider === 'google') {
                        syncConfig = config['sync']['config'];

                        if (syncConfig.hasOwnProperty('file-id') && syncConfig.hasOwnProperty('creds')) {
                            sheet = new GS(syncConfig['file-id']);
                            creds = syncConfig['creds'];
                        
                            if (syncConfig.hasOwnProperty('columns')) {
                                if (syncConfig['columns'].hasOwnProperty('key')) {
                                    keyColumn = syncConfig['columns']['key'].replace(/\s+/g, '').toLowerCase();
                                } else {
                                    keyColumn = 'ioskey';
                                }

                                if (syncConfig['columns'].hasOwnProperty('value')) {
                                    valueColumns = _.map(syncConfig['columns']['value'], function(valueColumn) {
                                        return valueColumn.replace(/\s+/g, '').toLowerCase();
                                    });
                                } else {
                                    valueColumns = ['$$LANG$$'];
                                }
                            }

                            stringFileLocator(srcPath, function(stringFiles) {
                                var translations = {};
                                var langValueColumns = {};

                                _.forEach(stringFiles, function(path, lang) {
                                    langValueColumns[lang] = _.map(valueColumns, function(valueColumn) {
                                         return valueColumn.replace(/\$\$lang\$\$/gi, lang);
                                    });

                                    translations[lang] = {};
                                });

                                sheet.useServiceAccountAuth(creds, function(err) {
                                    sheet.getRows(1, function(err, rows) {
                                        var i = 0;
                                        for (; i < rows.length; i++) {
                                            var row = rows[i];
                                            if (row[keyColumn] && 0 < row[keyColumn].length) {
                                                _.forEach(langValueColumns, function(columns, lang) {
                                                    _.forEach(columns, function(column) {
                                                        if (row[column] &&  0 < row[column].length) {
                                                            translations[lang][row[keyColumn]] = row[column];

                                                            return false;
                                                        }
                                                    });
                                                });
                                            }
                                        }

                                        var counter = _.size(translations);
                                        _.forEach(translations, function(langTranslations, locale) {
                                            var file = '/tmp/i18n_' + locale + '.strings';

                                            // write/read to fix escaping
                                            i18nStrings.writeFile(file, langTranslations, 'utf8', function(err) {
                                                if (err) {
                                                    throw Error('Writing file ' + file + ' failed for locale ' + locale);
                                                }

                                                i18nStrings.readFile(file, { 'encoding': 'utf8', 'wantsComments': false }, function(err, langTranslations) {
                                                    if (err) {
                                                        throw Error('Writing file ' + file + ' failed for locale ' + locale);
                                                    }

                                                    translations[locale] = langTranslations;

                                                    counter -= 1;
                                                    if (counter === 0) {
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

                                                                if (args['update-files'] === true) {
                                                                    updateDataCB(currentTranslations);
                                                                } else {
                                                                    shouldExitWithError = true;
                                                                }
                                                            }
                                                        }, function() {
                                                            if (shouldExitWithError) {
                                                                process.exit(1);
                                                            }
                                                        });
                                                    }
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        } else {
                            throw Error('Invalid configuration for the google provider.');
                        }
                    } else {
                        throw Error('Invalid sync provider: ' + syncProvider + '.');
                    }
                } else {
                    throw Error('No configuration found for syncing.');
                }
            });
        } else {
            throw Error('Config file not found.');
        }
    });
}
