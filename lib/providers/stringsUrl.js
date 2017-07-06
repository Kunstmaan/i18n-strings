var _ = require('lodash'),
    Promise = require('bluebird'),
    fetch = require('node-fetch'),
    i18nStrings = Promise.promisifyAll(require('i18n-strings-files'));

var processConfig = function (config) {
    return new Promise(function (resolve, reject) {
        if (!config.url) {
            reject('Invalid config for url provider');
        } else {
            resolve(config);
        }
    });
};

var getTranslations = function (syncConfig, languages) {
    return Promise.resolve().then(function () {
        var translations = {};

        return Promise.map(languages, function (language) {
            var url = syncConfig.url.replace('$$LANG$$', language);

            console.log("Fetching from ", url);
            return fetch(url).then(function (response) {
                return response.text();
            }).then(function (textContent) {
                return i18nStrings.parse(textContent);
            }).then(function (t) {
                translations[language] = t;
            });
        }).then(function () {
            return translations;
        });
    });
};

module.exports = {
    processConfig, getTranslations
};
