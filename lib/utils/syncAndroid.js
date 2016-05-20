var xpath = require('xpath'), 
	dom = require('xmldom').DOMParser,
	colors = require('colors'),
	_ = require('lodash'),
	GoogleSpreadSheet = require('google-spreadsheet'),
	fs = require('fs'),
	async = require('async'),
	path = require('path');

var xmlCollector = require(path.resolve(__dirname,'xmlStringCollector')),
	parser = require(path.resolve(__dirname,'parser')),
	fileLocal = require(path.resolve(__dirname,'androidConfig')),
	readFile = require(path.resolve(__dirname, 'fileReader')),
	write = require(path.resolve(__dirname,'WriterXML')),
	remove = require(path.resolve(__dirname, 'RemoveKey')),
	check = require(path.resolve(__dirname, 'valueCheck'));

var keyValue = [],
	value = [],
	pair = [],
	googleCounter = [],
	googleKeyValue = [],
	googleValue = [],
	newKey = [],
	oldKey = [],
	parserDOM,
	isCheck;

var config, syncprovider, syncConfig,sheets,creds,keyColum,valueColumns, stringFile;

var configFile = fileLocal.configFilePath();

fileLocal.stringPath(configFile, function(file){
	if(file){
		stringFile = file;
		fs.exists(file, function(exists){
			if(exists){
				console.log('file succesfully found');
				} else {
					console.log('please give a correct path');
				}
			})
			return true;
			} else {
			
				console.log('error found in the config file');
				return false;
		}
	});

fs.exists(configFile, function(exists){
	if(exists){
		readFile(path.resolve(process.cwd(), configFile),function(rawConfig){
			 config = JSON.parse(rawConfig);
			
			if(_.isObject(config['sync'])){
				syncprovider = config['sync']['provider'];
				
				if(syncprovider === 'google'){
					syncConfig = config['sync']['config'];
					
					if (syncConfig.hasOwnProperty('file-id') && syncConfig.hasOwnProperty('creds')) {
						sheets = new GoogleSpreadSheet(syncConfig['file-id']);
						creds = syncConfig['creds'];
					
						if(syncConfig.hasOwnProperty('colums')) {
							
							if(syncConfig['colums'].hasOwnProperty('key')){
								keyColum = syncConfig['colums']['key'].replace(/\s+/g,'').toLowerCase();
								
							} else {
								 keyColum = 'androidkey';
									}
							
							if(syncConfig['colums'].hasOwnProperty('value')){
								valueColumns = _.map(syncConfig['colums']['value'], function(valueColumn){
									return valueColumn.replace(/\s+/g,'').toLowerCase();
								});
							
							} else {
								valueColumns = ['$$LANG$$'];
							}	
							async.series([
							              function setAuth(step){
							            	  sheets.useServiceAccountAuth(creds,step);
							              },
							              function getData(step){
							            	  sheets.getRows(1,function(err,rows){
							            		  for(var i = 0; i < rows.length; i++){
							            			  row = rows[i];
							            			  if(row[keyColum]){
							            				  googleKeyValue[i] = row[keyColum].trim();
							            				  googleValue[i] = row[valueColumns].trim();
							            			  }
							            		  }
							            		  step();
							            	  })
							            	  
							              }, function syncData(step){
							            	  try{
							            		  keyValue = new xmlCollector.keyLan();
							            		  value = new xmlCollector.ValueLan();
								            	  } catch(err){
								            		  console.log(colors.red('Cannot collect values from the source file'));
								            	  }
							            	  step();
							            	  
							              }, function testData(step){		            	  
							            	  
							            	  for(var i = 0; i < googleKeyValue.length; i++){
							            		  pair[i] = new xmlCollector.keyPair(keyValue, googleKeyValue[i]);
							           	   		  }
							            	  
							            	  step();
							            	  
							              },function newKeyTest(step){
							            	  
							            	  var bool;
							            	  var tmpCounter = 0;
							            	  
							            	  for(var i = 0; i < googleKeyValue.length; i++){
							            		  bool =  new xmlCollector.newKey(keyValue, googleKeyValue[i]);
							            		  if( bool > -1 ){
							            			  newKey[tmpCounter++] = i;
							            			   }
							            	  }
							            	  if(newKey.length == 0 || newKey == null){
							            	  		console.log(colors.green('No new key has been found'));							            		  
							            	  } else {
							            		  console.log(colors.red('New keys found'));
							            	  }
							            	  step();
							            	  
							              },function writeNewKey(step){
							            	  //todo add user authorization for adding new keys
							            	 try{
							            		 if(newKey.length > 0){
							            		  write(newKey, googleKeyValue,googleValue,stringFile,keyValue );
							            		 }
							            	  } catch(err) {
							            		  console.log(colors.red('writing new key failed'));
							            	  }
							            	  step();
							            	  
							              },function gatherOldKeys(step){
							            	  var boolOld;
							            	  var tmpCounter = 0;
							            	  for(var i = 0; i < keyValue.length; i++){
							            		  boolOld =  new xmlCollector.oldKey(googleKeyValue, keyValue[i]);
							            		  if( boolOld > -1 ){
							            			  oldKey[tmpCounter++] = i;
							            			   }
							            	  }
							            	  	if(oldKey.length == 0 || oldKey == null){
							            	  		console.log('No old key founds');							            		  
							            	  }
							            	  step();
							            	  
							              },function removeOldKey(step){
							            	  //todo add a prompt for user authorization of removal of keys
							            	  //remove(oldKey, stringFile, googleKeyValue);
							            	
							            	  step();  
							              },function updateXML(step){
							            	  isCheck = check(stringFile,value, googleValue, pair);
							               	  console.log(isCheck);
								            	  try{
								            		  if(isCheck  > -1){
								            			  parserDOM = new parser.parser(stringFile, pair, googleValue);
								            		  } else {
								            			  console.log(colors.green('No new value found'));
								            		  }
								            	  }catch(err){
								            		  console.log(err);
								            	  }
								            	  step();
							              }						              
							    ]);
						}
					} else {
						throw Error('Invalid configuration for the google provider');
					}
				} else {
					throw Error('Invalid sync provider');
				}
			} else {
				throw Error('No configuration for syncing');
			}
		});
	} else {
		throw Error('Config file not found.');
	}
})