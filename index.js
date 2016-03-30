#!/usr/bin/env node
var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    colors = require('colors'),
    meow = require('meow');

var cli = meow(
"    Usage" +
"\n      $ kuma-i18n-strings collect|sync" +
"\n" +
"\n    Options" +
"\n      -s, --source         Specify the path where the Xcode files are located" +
"\n      -c, --config         Specify the path to the kuma-i18n configuration file relative to the source path, default .kuma-i18n" +
"\n      -u, --update-files   Specify if it may update the Localizable files, default false" +
"\n      -h, --help           Display help" +
"\n      -v, --version        Display the current version number" +
"\n" +
"\n    Examples" +
"\n      $ kuma-i18n collect  To collect all the strings from the storyboard, swift files" +
"\n      $ kuma-i18n sync     To sync the translations with an online datastore (for now only google spreadsheets)"
, {
    string: ["source", "config"],
    bool: ["update-files"],
    alias: { 
        "c": "config",
        "u": "update-files",
        "s": "source",
        "h": "help",
        "v": "version"
    },
    default: { 
        "source": ".",
        "config": ".kuma-i18n-strings" 
    },
    stopEarly: false
});

(function() {

    if (!_.isEmpty(cli.input)) {
        var args = cli.flags,
            command = cli.input[0],
            commandPath = path.resolve(__dirname, "lib", command + ".js");

        fs.exists(commandPath, function(exists) {
            if (exists) {
                console.log(colors.inverse("Executing " + command + " command!"));

                var srcPath = args["source"];
                if (_.isUndefined(srcPath) || !_.isString(srcPath)) {
                    throw Error("Please specify a path");
                }

                srcPath = path.resolve(process.cwd(), srcPath);
                require(commandPath)(srcPath, args);
            } else {
                throw Error("Invalid command " + command);
            }
        })
    } else {
        throw Error("Invalid command");
    }

})();
