
var parser = function(file, pair, googleValue ) {
	var fs = require('fs');
	var dom = require('xmldom').DOMParser;
	var colors = require('colors');
	var testdata;
	var parserData;
	var counter = 0;

    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            throw Error('Unable to read xml file: ' + file);
        }

        parserData = new dom().parseFromString(data);
        
        for(var i = 0; i < pair.length; i++){
        	if(pair[i]> -1){

        		var node = parserData.getElementsByTagName('string')[pair[i]].firstChild;
        		console.log(' value: ' + node);
        		if(node){
        			var textNode = node;
        			if(!textNode){
        				textNode = parserData.createTextNode("");
        				node.appendChild(textNode);
        			}
        			var CDString= '<![CDATA[';
        			var test = node.toString()
       			
        			if(test.indexOf(CDString) > -1){        			          		 			
            			googleValue[i] = googleValue[i].replace("'","\\'")
            			var val =  googleValue[i];
        			}
        			else{
             			googleValue[i] = googleValue[i].replace("'","\\'") 			
        				var val = googleValue[i];
        				console.log(val);
        				}
        			
        			textNode.nodeValue = val;
        			textNode.data = val.toString();
           			counter++;
        		}
        	}
        }
        var XMLSerializer = require('xmldom').XMLSerializer;
		var serializedXML = new XMLSerializer().serializeToString(parserData);
		try{
			fs.writeFile(file,serializedXML,'utf8');
		} catch(err) {
			console.log(colors.red('Failed to write file'));
		}
		console.log(colors.green("value updated"));
        return counter;
    });
};

module.exports.parser = parser;