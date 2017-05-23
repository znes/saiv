function setActiveMenuItem(href) {
	$(".navbar-nav .active").removeClass("active")
	$("a[href='#"+href+"']").parent("li").attr("class", "active");
}

function createContentPage(heading, content) {
	$(".sidebar").hide();
	$(".containerContent .page-header h1").text(heading);
	$(".containerContent .page-content").html(content);
	showContentPage();
}

function showContentPage() {
	$(".containerContent").show();
	$(".containerCanvas").css("z-index", "-200");
	$(".containerCanvas").css("visibility", "hidden");
}

function hideContentPage() {
	$(".sidebar").show();
	$(".containerContent").hide();
	$(".containerCanvas").css("z-index", "0");
	$(".containerCanvas").css("visibility", "visible");
}

function createCyElements(jsonData) {
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

function createInput(name, key, currentValue, type, required=false) {
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

function createSelect(key, currentValue, options) {
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