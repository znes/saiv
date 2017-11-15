	function setActiveMenuItem(linkClass) {
	  $(".navbar-nav .active").removeClass("active")
	  $(linkClass).parent("li").attr("class", "active")
	}

	function createContentPage(heading, content) {
	  $(config.dom.sidebar).hide()
	  $(config.dom.content.heading).text(heading)
	  $(config.dom.content.body).html(content)


	  $(".contentPage").css("visibility", "hidden")
	  $(config.dom.content.container).css("visibility", "visible")
	}

	function discardChanges(abort) {
	  if (globals.unsavedChanges) {
	    if (confirm('You have unsaved changes. You want to discard them?')) {
	      sendEvent("discardChanges")
	      globals.unsavedChanges = false
	    } else {
	      return false
	    }
	  }

	  return true
	}


	function createCollapseEle(mainId, bodyId, heading = "", body = "") {
	  let div = $(`<div class="form-group panel-group"  id="${mainId}" role="tablist"></div>`)
	  let headerBar = $('<div class="panel panel-default"><div class="panel-heading" role="tab" id="tagsPanel"></div></div>')

	  headerBar.find("#tagsPanel")
	    .append(`<h4 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#${mainId}" href="#${bodyId}" aria-expanded="false" aria-controls="collapseOne">${heading}</a></h4>`)

	  let tabBody = $(`<div id="${bodyId}" class="panel-collapse collapse" role="tabpanel" aria-expanded="false" aria-labelledby="tagsPanel"><div class="panel-body">${body}</div></div>`)


	  div.append(headerBar)
	    .append(tabBody)
	  return div
	}



	function roundLatLng(obj = {}) {
	  let pos = {}
	  if (obj.lat) {
	    pos.lat = Number(obj.lat).toFixed(4)
	  }
	  if (obj.lng) {
	    pos.lng = Number(obj.lng).toFixed(4)
	  }
	  return pos
	}


	function arrayToPolygonWkt(arr) {
	  let wktText = 'POLYGON ('

	  for (var i = 0; i < arr.length; i++) {
	    arr[i].forEach(entry => {
	      wktText += entry + " "
	    })

	    if (arr.length - 1 != i) {
	      wktText = wktText.substring(0, wktText.length)
	      wktText += ", "
	    }
	  }

	  wktText += ")"
	  return wktText
	}

	function arrayToPolylineWkt(arr) {
	  let wktText = 'LINESTRING ('

	  for (var i = 0; i < arr.length; i++) {
	    arr[i].forEach(entry => {
	      wktText += entry + " "
	    })

	    if (arr.length - 1 != i) {
	      wktText = wktText.substring(0, wktText.length)
	      wktText += ", "
	    }
	  }

	  wktText += ")"
	  return wktText
	}

	function createInput(label, key, currentValue, type, required = false, additionalTags = "") {
	  let html = "<div class=\"form-group\">"

	  if (type != "hidden") {
	    html += '<label for="' + key + '">' + label + '</label>'
	  }
	  if (required) {
	    html += '<input class="form-control" required type="' + type + '" id="' + key + '" name="' + key + '" ' + additionalTags + ' value="' + currentValue + '"/>'
	  } else {
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
	    let name = opt.name ? opt.name : opt

	    if (currentValues.indexOf(name) !== -1) {
	      html += '<option selected value="' + name + '">' + name + '</option>'
	    } else {
	      html += '<option>' + name + '</option>'
	    }
	  })

	  html += '</select></div>'
	  return html
	}

	function readForm(form) {
	  let formData = {}
	  $(form).serializeArray().forEach(field => {
	    if (field.name.substring(0, 5) == "tags_") {
	      if (typeof(formData.tags) === "undefined") formData.tags = {}

	      formData.tags[field.name.substring(5, field.name.length)] = field.value.trim()
	    } else if (field.name == "predecessors" || field.name == "successors") {
	      formData[field.name] = $(form + " [name=\"" + field.name + "\"]").val()
	    } else if (field.name.substring(0, 4) == "pos_") {
	      if (typeof(formData.pos) === "undefined") formData.pos = {}

	      formData.pos[field.name.substring(4, field.name.length)] = field.value
	    } else {
	      formData[field.name] = field.value.trim()
	    }
	  })


	  $(form + " select").val(function(index, value) {
	    if (this.name != "") {
	      formData[this.name] = value
	    }
	  })

	  return formData
	}

	function sendEvent(name, data) {
	  let event = new CustomEvent(name, {
	    "detail": data
	  })
	  document.dispatchEvent(event)
	}


	function csvToObj(csv, _i, _x, _y) {
	  var lines = csv.split(/\r?\n/);
	  console.log("count lines", lines.length)

	  var result = [];

	  var headers = lines[2].split(",");
	  result.push(headers)

	  for (var i =0; i < lines.length; i++) {
	    var currentline = lines[i].split(",");
	    result.push(currentline)
	  }

	  return result;
	}

	function convertToPlotly(data, xIndex = 0, yIndex = 1) {
	  let plotly = {
	    x: getArrayRowEntrys(data,xIndex),
	    y: getArrayRowEntrys(data,yIndex),
	    type: "bar"
	  }

	  return [plotly]
	}

	function sidebarShowId(id) {
		sendEvent("sidebar", {
			task: "showId",
			data: id
		})
	}

	function getArrayRowEntrys(arr, r) {
		let result = []
		for (var i = 0; i < arr.length; i++) {
			result.push(arr[i][r])
		}
		return result
	}

	function shortString(string, length = 15) {;
		if(string)
			return string.length > length ? string.substring(0, length - 3) + "..." : string;
		else
			return "undefined"
	}
