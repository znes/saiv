function selectStyle() {
	var currentStyle = localStorage.getItem("style") ? localStorage.getItem("style") : config.cytoscape.styles[0]
	var form = $('<form class="editStyle"></form>')


	form.append(createSelect("style", [currentStyle], config.cytoscape.styles, ""))


	form.append('<input type="submit" value="Save">')
	form.submit(e => {
		e.preventDefault()
		var data = readForm(".editStyle")

		localStorage.setItem("style", data.style)

		sendEvent("explorer", {
			task: "updateStyle"
		})
	})

	createContentPage("Set Explorer Styles", form )
	setActiveMenuItem("setStyle")
}