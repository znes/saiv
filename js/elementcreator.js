function ElementCreator() {};

ElementCreator.createCyElements = function(jsonData) {
	var eles = [];

	// Add Scenario Node
	eles.push({
		group: "nodes",
		data: {
			id: jsonData.name,
			type: "scenario",
			api_parameters: jsonData.api_parameters,
			data: {
				tags: jsonData.tags
			}
		},
	});

	for (var i = 0; i < jsonData.children.length; i++) {
		eles.push({
			group: "nodes",
			data: {
				id: jsonData.children[i].name,
				data: jsonData.children[i]
			}
		});
	}

	// Add edges when nodes loaded
	for (var i = 0; i < jsonData.children.length; i++) {
		for (var j = 0; j < jsonData.children[i].successors.length; j++) {
			eles.push({
				data: {
					source: jsonData.children[i].name, // the source node id (edge comes from this node)
					target: jsonData.children[i].successors[j] // the target node id (edge goes to this node)
				},
				group: "edges"
			});
		}
		/*for (var k = 0; k < jsonData.children[i].predecessors.length; k++) {
			eles.push({
				data: {
					source: jsonData.children[i].predecessors[k], // the source node id (edge comes from this node)
					target: jsonData.children[i].name // the target node id (edge goes to this node)
				},
				group: "edges"
			});
		}*/
	}
	return eles;
}

ElementCreator.createInput = function(name, key, currentValue, type) {
	var html = "";
	if (type == "hidden") {
		html += '<input type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>';
	} else {
		html += '<label for="' + key + '">' + name + '</label>';
		html += '<input type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>';
	}
	return html;
}

ElementCreator.createSelect = function(key, currentValue, options) {
	var html = "";
	html += '<label for="' + key + '">' + key + '</label>';
	html += '<select class="js-example-basic-multiple ' + key + '" multiple="multiple" name="' + key + '">';
	for (var i = 0; i < options.length; i++) {
		if ($.inArray(options[i].data().id, currentValue) > -1) {
			html += '<option selected value="' + options[i].data().id + '">' + options[i].data().id + '</option>';
		} else {
			html += '<option value="' + options[i].data().id + '">' + options[i].data().id + '</option>';
		}
	}
	html += '</select>';
	return html;
}