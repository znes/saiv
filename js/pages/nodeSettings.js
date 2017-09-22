function nodeSettings() {
  	let form = $("<form class='nodeSettingsForm'></form>")
	let heading = "Node Settings"

	form.append(createSelect("Nodes enabled", configNode.nodesEnabled, Object.keys(configNode.nodesAvailable), "multiple=\"multiple\""))

	if(configNode.allowCustomTags == true)
	{
		form.append('<div class="form-group"><label for="allowCustomTags">Allow custom Tags</label><input checked class="" type="checkbox" name="allowCustomTags"></div>')
	}
	else {
		form.append('<div class="form-group"><label for="allowCustomTags">Allow custom Tags</label><input class="" type="checkbox" name="allowCustomTags"></div>')
	}

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

        if(typeof formData.allowCustomTags != "undefined") {
			configNode.allowCustomTags = true
		} 
		else {
			configNode.allowCustomTags = false
		}


		hideModal()
	})

	$('select', form).select2({width: "100%"})
	modal(heading, form)
}
