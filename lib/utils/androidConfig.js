var _= require('lodash'),
	path = require('path'),
	fs = require('fs'),
	GS = require('google-spreadsheet'),
	readFile = require(path.resolve(__dirname, 'fileReader'));


var stringPath = function(configfile,cb){
	fs.exists(configfile, function(exists){
		if(exists){
			readFile(path.resolve(process.cwd(), configfile), function(rawConfig){
				config = JSON.parse(rawConfig);
				
				if(_.isObject(config['sync'])){
					var pathBase = config['sync']['config']['base_path'];
					var pathFile =  config['sync']['config']['destination']
					var finalpath = pathBase + '/' + pathFile;
					cb(finalpath.toString())
				}
			})
		} else {
			throw Error('Config file not found')
		}
	})
}


module.exports.stringPath = stringPath;
