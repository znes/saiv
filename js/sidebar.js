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
		this.open()
		this.head.html(JSON.stringify(data))
	}

	show($head, $body) {
		this.open()
		this.head.html("").append($head)
		this.body.html("").append($body)
	}

	addTag (ready) {
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

		form.find("a.cancelForm").on("click", (e) => {
			ready(false)
			return false
		})

		this.body.append(form)
	}

	createNodeForm (data, nodes) {
		this.open()
		this.head.html("<h4>Update " + data.name + "</h4>")
		this.body.html("")
		let form = $('<form class="editForm"></form>')

		form.append(createInput("currentid", "currentid", data.name, "hidden"))
			.append(createInput("Name", "name", data.name, "text"))
			.append(createSelect("type", data.type, configNode.nodesAvailable))

			.append('<h5>Tags <small><a href="#" class="addTag">Add Tag</a></small></h5>')

		if(typeof data.tags != "undefined") {
			for (let [key, value] of Object.entries(data.tags)) {
				//form.append('<button class="removeTag btn">&times;</button>')
				let input = $("<div class=\"input-group\"></div>")
				input.append('<input class="form-control" type="text" name="tags_' + key + '" value="' + value + '"></input>')
					.append('<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>')
				form.append('<label for="tags_'+key+'">' + key + '</label>')
					.append(input)
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
            	if(typeof newTag == "string") {
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


	addNode (pos) {
		this.open()
		this.head.html("Add Node")
		this.body.html("")


		let form = $('<form class="editForm"></form>')
		form.append(createInput("name", "name", "", "text", true))
		form.append(createSelect("type", "", config.types, "required"))

		for (let [property, val] of Object.entries(pos)) {
			form.append(createInput("pos_" + property, "pos_" + property, val, "hidden"))
		}
		//form.append(createInput("posy", "posy", pos.y, "hidden"))

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

		this.body.append(form)
	}

	open () {
		globals.callSitebarTimestamp = Date.now()
		$("body").removeClass("sidebar-closed")
	}

	close () {
		// hack
		// map calls closeSitebar when polygone is clicked
		// if open call is called 100ms before it will not be called
		if(globals.callSitebarTimestamp + 100 < Date.now() )
			$("body").addClass("sidebar-closed")
	}
}