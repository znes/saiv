function nodeSettings() {
  	let form = $("<form class='nodeSettingsForm'></form>")
	let heading = "Node Settings"

	form.append(createSelect("Nodes enabled", configNode.nodesEnabled, Object.keys(configNode.nodesAvailable), "multiple=\"multiple\""))

	form.append('<button class="btn btn-success">Save</button>')


	form.submit((e) => {
		e.preventDefault()
		let formData = readForm(".nodeSettingsForm")

		// Update Nodes Enabled
		if(configNode.nodesEnabled.toString() !== formData["Nodes enabled"].toString()) {
			sendEvent("data", {
	          task: "updateNodesEnabled",
	          data: formData["Nodes enabled"]
	        })
        }

		hideModal()
	})

	$('select', form).select2({width: "100%"})
	modal(heading, form)
}
