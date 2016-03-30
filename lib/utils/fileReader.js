var fs = require('fs');

module.exports = function(file, cb) {
    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            throw Error('Unable to read file ' + file);
        }

        cb(data);
    });
};
