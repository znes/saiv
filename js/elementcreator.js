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

ElementCreator.createForm = function(element, object, submitFunction, nodes) {
	element.html("");
	form = $('<form class="editForm"></form>');


	var objData = object.data();
	// current ID
	form.append(ElementCreator.createInput("currentid", objData.id, "hidden"));

	if (objData.type == 'scenario') {
		form.append(ElementCreator.createInput("name", objData.id, "text"));
		form.append(ElementCreator.createInput("type", objData.type, "hidden"));
	}
	$.each(objData.data, function(key, value) {
		if (key == "tags") {
			form.append('<label>Tags</label><br/>');
			$.each(objData.data[key], function(tag, tagValue) {
				form.append(ElementCreator.createInput("tags_" + tag, tagValue, "text"));
			});
		} else if (key == "predecessors" || key == "successors") {
			form.append(ElementCreator.createSelect(key, value, nodes));
			$('.js-example-basic-multiple', form).select2();
		} else {
			form.append(ElementCreator.createInput(key, value, "text"));
		}
	});

	form.append('<input type="submit" value="Save">');
	form.submit(function(e) {
		e.preventDefault();
		submitFunction(e);
	});
	element.append(form);
}

ElementCreator.createInput = function(key, currentValue, type) {
	var html = "";
	if (type == "hidden") {
		html += '<input type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>';
	} else {
		html += '<label for="' + key + '">' + key + '</label>';
		html += '<input type="' + type + '" id="' + key + '" name="' + key + '" placeholder="Current: ' + currentValue + '" value="' + currentValue + '"/>';
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