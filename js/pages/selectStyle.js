function selectStyle() {
	let currentStyle = localStorage.getItem("style") ? localStorage.getItem("style") : config.cytoscape.defaultStyle
	let currentKeepExplorerPosition = localStorage.getItem("keepExplorerPosition") ? localStorage.getItem("keepExplorerPosition") : globals.keepExplorerPosition
	let form = $('<form class="editStyle"></form>')


	form.append(createSelect("style", [currentStyle], config.cytoscape.styles))

	console.log(currentKeepExplorerPosition)
	if(currentKeepExplorerPosition == "true")
	{
		form.append('<div class="form-group"><label for="keepExplorerPosition">Keep Explorer Postions after adding Elements</label><input checked class="form-control" type="checkbox" name="keepExplorerPosition"></div>')
	}
	else {
		form.append('<div class="form-group"><label for="keepExplorerPosition">Keep Explorer Postions after adding Elements</label><input class="form-control" type="checkbox" name="keepExplorerPosition"></div>')

	}


	form.append('<button class="btn btn-success">Save</button>')
	form.submit(e => {
		e.preventDefault()
		let data = readForm(".editStyle")
		if(typeof data.keepExplorerPosition != "undefined") {
			globals.keepExplorerPosition = "true"
		} 
		else {
			globals.keepExplorerPosition = "false"
		}
		console.log(globals)
		localStorage.setItem("style", data.style)
		localStorage.setItem("keepExplorerPosition", globals.keepExplorerPosition)

		sendEvent("dataChanged", {
			task: "updateStyle"
		})

		hideModal()
	})

	modal("Set Explorer Styles", form )
	setActiveMenuItem("setStyle")
}