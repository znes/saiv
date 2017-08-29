let config = {
	cytoscape: {
		defaultStyle: "cose-bilkent",
		styles: [
			"dagre",
			"circle",
			"cose-bilkent",
			"preset",
			"grid",
			"concentric",
			"breadthfirst",
			"cose"
		],
		nodeStyle: {
			polygon : {
				//weigth: 150,
				color: "#90a7d0"
			},
			volatile_generator : {
				//weigth: 30,
				color: "#f2dcde"
			},
			demand : {
				//weigth: 45,
				color: "#3f4f5e"
			},
			transmission : {
				//weigth: 25,
				color: "#d6d5da"
			},	
			hub : {
				//weigth: 45,
				color: "#86af49"
			}
		}
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
			backdrop: ".modal-backdrop",
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