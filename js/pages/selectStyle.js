function selectStyle() {
	let currentStyle = localStorage.getItem("style") ? localStorage.getItem("style") : config.cytoscape.defaultStyle
	let form = $('<form class="editStyle"></form>')


	form.append(createSelect("style", [currentStyle], config.cytoscape.styles, ""))


	form.append('<input type="submit" value="Save">')
	form.submit(e => {
		e.preventDefault()
		let data = readForm(".editStyle")

		localStorage.setItem("style", data.style)

		sendEvent("dataChanged", {
			task: "updateStyle"
		})
	})

	createContentPage("Set Explorer Styles", form )
	setActiveMenuItem("setStyle")
}