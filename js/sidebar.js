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

	addTag (ready) {
		this.body.html("")
		var form = $('<form class="editForm"></form>')

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
		var form = $('<form class="editForm"></form>')


		form.append(createInput("currentid", "currentid", data.name, "hidden"))

		if (data.type == 'scenario') {
			//form.append(createInput("name", "name", data.id, "text"))
			form.append(createInput("type", "type", data.type, "hidden"))
		}

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
			} else {
				form.append(createInput(key, key, value, "text"))
			}
		}

		form.append('<input type="submit" value="Save">')
		form.submit(e => {
			e.preventDefault()

			var event = new CustomEvent("updateNode", {"detail": readForm(".editForm")})
			document.dispatchEvent(event)
		})
		this.body.append(form)
	}

	addNode (pos, nodes) {
		this.body.html("")
		var form = $('<form class="editForm"></form>')
		form.append(createInput("name", "name", "", "text", true))
		form.append(createInput("type", "type", "", "text", true))
		form.append(createInput("posx", "posx", pos.x, "hidden"))
		form.append(createInput("posy", "posy", pos.y, "hidden"))

		form.append('<input type="submit" value="Add Node">')


		form.submit(e => {
			e.preventDefault()

			var event = new CustomEvent("addNode", {"detail": readForm(".editForm")})
			document.dispatchEvent(event)
		})
		this.body.append(form)
	}

	open () {
		$("body").removeClass("sidebar-closed")
	}
}