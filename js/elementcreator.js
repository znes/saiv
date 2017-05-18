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
					source: jsonData.children[i].name,
					target: jsonData.children[i].successors[j]
				},
				group: "edges"
			});
		}
	}
	return eles;
}

/*ElementCreator.getStylesForm = function(styles, selected) {
	var form = $('<form class="editForm"></form>');
	form.append(ElementCreator.createSelect(key, value, nodes));
	$('.js-example-basic-multiple', form).select2();

	return form;
}*/

ElementCreator.createInput = function(name, key, currentValue, type, required=false) {
	var html = "";
	
	if (type != "hidden") {
		html += '<label for="' + key + '">' + name + '</label>';
	}
	if(required) {
		html += '<input required type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>';
	}
	else {
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