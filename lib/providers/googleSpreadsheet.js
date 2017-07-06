var _ = require('lodash'),
    GS = require('google-spreadsheet'),
    Promise = require('bluebird'),
    i18nStrings = Promise.promisifyAll(require('i18n-strings-files'));

var processConfig = function (config) {
    return new Promise(function (resolve, reject) {
        if (! (config.hasOwnProperty('file-id') && config.hasOwnProperty('creds'))) {
            reject('Invalid configuration for the google provider.');
            return;
        }

        var creds = config['creds'];

        var keyColumn, valueColumns;
        if (config.hasOwnProperty('columns')) {
            if (config['columns'].hasOwnProperty('key')) {
                keyColumn = config['columns']['key'].replace(/\s+/g, '').toLowerCase();
            } else {
                keyColumn = 'ioskey';
            }

            if (config['columns'].hasOwnProperty('value')) {
                valueColumns = _.map(config['columns']['value'], function(valueColumn) {
                    return valueColumn.replace(/\s+/g, '').toLowerCase();
                });
            } else {
                valueColumns = ['$$LANG$$'];
            }
        }

        resolve({
            creds, keyColumn, valueColumns, fileId: config['file-id']
        });

    });
}

var cleanTranslations = function (language, translations) {
    var file = '/tmp/i18n_' + language + '.strings';

    return i18nStrings.writeFile(file, translations, 'utf8')
        .then(function () {
            return i18nStrings.readFile(file, { encoding: 'utf8', wantsComments: false})
        });
};

var getTranslations = function (settings, languages) {
    return new Promise(function (resolve, reject) {
        resolve(new GS(settings.fileId))
    }).then(function (sheet) {
        var langValueColumns = {};

        _.forEach(languages, function (lang) {
            langValueColumns[lang] = _.map(settings.valueColumns, function(valueColumn) {
                return valueColumn.replace(/\$\$lang\$\$/gi, lang);
            });
        });

        return new Promise(function (resolve, reject) {
            sheet.useServiceAccountAuth(settings.creds, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(sheet);
                }
            })
        }).then(function (sheet) {
            return new Promise(function (resolve, reject) {
                sheet.getRows(1, function (err, rows) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }).then(function (rows) {
            var translations = {};

            var i = 0;
            for (; i < rows.length; i++) {
                var row = rows[i];
                if (row[settings.keyColumn] && 0 < row[settings.keyColumn].length) {
                    _.forEach(langValueColumns, function(columns, lang) {
                        translations[lang] = translations[lang] || {};

                        _.forEach(columns, function(column) {
                            if (row[column] &&  0 < row[column].length) {
                                translations[lang][row[settings.keyColumn]] = row[column];

                                return false;
                            }
                        });
                    });
                }
            }

            return translations;
        });
    })
    .then(function (translationMap) {
        return Promise.all(Object.keys(translationMap), function (language) {
            return cleanTranslations(language, translationMap[language]).then(function (translations) {
                translationMap[language] = translations;
            });
        }).then(function () {
            return translationMap;
        });
    });
};

module.exports = {
    processConfig, getTranslations
};
