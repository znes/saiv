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

		/*if (data.type == 'scenario') {
			//form.append(createInput("name", "name", data.id, "text"))
			form.append(createInput("type", "type", data.type, "hidden"))
		}*/

		for (let [key, value] of Object.entries(data)) {
			if (key == "tags") {
				form.append('<label>Tags</label><br/>')
				if(data.type != "scenario")
					form.append('<a href="#" class="addTag">Add Tag</label><br/>')

				for (let [tagKey, tagValue] of Object.entries(data[key])) {
					form.append('<a href="#" class="removeTag">Remove ' + tagKey + '</a><br/>')
					form.append(createInput(tagKey, "tags_" + tagKey, tagValue, "text"))
				}
			} else if (key == "predecessors" || key == "successors") {
				form.append(createSelect(key, value, nodes))
				$('.js-example-basic-multiple', form).select2()
			}
			else if (key == "pos")  {
				for (let [prop, val] of Object.entries(value)) {
					if(prop == "lat") {
						form.append(createInput("Latitude", "pos_"+prop, val, "text"))
					}
					else if(prop == "long") {
						form.append(createInput("Longitude", "pos_"+prop, val, "text"))
					}
				}
			}
			else {
				form.append(createInput(key, key, value, "text"))
			}
		}


		form.find(".addTag").on("click", () => {
            this.addTag((newTag) => {
                //datam.addTag(data.name, newTag)

                sendEvent("data", {
                	task: "addTag",
                	data: {
                		id: data.name,
                		tag: newTag
                	}
                })
            })
        })


        form.find('.removeTag').on("click", function(){
            let tag = $(this).text().substring(7, $(this).text().length)

            sendEvent("data", {
            	task: "removeTag",
            	data: {
            		id: data.name,
            		tag: tag
            	}
            })
            datam.removeTag(data.name, tag)
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
		let form = $('<form class="editForm"></form>')
		form.append(createInput("name", "name", "", "text", true))
		form.append(createInput("type", "type", "", "text", true))

		for (let [property, val] of Object.entries(pos)) {
			form.append(createInput("pos_" + property, "pos_" + property, val, "hidden"))
		}
		//form.append(createInput("posy", "posy", pos.y, "hidden"))

		form.append('<input type="submit" value="Add Node">')


		form.submit(e => {
			e.preventDefault()

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