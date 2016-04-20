var _ = require('lodash'),
    colors = require('colors'),
    i18nStrings = require('i18n-strings-files'),
    path = require('path'),
    stringFileLocator = require(path.resolve(__dirname, 'stringFileLocator'));

module.exports = function(src, cb, done) {
    stringFileLocator(src, function(stringFiles) {
        var counter = _.size(stringFiles);

        _.forEach(stringFiles, function(file, locale) {

            i18nStrings.readFile(file, { 'encoding': 'utf8', 'wantsComments': true }, function(err, data) {
                console.log(colors.inverse('Updating .strings file for ' + locale));

                cb(data, locale, function(data) {

                    i18nStrings.writeFile(file, data, 'utf8', function(err) {
                        if (err) {
                            throw Error('Writing file ' + file + ' failed for locale ' + locale);
                        }

                        console.log(colors.green('Successfully updated file for ' + locale));
                    });

                });

                counter -= 1;

                if (counter === 0) {
                    done();
                }
            });
        });
    });
};
