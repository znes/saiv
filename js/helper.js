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

	function hideModal() {
	    $(config.dom.modal.backdrop).removeClass("in")
	    $(config.dom.modal.container).removeClass("in")
	}

	function openSitebar () {
		globals.callSitebarTimestamp = Date.now()
		$("body").removeClass("sidebar-closed")
	}

	function closeSitebar () {
		// hack
		// map calls closeSitebar when polygone is clicked
		// if open call is called 100ms before it will not be called
		if(globals.callSitebarTimestamp + 100 < Date.now() )
			$("body").addClass("sidebar-closed")
	}

	function discardChanges(abort) {
		if(globals.unsavedChanges) {
			if(confirm('You have unsaved changes. You want to discard them?')) {
				sendEvent("discardChanges")
				globals.unsavedChanges = false
			}
			else {
				return false
			}
		}

		return true
	}


	function arrayToPolygonWkt(arr) {
		let wktText = 'POLYGON ('

	    for (var i = 0; i < arr.length; i++) {
	        arr[i].forEach( entry=> {
	            wktText += entry + " "
	        })

	        if(arr.length - 1 != i) {
	            wktText = wktText.substring(0, wktText.length)
	            wktText += ", "
	        }
	    }

	    wktText += ")"
	    return wktText
	}

	function createInput(label, key, currentValue, type, required=false, additionalTags = "") {
		let html = "<div class=\"form-group\">"

		if (type != "hidden") {
			html += '<label for="' + key + '">' + label + '</label>'
		}
		if(required) {
			html += '<input class="form-control" required type="' + type + '" id="' + key + '" name="' + key + '" ' + additionalTags +  ' value="' + currentValue + '"/>'
		}
		else {
			html += '<input class="form-control" type="' + type + '" id="' + key + '" name="' + key + '" ' + additionalTags + ' value="' + currentValue + '"/>'
		}
		html += "</div>"

		return html
	}
	function createSelect(key, currentValues, options, additionalTags = "") {
		let html = "<div class=\"form-group\">"
		html += '<label for="' + key + '">' + key + '</label>'
		html += '<select class="basic-select ' + key + '" ' + additionalTags + ' name="' + key + '">'

		options.forEach(opt => {
			let name =  opt.name ? opt.name : opt

	        if( currentValues.indexOf(name) !== -1) {
				html += '<option selected value="' + name + '">' + name + '</option>'
			} else {
				html += '<option>' + name + '</option>'
			}
		})

		html += '</select></div>'
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



	/**
	 * EXTEND SET OBJECT

	Set.prototype.isSuperset = function(subset) {
	    for (var elem of subset) {
	        if (!this.has(elem)) {
	            return false;
	        }
	    }
	    return true;
	}

	Set.prototype.union = function(setB) {
	    var union = new Set(this);
	    for (var elem of setB) {
	        union.add(elem);
	    }
	    return union;
	}

	Set.prototype.intersection = function(setB) {
	    var intersection = new Set();
	    for (var elem of setB) {
	        if (this.has(elem)) {
	            intersection.add(elem);
	        }
	    }
	    return intersection;
	}

	Set.prototype.difference = function(setB) {
	    var difference = new Set(this);
	    for (var elem of setB) {
	        difference.delete(elem);
	    }
	    return difference;
	} */
