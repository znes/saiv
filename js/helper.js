function setActiveMenuItem(href) {
	$(".navbar-nav .active").removeClass("active")
	$("a[href='#"+href+"']").parent("li").attr("class", "active")
}

function createContentPage(heading, content) {
	$(config.dom.sidebar).hide()
	$(config.dom.content.heading).text(heading)
	$(config.dom.content.body).html(content)
	showContentPage()
}

function showContentPage() {
	$(config.dom.content.container).show()
	$("#"+config.dom.mapContainerId).css("visibility", "hidden")
	$(config.dom.canvasContainer).css("visibility", "hidden")
	$(config.dom.sidebar).hide()
}

function showGraph() {
	$(config.dom.sidebar).show()
	$(config.dom.content.container).hide()
	$("#"+config.dom.mapContainerId).css("visibility", "hidden")
	$(config.dom.canvasContainer).css("visibility", "visible")
}

function showMap() {
	$(config.dom.content.container).hide()
	$(config.dom.canvasContainer).css("visibility", "hidden")
	$(config.dom.sidebar).show()
	$("#"+config.dom.mapContainerId).css("visibility", "visible")
}

function createInput(label, key, currentValue, type, required=false) {
	let html = ""
	
	if (type != "hidden") {
		html += '<label for="' + key + '">' + label + '</label>'
	}
	if(required) {
		html += '<input required type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>'
	}
	else {
		html += '<input type="' + type + '" id="' + key + '" name="' + key + '" value="' + currentValue + '"/>'
	}

	return html
}
function createSelect(key, currentValues, options, additionalTags = "multiple=\"multiple\"") {
	let html = ""
	html += '<label for="' + key + '">' + key + '</label>'
	html += '<select class="js-example-basic-multiple ' + key + '" ' + additionalTags + ' name="' + key + '">'

	options.forEach(opt => {
		let name =  opt.name ? opt.name : opt

        if( currentValues.indexOf(name) !== -1) {
			html += '<option selected value="' + name + '">' + name + '</option>'
		} else {
			html += '<option>' + name + '</option>'
		}	
	})
	
	html += '</select>'
	return html
}

function readForm (form) {
    let formData = {}
    $(form).serializeArray().forEach(field => {
    	if (field.name.substring(0, 5) == "tags_") {
            if (typeof(formData.tags) === "undefined") formData.tags = {}

            formData.tags[field.name.substring(5, field.name.length)] = field.value
        }
        else if (field.name == "predecessors" || field.name == "successors") {
        	formData[field.name] = $( form + " [name=\"" + field.name + "\"]").val()
        }
        else if(field.name.substring(0, 4) == "pos_") {
        	if (typeof(formData.pos) === "undefined") formData.pos = {}

        	formData.pos[field.name.substring(4, field.name.length)] = field.value
        }
        else {
            formData[field.name] = field.value
        }
    })


    $(form + " select").val(function( index, value ) {
    	if(this.name != "")
        	formData[this.name] = value
    })

    return formData
}

function sendEvent (name, data) {
	let event = new CustomEvent(name, {"detail": data})
	document.dispatchEvent(event)
}