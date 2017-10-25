let configNode = {
  nodesEnabled: ["transmission", "hub", "demand"],
  allowCustomTags: false,
  nodesAvailable: {
    volatile_generator: {
      color: "#f2dcde",
      geometryTypes: ["point"],
      tags: ["installed_capacity"],
      icon: "images/icons/volatile_generator.png"
    },
    demand: {
      color: "#3f4f5e",
      geometryTypes: ["point", "polygon"],
      tags: ["energy_amount"],
      icon: "images/icons/demand.png"
    },
    transmission: {
      color: "#d6d5da",
      geometryTypes: ["line", "polygon"],
      tags: ["capacity", "efficiency"],
      icon: "images/icons/transmission.png"
    },
    hub: {
      color: "#86af49",
      geometryTypes: ["point", "line", "polygon"],
      tags: ["sector"],
      icon: "images/icons/hub.png"
    }
  }
}
