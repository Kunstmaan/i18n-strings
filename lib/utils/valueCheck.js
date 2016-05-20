module.exports = function(file, value,langGoogleValue, pair){
	for(var i = 0; i < pair.length; i ++){
		if(pair[i] > -1){
			var tmp = langGoogleValue[i].replace("'","\\'");
			var test = tmp.replace("'","\\'");
			if(value[pair[i]] != test && test != "undefined" && value[pair[i]] != "undefined"){
				return 0;
			}
		}
	}
	return -1;
}