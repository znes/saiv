export let globals = {
	unsavedChanges: false,
	autoLayout: "false",
	callSitebarTimestamp: 0,
	showPredAndSuccOnMap: true
}
export let config = {
	cytoscape: {
		defaultStyle: "grid",
		styles: [
			"preset",
			"circle",
			"concentric",
			"grid",
			"breadthfirst",
			"cose"
		],
		styleConfig: [{
			selector: "node",
			style: {
				"content": "data(id)",
				"text-opacity": 0.7
			}
		}, {
			selector: "edge",
			style: {
				"target-arrow-shape": "triangle",
				"line-color": "#9dbaea",
				"target-arrow-color": "#9dbaea",
				"curve-style": "bezier"
			}
		}, {
			selector: "#shadowEdge",
			style: {
				"line-color": "rgba(0, 0, 0, 0.50)",
				"target-arrow-color": "rgba(0, 0, 0, 0.50)"
			}
		}, {
			selector: "core",
			style: {
				'active-bg-size': 0,
				'selection-box-border-width': 0,
				'active-bg-opacity': 0,
				'active-bg-color': 'red',
				'selection-box-opacity': 0,
				'selection-box-color': 'red'
			}
		}, {
			selector: ":selected",
			style: {
				'border-width': 1,
				'border-color': "#000"
			}
		}]
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
			graph: ".navbar .showExplorer",
			scenario: ".scenarioSetting",
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
	nodes: {
		nodesEnabled: ["transmission", "hub", "demand"],
		allowCustomTags: false,
		nodesAvailable: {
			volatile_generator: {
				color: "#f2dcde",
				tags: ["installed_capacity"],
				icon: "images/icons/volatile_generator.png"
			},
			demand: {
				color: "#3f4f5e",
				tags: ["energy_amount"],
				icon: "images/icons/demand.png"
			},
			transmission: {
				color: "#d6d5da",
				tags: ["capacity", "efficiency"],
				icon: "images/icons/transmission.png"
			},
			hub: {
				color: "#86af49",
				tags: ["sector"],
				icon: "images/icons/hub.png"
			}
		}
	}
}
