class Sidebar {
  /*(function init (){

  	$(".sidebar-toggle").on("click", function() {
          $("body").toggleClass("sidebar-closed")
          cy.resize()
      })

  })()*/
  constructor(selector) {
    this.container = $(selector)
    this.head = $('<div class="head"></div>')
    this.body = $('<div class="body"></div>')
    this.container.append(this.head);
    this.container.append(this.body);


  }

  showData(data) {
    this.open()
    this.head.html(JSON.stringify(data))
  }

  show($head, $body) {
    this.open()
    this.head.html("").append($head)
    this.body.html("").append($body)
  }

  addTag(ready) {
    this.open()
    this.head.html("").append("<h4>Add Tag</h4>")
    this.body.html("")
    let form = $('<form class="editForm"></form>')

    form.append(createInput("Tag name", "tag", "", "text", true))
      .append('<button class="btn btn-success">Add</button>')
      .append('<a class="btn btn-warning cancelForm pull-right">Cancel</button>')

      .submit((e) => {
        e.preventDefault()
        ready(readForm(".editForm").tag)
      })
      .find("a.cancelForm")
      .on("click", (e) => {
        ready(false)
        return false
      })

    this.body.append(form)
  }

  updateNodeForm(data, nodes) {
    this.open()
    this.head.html("<h4>Update " + data.name + "</h4>")
    this.body.html("")
    let form = $('<form class="editForm"></form>')

    form.append(createInput("currentId", "currentId", data.name, "hidden"))
      .append(createInput("Name", "name", data.name, "text"))
      .append(createSelect("type", [data.type], Object.keys(configNode.nodesAvailable).map((k) => k)))



    if (typeof data.geometry_type != "undefined")
      form.append(createSelect("geometry_type", [data.geometry_type], configNode.nodesAvailable[data.type].geometryTypes))
    else
      form.append(createSelect("geometry_type", [], configNode.nodesAvailable[data.type].geometryTypes))


    form.append(this.createTags(data.tags, data.type))


    form.append(createSelect("predecessors", data.predecessors, nodes.filter(node => {
        return node != data.name
      }), "multiple=\"multiple\""))
      .append(createSelect("successors", data.successors, nodes.filter(node => {
        return node != data.name
      }), "multiple=\"multiple\""))



    /*for (let [key, value] of Object.entries(data)) {
    	if (key != "tags" && key != "name" && key != "type" && key != "predecessors" && key != "successors") {
    		if (key == "pos")  {
    			for (let [prop, val] of Object.entries(value)) {
    				if(prop == "lat") {
    					form.append(createInput("Latitude", "pos_"+prop, val, "number"))
    				}
    				else if(prop == "lng") {
    					form.append(createInput("Longitude", "pos_"+prop, val, "number"))
    				}
    			}
    		}
    		else {
    			form.append(createInput(key, key, value, "text"))
    		}
    	}
    }*/


    $('.basic-select', form).select2()


    form.find(".addTag").on("click", () => {
      this.addTag((newTag) => {
        if (typeof newTag == "string") {
          sendEvent("data", {
            task: "addTag",
            data: {
              id: data.name,
              tag: newTag
            }
          })
        }

        sendEvent("sidebar", {
          task: "showId",
          data: data.name
        })
      })
    })


    // listen to changes of type
    // geometry type according to it
		this.updateGeometryTypeOnTypeChange(form)

		// update tags
		if (!configNode.allowCustomTags) {
			form.find("select[name='type']").on('change', e => {
				form.find('.formTags').replaceWith(this.createTags(data.tags, form.find('select[name="type"]').val()))
			})
		}


    form.find('.removeTag').on("click", function() {
      const inputName = $(this).parent().parent().find("input").prop("name")
      let tag = inputName.substring(5, inputName.length)

      sendEvent("data", {
        task: "removeTag",
        data: {
          id: data.name,
          tag: tag
        }
      })

      sendEvent("sidebar", {
        task: "showId",
        data: data.name
      })
    })

    form.append('<button class="btn btn-success">Save</button>')
    form.append('<a class="btn btn-warning cancelForm pull-right">Cancel</a>')
    form.submit(e => {
      e.preventDefault()
      let test = readForm('.editForm')


      sendEvent("data", {
        task: "updateNode",
        data: test
      })

      this.close()
    })
    form.find("a.cancelForm").on("click", (e) => {
      this.close()
      return false
    })

    this.body.append(form)
  }


  createTags(tags, type) {
    let div = $("<div class='formTags form-group'></div>")

    if (configNode.allowCustomTags)
      div.append('<h5>Tags <small><a href="#" class="addTag">Add Tag</a></small></h5>')
    else
      div.append('<h5>Tags</h5>')


    if (!configNode.allowCustomTags) {
      configNode.nodesAvailable[type].tags.forEach(tag => {
        let input = $("<div class=\"input-group\"></div>")
        if (typeof tags[tag.name] != "undefined") {
          input.append('<input class="form-control" type="' + tag.type + '" name="tags_' + tag.name + '" value="' + tags[tag.name] + '"></input>')
        } else {
          input.append('<input class="form-control" type="' + tag.type + '" name="tags_' + tag.name + '" value=""></input>')
        }
        div.append('<label for="tags_' + tag.name + '">' + tag.name + '</label>')
          .append(input)
      })
    } else {
      for (let [key, value] of Object.entries(tags)) {
        let input = $("<div class=\"input-group\"></div>")
        input.append('<input class="form-control" type="text" name="tags_' + key + '" value="' + value + '"></input>')

        input.append('<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>')

        div.append('<label for="tags_' + key + '">' + key + '</label>')
          .append(input)
      }
    }

    return div
  }


  addNode(pos) {
    this.open()
    this.head.html("Add Node")
    this.body.html("")


    let form = $('<form class="editForm"></form>')
    form.append(createInput("name", "name", "", "text", true))
    form.append(createSelect("type", [configNode.nodesEnabled], configNode.nodesEnabled, "required"))
		form.append(createSelect("geometry_type", [], configNode.nodesAvailable[configNode.nodesEnabled[0]].geometryTypes))

    for (let [property, val] of Object.entries(pos)) {
      form.append(createInput("pos_" + property, "pos_" + property, val, "hidden"))
    }

    form.append('<button class="btn btn-success">Add</button>')
    form.append('<a class="btn btn-warning pull-right">Cancel</button>')

    $('.basic-select', form).select2()

    form.submit(e => {
      e.preventDefault()

      sendEvent("data", {
        task: "addNode",
        data: readForm(".editForm")
      })
    })
    form.find(".btn-warning").on("click", e => {
      this.close()
    })

		// listen to changes of type
    // update tags and geometry type according to it
		this.updateGeometryTypeOnTypeChange(form)

    this.body.append(form)
  }

  open() {
    openSitebar()
  }

  close() {
    closeSitebar()
  }


	updateGeometryTypeOnTypeChange(form) {
		form.find("select[name='type']").on('change', e => {
      let currentType = form.find('select[name="type"]').val()

      // update geometric types to select
      form.find('label[for="geometry_type"]').parent().replaceWith(createSelect("geometry_type", [currentType], configNode.nodesAvailable[e.target.value].geometryTypes))
      $('select[name="geometry_type"]', form).select2({
        width: '100%'
      })
    })
	}
}
