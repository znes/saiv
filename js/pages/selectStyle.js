function selectStyle() {
	let currentStyle = localStorage.getItem("style") ? localStorage.getItem("style") : config.cytoscape.defaultStyle
	let form = $('<form class="editStyle"></form>')


	form.append(createSelect("style", [currentStyle], config.cytoscape.styles))


	form.append('<button class="btn btn-success">Save</button>')
	form.submit(e => {
		e.preventDefault()
		let data = readForm(".editStyle")

		localStorage.setItem("style", data.style)

		sendEvent("dataChanged", {
			task: "updateStyle"
		})
	})

	modal("Set Explorer Styles", form )
	setActiveMenuItem("setStyle")
}