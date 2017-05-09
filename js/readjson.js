function readJson(readyFunction) {
    var content = "Select File<br>";
    content += "<input id='selectFile' type='file'><br>";
    content += "<br>";
    content += "<button id='useDefault'>Use default</button>";
    
  	modal("Add Json File", content );


  	$("#selectFile").on('change', function(event) {
  		var input = event.target;
		var reader = new FileReader();

		reader.onload = function() {
			var dataURL = reader.result;
			var json = JSON.parse(dataURL);
			readyFunction(json);
		};

		reader.readAsText(input.files[0]);
  	});

  	$("#useDefault").on('click', function() {
  		$.getJSON("minimal-example.json", function(jsonData) {
			console.log(jsonData);
			readyFunction(jsonData);
	    })
  	});
}