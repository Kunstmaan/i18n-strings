module.exports = function(newKey, googleKeyValue, googleValue, file, keyValue){
	var fs = require('fs');
	var colors = require('colors');
	var str = 'string';
	var res = '</resources>';
	var values = '';

	fs.readFile(file,'utf8',function(err,data){
		if(err){
			throw Error('Unable to read xml file: ' + file);
		}
			for(var i = 0; i < newKey.length; i++){
			if(newKey[i] > -1){
				values += '	<string name = ' + '"' + googleKeyValue[newKey[i]] + '"' + '>' + googleValue[newKey[i]] + '</string>' + '\n';
			}
		}
			
		fs.open(file, 'r+', function(err, fd) {
			var buffer = new Buffer(values + '\n' + '</resources>');
			var fileSize = fs.statSync(file)['size'];
			fs.write(fd, buffer, 0 ,buffer.length, (fileSize - res.length), function(err) {
				if (err) throw err
				console.log(values);
				console.log(colors.green('new keys added'));
			})			
		});
	})
}