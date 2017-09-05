let configNode = {
	nodesEnabled: ["volatile_generator", "transmission", "hub"],
	allowCustomTags: false,
	nodesAvailable: {
		volatile_generator : {
			color: "#f2dcde",
			geometryTypes: ["point"],
			tags: [{
				name: "installed_capacity",
				type: "number"
			}],
			icon: "volatile_generator.svg"
		},
		demand : {
			color: "#3f4f5e",
			geometryTypes: ["point", "polygon"],
			tags: [{
				name: "energy_amount",
				type: "number"
			}],
			icon: "demand.svg"
		},
		transmission : {
			color: "#d6d5da",
			geometryTypes: ["line", "polygon"],
			tags: [{
				name: "capacity",
				type: "number"
			}, {
				name: "efficiency",
				type: "number"
			}],
			icon: "transmission.svg"
		},	
		hub : {
			color: "#86af49",
			geometryTypes: ["point", "line", "polygon"],
			tags: [{
				name: "sector",
				type: "text"
			}],
			icon: "hub.svg"
		}
	}
}
