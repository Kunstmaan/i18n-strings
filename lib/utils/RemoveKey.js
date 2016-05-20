module.exports = function(oldKey,file, googleKeyValue){

 var dom = require('xmldom').DOMParser,
	 fs = require('fs'),
	 path = require('path'),
	 colors = require('colors'),
	 str = 'string';
 
		fs.readFile(file, 'utf8', function(err,data){
			 if(err){
				 throw Error('Unable to read xml file: ' + err);
			 }
	
			var xml = new dom().parseFromString(data);
			for(var i = 0; i < oldKey.length; i++ ){
				
				var numbers = FindNodeIndex(googleKeyValue[oldKey[i]], xml);
				if(numbers > -1){
				xml = removeItem(numbers, xml)
				}
			}

			 	var XMLSerializer = require('xmldom').XMLSerializer;
				var serializedXML = new XMLSerializer().serializeToString(xml);
				console.log(serializedXML)
				try{
					fs.writeFile(file,serializedXML,'utf8');				
					console.log('writing has been done')
				} catch(err) {
					console.log('Failed to write file: ' + err )
				}			 
		 });
		 
	function FindNodeIndex(ID, xml){
		var nodePos = -1;
		var XMLLength = xml.getElementsByTagName(str).length;
		for (var i = 0; i < XMLLength; i++){
			var key = xml.getElementsByTagName(str)[i].toString();
			var first = key.indexOf('"');
			var second = key.indexOf('"', first +1);
			var temp = key.substring(first+1, second).trim()
			try{
		if(temp == ID)
			{
				nodePos = i;
				break;
			}
		}
	catch (e) {
			console.log(colors.red('failed to retrieve position'));		
			}
		}
		
	return nodePos;
};

function removeItem(number, data){
	var nodeToDelete = data.getElementsByTagName(str)[number];
	var nodeParent = nodeToDelete.parentNode;
	nodeParent.removeChild(nodeToDelete);
	return data;
	}
}