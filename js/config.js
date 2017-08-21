let config = {
	cytoscape: {
		defaultStyle: "dagre",
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
	types : [
		"polygon",
		"volatile_generator",
		"demand",
		"transmission",
		"hub"
	],
	dom: {
		canvasContainer: ".containerCanvas",
		mapContainerId: "map",
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
			graph: ".navbar .shoWExplorer",
			jsonSetting: ".jsonSettings",
			map: ".showMap",
			download: ".navbar .downloadJson"
		},
		modal: {
			container: ".modal",
			heading: ".modal .modal-header h2",
			body: ".modal .modal-body"
		}
	},
	markerSettings: {
		src: "css/images/marker-icon-2x.png",
		width: 25,
		height: 41
	}
}