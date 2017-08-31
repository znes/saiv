let configNode = {
	nodesEnabled: ["volatile_generator", "transmission", "hub"],
	allowCustomTags: false,
	nodesAvailable: {
		volatile_generator : {
			//weigth: 30,
			color: "#f2dcde",
			geometryTypes: ["point"],
			tags: ["installed_capacity"],
			icon: "volatile_generator.svg"
		},
		demand : {
			//weigth: 45,
			color: "#3f4f5e",
			geometryTypes: ["point", "polygon"],
			tags: ["energy_amount"],
			icon: "demand.svg"
		},
		transmission : {
			//weigth: 25,
			color: "#d6d5da",
			geometryTypes: ["line", "polygon"],
			tags: ["capacity", "efficiency"],
			icon: "transmission.svg"
		},	
		hub : {
			//weigth: 45,
			color: "#86af49",
			geoemtryTypes: ["point", "line", "polygon"],
			tags: ["sector"],
			icon: "hub.svg"
		}
	}
}
