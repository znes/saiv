function setActiveMenuItem(href) {
	$(".navbar-nav .active").removeClass("active")
	$("a[href='#"+href+"']").parent("li").attr("class", "active")
}

function createContentPage(heading, content) {
	$(".sidebar").hide()
	$(".containerContent .page-header h1").text(heading)
	$(".containerContent .page-content").html(content)
	showContentPage()
}

function showContentPage() {
	$(".containerContent").show()
	$(".containerCanvas").css("visibility", "hidden")
}

function hideContentPage() {
	$(".sidebar").show()
	$(".containerContent").hide()
	$(".containerCanvas").css("visibility", "visible")
}

function createCyElements(jsonData) {
	var eles = []

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
	})

	jsonData.children.forEach(child => {
		eles.push({
			group: "nodes",
			data: {
				id: child.name,
				data: child
			}
		})
	})

	// Add edges when nodes loaded
	// Only add Successors 
	jsonData.children.forEach(child => {
		child.successors.forEach(succ => {
			eles.push({
				data: {
					source: child.name,
					target: succ
				},
				group: "edges"
			})
		})
	})

	return eles
}

function createInput(name, key, currentValue, type, required=false) {
	var html = ""
	
	if (type != "hidden") {
		html += '<label for="' + key + '">' + name + '</label>'
	}
	if(required) {
		html += '<input required type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>'
	}
	else {
		html += '<input type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>'
	}

	return html
}

function createSelect(key, currentValues, options) {
	var html = ""
	html += '<label for="' + key + '">' + key + '</label>'
	html += '<select class="js-example-basic-multiple ' + key + '" multiple="multiple" name="' + key + '">'

	options.forEach(opt => {
		var optData = opt.data();

        if( currentValues.indexOf(optData.id) !== -1) {
			html += '<option selected value="' + optData.id + '">' + optData.id + '</option>'
		} else {
			html += '<option>' + optData.id + '</option>'
		}
	})
	
	html += '</select>'
	return html
}