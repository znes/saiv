let configNode = {
	nodesEnabled: ["transmission", "hub", "demand"],
	allowCustomTags: false,
	nodesAvailable: {
		volatile_generator : {
			color: "#f2dcde",
			geometryTypes: ["point"],
			tags: [{
				name: "installed_capacity",
				dataType: "number"
			}],
			icon: "images/icons/volatile_generator.png"
		},
		demand : {
			color: "#3f4f5e",
			geometryTypes: ["point", "polygon"],
			tags: [{
				name: "energy_amount",
				dataType: "number"
			}],
			icon: "images/icons/demand.png"
		},
		transmission : {
			color: "#d6d5da",
			geometryTypes: ["line", "polygon"],
			tags: [{
				name: "capacity",
				dataType: "number"
			}, {
				name: "efficiency",
				dataType: "number"
			}],
			icon: "images/icons/transmission.png"
		},
		hub : {
			color: "#86af49",
			geometryTypes: ["point", "line", "polygon"],
			tags: [{
				name: "sector",
				dataType: "text"
			}],
			icon: "images/icons/hub.png"
		}
	}
}
