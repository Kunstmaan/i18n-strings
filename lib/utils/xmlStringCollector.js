var xpath = require('xpath'), dom = require('xmldom').DOMParser;
var _ = require('lodash');
var GoogleSpreadSheet = require('google-spreadsheet');
var fs = require('fs');
var path = require('path')
var parserdata = require(path.resolve(__dirname,'parser'));
var fileLocal = require(path.resolve(__dirname,'androidConfig'));
var colors = require('colors');

var LANData;
var sourceDate;
var nodeName = 'string';
var listValue = [];
var listValueLAN = [];
var keyValue = [];
var stringFile;
var configFile = fileLocal.configFilePath();

var keyPair = function(keyVal, keyValLAN){
	var value = [];
	
	for(var i = 0; i < keyVal.length; i++){
			if(keyVal[i] == keyValLAN){
				value[0] = i;
				return value;
			}
		}
	value[0] = -1;
	return value;
	}
var newKey = function(keyVal, keyValLAN){
	var testBool;
	var value = [];
	for ( var i = 0; i < keyVal.length; i++){
		if(keyValLAN == keyVal[i] || keyValLAN == null ){
			testBool = true;
			break;
		}
	}
	if(!testBool){
		value[0] = 0;
		return value;
	} 
	
	value[0] = -1;
	return value;
}

var oldKey = function(keyValLAN, keyVal){
	var oldKeyBool;
	var value = [];
	
	for( var i = 0; i < keyValLAN.length; i++){
		if(keyVal == keyValLAN[i] || keyVal == null){
			oldKeyBool = true;
			break;
		}
	}
	
	if(!oldKeyBool){
		value[0] = 0;
		return value;
	}
	value[0] = -1;
}

fileLocal.stringPath(configFile, function(filePath){
	if(filePath){
		stringFile = filePath;
		fs.exists(filePath, function(exists){
			if(exists){
				console.log(colors.green('xml file found'));
			} else {
				console.log(colors.red('xml file is not found'));
			}
		});
		} else {
			
			console.log('Failed to read the config file');
			return false;
		}

	fs.readFile(stringFile, 'utf8', function(err,data1){
		LANData = data1;
		if(err){
			return console.log('failed to read file in the String collector');
		}
	
	fs.readFile(stringFile, 'utf8', function(err,data){
		sourceDate = data;
		if (err) {
			return console.log('failed to read file in the String collector');
			}
				
				var xmlDataParser = new dom().parseFromString(data1);
				var xmlDataParserLAN = new dom().parseFromString(data);
				
				for(var i = 0; i < 1000; i++){
					try{
						
						listValue[i] = xmlDataParser.getElementsByTagName(nodeName)[i].firstChild.nodeValue;
						listValueLAN[i] = xmlDataParserLAN.getElementsByTagName(nodeName)[i].firstChild.nodeValue;
						
					} catch(err) {
						console.log(colors.green('Finished gathering the values'));
						break;
					}
				}
				
				for ( var i = 0; i < 1000; i++){
					try{
						var tmp = xmlDataParser.getElementsByTagName(nodeName)[i].toString();
						var first = tmp.indexOf('"');
						var second = tmp.indexOf('"', first +1);
						keyValue[i] = tmp.substring(first+1, second).trim()
					
					} catch(err) {
						console.log(colors.green('Finished gathering the values'));
						break;
					}
				}
		});
	});
});
var ValueLan = function(){
	return listValue;
}

var keyLan = function(){
	return keyValue;
} 

module.exports.ValueLan = ValueLan;
module.exports.keyLan = keyLan;
module.exports.keyPair = keyPair;
module.exports.newKey = newKey;
module.exports.oldKey = oldKey;