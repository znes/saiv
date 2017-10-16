let config = {
	cytoscape: {
		defaultStyle: "cose-bilkent",
		styles: [
			"circle",
			"grid",
			"breadthfirst",
			"cose"
		]
	},
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
			scenario: ".scenarioSetting",
			map: ".showMap",
			download: ".navbar .downloadJson",
			nodeSettings: ".nodeSettings"
		},
		modal: {
			container: ".modal",
			backdrop: ".modal-backdrop",
			heading: ".modal .modal-header h3",
			body: ".modal .modal-body"
		}
	},
	markerSettings: {
		src: "css/images/marker-icon-2x.png",
		width: 25,
		height: 41
	}
}
