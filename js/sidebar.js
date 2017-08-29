class Sidebar{
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


	showData (data) {
		//this.open()
		this.head.html(JSON.stringify(data))
	}

	show($head, $body) {
		//this.open()
		this.head.html("").append($head)
		this.body.html("").append($body)
	}

	addTag (ready) {
		this.head.html("").append("<h4>Add Tag</h4>")
		this.body.html("")
		let form = $('<form class="editForm"></form>')

		form.append(createInput("Tag name", "tag", "", "text", true))
		form.append('<button class="btn btn-success">Add</button>')

		form.submit((e) => {
			e.preventDefault()
			ready(readForm(".editForm").tag)
		})

		this.body.append(form)
	}

	createNodeForm (data, nodes) {
		this.head.html("<h4>Update " + data.name + "</h4>")
		this.body.html("")
		let form = $('<form class="editForm"></form>')

		form.append(createInput("currentid", "currentid", data.name, "hidden"))
			.append(createInput("Name", "name", data.name, "text"))
			.append(createSelect("type", data.type, config.types))
			.append('<h5>Tags</h5>')
			.append('<a href="#" class="addTag">Add Tag</label><br/>')

		if(typeof data.tags != "undefined") {
			for (let [key, value] of Object.entries(data.tags)) {
				form.append('<a href="#" class="removeTag">Remove ' + key + '</a><br/>')
					.append(createInput(key, "tags_" + key, value, "text"))
			}
		}

		form.append(createSelect("predecessors", data.predecessors, nodes.filter(node=> {return node != data.name}), "multiple=\"multiple\""))
			.append(createSelect("successors", data.successors, nodes.filter(node=> {return node != data.name}), "multiple=\"multiple\""))



		for (let [key, value] of Object.entries(data)) {
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
		}


		$('.basic-select', form).select2()

		form.find(".addTag").on("click", () => {
            this.addTag((newTag) => {
                sendEvent("data", {
                	task: "addTag",
                	data: {
                		id: data.name,
                		tag: newTag
                	}
                })


                sendEvent("sidebar", {
                    task: "showId",
                    data: data.name
                })
            })
        })


        form.find('.removeTag').on("click", function() {
            let tag = $(this).text().substring(7, $(this).text().length)

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
            //datam.removeTag(data.name, tag)
        })

        form.append('<button class="btn btn-success">Save</button>')
		//form.append('<input type="submit" value="Save">')
		form.submit(e => {
			e.preventDefault()

			let test = readForm('.editForm')
			
			//console.log(test)
			
			sendEvent("data", {
				task: "updateNode",
				data: test
			})
		})
		this.body.append(form)
	}


	addNode (pos) {
		this.body.html("")
		globals.unsavedChanges = true
		let form = $('<form class="editForm"></form>')
		form.append(createInput("name", "name", "", "text", true))
		form.append(createSelect("type", "", config.types, ""))

		for (let [property, val] of Object.entries(pos)) {
			form.append(createInput("pos_" + property, "pos_" + property, val, "hidden"))
		}
		//form.append(createInput("posy", "posy", pos.y, "hidden"))

		form.append('<input type="submit" value="Add Node">')


		form.submit(e => {
			e.preventDefault()
			globals.unsavedChanges = false

			sendEvent("data", {
				task: "addNode",
				data: readForm(".editForm")
			})
		})
		this.body.append(form)
	}

	open () {
		$("body").removeClass("sidebar-closed")
	}
}