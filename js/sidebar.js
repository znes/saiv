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
		this.body.html("")
		let form = $('<form class="editForm"></form>')

		form.append(createInput("Tag name", "tag", "", "text", true))
		form.append('<input type="submit" value="Save">')

		form.submit((e) => {
			e.preventDefault()
			ready(readForm(".editForm").tag)
		})

		this.body.append(form)
	}

	createForm (data, nodes) {
		this.body.html("")
		let form = $('<form class="editForm"></form>')

		form.append(createInput("currentid", "currentid", data.name, "hidden"))


		for (let [key, value] of Object.entries(data)) {
			if (key == "tags") {
				form.append('<label>Tags</label><br/>')
				form.append('<a href="#" class="addTag">Add Tag</label><br/>')

				for (let [tagKey, tagValue] of Object.entries(data[key])) {
					form.append('<a href="#" class="removeTag">Remove ' + tagKey + '</a><br/>')
					form.append(createInput(tagKey, "tags_" + tagKey, tagValue, "text"))
				}
			} else if (key == "predecessors" || key == "successors") {
				form.append(createSelect(key, value, nodes, "multiple=\"multiple\""))
				$('.basic-select', form).select2()
			}
			else if (key == "pos")  {
				for (let [prop, val] of Object.entries(value)) {
					if(prop == "lat") {
						form.append(createInput("Latitude", "pos_"+prop, val, "number"))
					}
					else if(prop == "lng") {
						form.append(createInput("Longitude", "pos_"+prop, val, "number"))
					}
				}
			}
			else if(key == "type") {
				form.append(createSelect("type", value, config.types))
			}
			else {
				form.append(createInput(key, key, value, "text"))
			}
		}


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


		form.append('<input type="submit" value="Save">')
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