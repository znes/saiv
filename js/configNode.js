let configNode = {
	nodesEnabled: ["transmission", "hub", "demand"],
	allowCustomTags: false,
	nodesAvailable: {
		volatile_generator : {
			color: "#f2dcde",
			geometryTypes: ["point"],
			tags: [{
				name: "installed_capacity",
				type: "number"
			}],
			icon: "https://cdn.rawgit.com/energiekollektiv/saiv/dev/images/icons/volatile_generator.png"
		},
		demand : {
			color: "#3f4f5e",
			geometryTypes: ["point", "polygon"],
			tags: [{
				name: "energy_amount",
				type: "number"
			}],
			icon: "https://cdn.rawgit.com/energiekollektiv/saiv/dev/images/icons/demand.png"
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
			icon: "https://cdn.rawgit.com/energiekollektiv/saiv/dev/images/icons/transmission.png"
		},	
		hub : {
			color: "#86af49",
			geometryTypes: ["point", "line", "polygon"],
			tags: [{
				name: "sector",
				type: "text"
			}],
			icon: "https://cdn.rawgit.com/energiekollektiv/saiv/dev/images/icons/hub.png"
		}
	}
}
