function scenario(data = null) {
  	let form = $("<form class='scenarioForm'></form>")
	let heading = ""

	// EditForm
	if(data != null) {
		heading = "Edit Scenario"
		form.append(createInput("currentid","currentid", data.name, "hidden", true))
			.append(createInput("Name","name", data.name, "text", true))
			.append(createInput("Description","tags_description", data.description, "text"))
			.append("<button class='btn-success btn'>Save</button>")
	}
	// create new Scenario
	else {
		heading = "Create Scenario"
		form.append(createInput("Name","name", "", "text", true))
			.append(createInput("Description","tags_description", "", "text"))
			.append("<button class='btn-success btn'>Create</button>")
	}

	form.submit((e) => {
		e.preventDefault()
		let data = readForm(".scenarioForm")

		// CreateForm
		if(typeof data.currentid == "undefined") {
			sendEvent(
				"dataReceived", 
				{
					name: data.name,
					tags: {
						description: data.tags.description
					},
					children: []
				}
			)
		}
		// Edit Form
		else {
			sendEvent("data", {
				task: "updateScenario",
                data: data
			})
		}

		hideModal()
	})
  	
	modal(heading, form)
}
		