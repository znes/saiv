var config = {
	cytoscape: {
		styles: [
			"dagre",
			"circle",
			"cose-bilkent",
			"preset",
			"grid",
			"concentric",
			"breadthfirst",
			"cose"
		]
	},
	dom: {
		canvasContainer: ".containerCanvas",
		content: {
			container: ".containerContent",
			heading: ".containerContent .page-header h1",
			body: ".containerContent .page-content"
		},
		sidebar: ".sidebar",
		links: {
			json: ".changeJson",
			home: ".home",
			style: ".styleSettings",
			jsonSetting: ".jsonSettings"
		},
		modal: {
			container: ".modal",
			heading: ".modal .modal-header h2",
			content: ".modal .modal-body"
		}
	}
}