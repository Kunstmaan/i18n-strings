#!/usr/bin/env node
var _ = require('lodash'),
		path = require('path'),
		fs = require('fs'),
		meow = require('meow'),
	    colors = require('colors');

var cli = meow(
"		Usage" + 
"\n		$ kuma-string-strings collect|sync|syncAndroid" + 
"\n" +
"\n		Options" +
"\n		-s, --source			Specify the path where the Xcode files are located" +
"\n		-c, --config			Specify the path to the kuma-i18n configuration file relative to the source path, default .kuma-i18n-strings" +
"\n		-u, --update-files		Specify if it may update the Localizable files, default false" +
"\n		-h, --help				Display help" +
"\n		-a, --android-config	Updates xml files in Android Studio" +
"\n		-n, --android-source	Specify the path to the kuma-i18n configuration file relative to the source path for Android" +
"\n		-v, --version			Display the current version number" +
"\n" +
"\n		Example" +
"\n		$ kuma-i18n collect		To collect all the strings from the storyboard, swift files" +
"\n		$ kuma-i18n sync		To sync the translations with an online datastore (for now only google spreadsheets)" +
"\n		$ kuma-i18n syncAndroid	To sync the translation from Android Studio with an online datastore"
, {
	string: ["source", "config","android-config"],
	bool: ["update-files"],
	alias: {
		"c": "config",
		"u": "updates-files",
		"s": "source",
		"h": "help",
		"v": "version",
		"a": "android-config",
		"n": "android-source"
	},
	default: {
		"source": ".",
		"config": ".kuma-i18n-strings",
		"android-config": ".txt"			
	},
	stopEarly: false
});

(function() {
	if (!_.isEmpty(cli.input)) {
		var args = cli.flags,
		command = cli.input[0],
		commandPath = path.resolve(__dirname,"lib",command + ".js");
		
		fs.exists(commandPath, function(exists){
			if(exists){
				console.log(colors.inverse("Executing " + command + " command!"));
				
				if(command == "syncAndroid"){
					var srcPathAndroid = args["android-config"];
					if(_.isUndefined(srcPathAndroid) || !_.isString(srcPathAndroid)){
						throw Error("Please specify a path");
					}
					srcPathAndroid = path.resolve(process.cwd(), srcPathAndroid);
					require(commandPath)(srcPathAndroid, args);
										
				} else {
				
				
				var srcPath = args["source"];
				if(_.isUndefined(srcPath) || !_.isString(srcPath)) {
					throw Error("Please specify a path");
				}
				
				srcPath =  path.resolve(process.cwd(), srcPath);
				require(commandPath)(srcPath, args);
				}
			} else {
				throw Error("Invalid command " + command);
			}
		})
	} else {
		throw Error("Invalid command");
	}
})();