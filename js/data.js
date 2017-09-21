class DataManager {
  constructor() {
    this._json = null
    this.filterElements = null

    // debug
    window.json = () => {
      return this._json
    }

    document.addEventListener("data", (e) => {
      this.updateData(e.detail);
    })
  }

  set json(paraJson) {
    this.initData(paraJson)
  }
  get json() {
    return this._json
  }



  /**
   * [getAllElements description]
   * Get all elements including filtered elements
   */
  getAllElements() {
    return this._json.children.concat(this.filterElements)
  }


  getElement(id) {
    let index = this._json.children.findIndex(x => x.name == id)
    if (index !== -1) {
      return this._json.children[index]
    }
  }

  updateScenario(data) {
    this._json.name = data.name
    this._json.tags.description = data.tags.description
  }

  getScenario() {
    if (this._json != null) {
      return {
        name: this._json.name,
        description: this._json.tags.description
      }
    } else
      return null
  }

  initData(json) {
		this._json = json
    this.filterElements = []
		let removeItems = []

    this._json.children.forEach((child) => {
			// Node Type unknown
			if (typeof configNode.nodesAvailable[child.type] == "undefined") {
				removeItems.push(child)
			}
			else {
				// Add valid geometry_type if not avaible
				if(typeof child.geometry_type == "undefined") {
					child.geometry_type = configNode.nodesAvailable[child.type].geometryTypes[0]
				}
				else if (configNode.nodesAvailable[child.type].geometryTypes.indexOf(child.geometry_type) == -1) {
					child.geometry_type = configNode.nodesAvailable[child.type].geometryTypes[0]
				}

				// Node Type is not enabled
				if (configNode.nodesEnabled.indexOf(child.type) == -1) {
					this.filterElements.push(child)
				}
				// Node Type is enabled
				else {
					if (typeof child.tags == "undefined")
					child.tags = {}
					else if (!configNode.allowCustomTags) {
						for (let [tag, value] of Object.entries(child.tags)) {
							if (configNode.nodesAvailable[child.type].tags.findIndex(x => x.name == tag) == -1) {
								delete child.tags[tag]
							}
						}
					}

					// create tags not created;
					configNode.nodesAvailable[child.type].tags.forEach((tag) => {
						if (typeof child.tags[tag.name] == "undefined") {
							child.tags[tag.name] = ""
						} else {
							// parse value
						}
					})
				}
			}
    })


    // remove filtered Elements
    this.filterElements.concat(removeItems).forEach(child => {
      let index = this._json.children.findIndex(x => x.name == child.name)
      if (index != -1) {
        this._json.children.splice(index, 1)
      }
    })
  }

  updateData(detail) {
    switch (detail.task) {
      case "addNode":
        this.addNode(detail.data)
        break
      case "addEdge":
        this.addEdge(detail.data.from, detail.data.to)
        break
      case "deleteNode":
        this.deleteNode(detail.data)
        break
      case "deleteEdge":
        this.deleteEdge(detail.data.from, detail.data.to)
        break
      case "addTag":
        this.addTag(detail.data.id, detail.data.tag)
        break
      case "removeTag":
        this.removeTag(detail.data.id, detail.data.tag)
        break
      case "updateNode":
        this.updateNode(detail.data)
        break
      case "updatePosition":
        this.updatePosition(detail.data.name, detail.data.pos)
        break
      case "updateScenario":
        this.updateScenario(detail.data)
        break
      case "updateNodesEnabled":
        this.updateNodesEnabled(detail.data)
        break
      default:
        console.log("default case updateData")
        break
    }
  }

  updateRelationNames(newName, oldName) {
    this._json.children.forEach((child, index) => {
      child.predecessors.forEach((pred, j) => {
        if (pred == oldName) this._json.children[index].predecessors[j] = newName
      })
      child.successors.forEach((succ, j) => {
        if (succ == oldName) this._json.children[index].successors[j] = newName
      })
    })
  }

  updatePosition(name, pos) {
    let index = this._json.children.findIndex(x => x.name == name)
    if (index !== -1) {
      this._json.children[index].pos = pos

      sendEvent("dataChanged", {
        task: "positionUpdate",
        data: {
          name: name,
          pos: pos
        }
      })
    }
  }

  addNode(data) {
    let formdata = {
      name: data.name,
      type: data.type,
      geometry_type: data.geometry_type,
      tags: {},
      predecessors: [],
      successors: [],
      pos: {}
    }

    let index = this._json.children.findIndex(x => x.name == data.name)
    if (index !== -1) {
      modal("Error", "Element name already exists")
      return false
    }


    if (typeof data.pos != "undefined") {
      formdata.pos = data.pos
    }


    for (var i = 0; i < configNode.nodesAvailable[data.type].tags.length; i++) {
      formdata.tags[configNode.nodesAvailable[data.type].tags[i]] = ""
    }

    this._json.children.push(formdata)


    sendEvent("dataChanged", {
      task: "addNode",
      data: {
        name: formdata.name,
        pos: formdata.pos,
        type: formdata.type,
				geometry_type: formdata.geometry_type
      }
    })

    sendEvent("sidebar", {
      task: "showId",
      data: data.name
    })
  }


  /**
   * [addEdge description]
   * Adds predecessors and successors
   */
  addEdge(predecessors, successors) {
    // Add Successor
    let index = this._json.children.findIndex(x => x.name == predecessors)
    if (index !== -1) {
      if (this._json.children[index].successors.indexOf(successors) === -1) {
        this._json.children[index].successors.push(successors)
      } else {
        modal("Error", "Already exists")
        return false;
      }
    }
    // Add Predecessor
    index = this._json.children.findIndex(x => x.name == successors)
    if (index !== -1) {
      if (this._json.children[index].predecessors.indexOf(predecessors) === -1)
        this._json.children[index].predecessors.push(predecessors)
    }


    sendEvent("dataChanged", {
      task: "addEdge",
      data: {
        from: predecessors,
        to: successors
      }
    })
  }

  deleteEdge(src, target) {
    let srcI = this._json.children.findIndex(x => x.name == src),
      targetI = this._json.children.findIndex(x => x.name == target);

    if (srcI !== -1 && targetI !== -1) {
      this._json.children[srcI].successors = this._json.children[srcI].successors.filter(succ => {
        return succ != target
      })
      this._json.children[targetI].predecessors = this._json.children[targetI].predecessors.filter(pred => {
        return pred != src
      })
    }

    sendEvent("dataChanged", {
      task: "deleteEdge",
      data: {
        from: src,
        to: target
      }
    })
  }

  deleteNode(name) {
    this._json.children = this._json.children.filter(child => {
      return child.name != name
    })

    this.deleteRelationNames(name)

    sendEvent("dataChanged", {
      task: "deleteNode",
      data: name
    })
  }

  updateNode(updateData) {
    let ele = this.getElement(updateData.currentId)
    let nodeEnabled = true

    if(configNode.nodesEnabled.indexOf(updateData.type) == -1) {
      nodeEnabled = false

      sendEvent("dataChanged", {
          task: "deleteNode",
          data: updateData.currentId
        })
    }
    else {
      // check if pos changed
      if (typeof updateData.pos != "undefined") {
        if (typeof updateData.pos.lat != "undefined" && typeof updateData.pos.lng != "undefined") {

          if (updateData.pos.lat != ele.pos.lat || updateData.pos.lng != ele.pos.lng) {
            sendEvent("dataChanged", {
              task: "positionUpdate",
              data: {
                name: updateData.currentId,
                pos: {
                  lat: updateData.pos.lat,
                  lng: updateData.pos.lng
                }
              }
            })
          }
        }
      }

      // check if type changed
      if (updateData.type != ele.type || updateData.geometry_type != ele.geometry_type) {
       sendEvent("dataChanged", {
          task: "changeType",
          data: {
            name: updateData.currentId,
            type: updateData.type,
            geometry_type: updateData.geometry_type
          }
        })
      }

      this._json.children = this._json.children.filter(child => child.name != updateData.currentId)

      // if name(id) changes
      if (updateData.currentId != updateData.name) {
        this.updateRelationNames(updateData.name, updateData.currentId)

        sendEvent("dataChanged", {
          task: "renameNode",
          data: {
            oldName: updateData.currentId,
            newName: updateData.name
          }
        })
      }
    }

    delete updateData['currentId']


    if (typeof updateData.tags == "undefined") {
      updateData.tags = {}
    }


    // Add Successor and Predecessors to other
    updateData.successors.forEach(child => {
      let index = this._json.children.findIndex(x => x.name == child)
      if (index !== -1) {
        if (this._json.children[index].predecessors.indexOf(updateData.name) === -1) {
          this._json.children[index].predecessors.push(updateData.name)

          if(nodeEnabled) {
            sendEvent("dataChanged", {
              task: "addEdge",
              data: {
                from: updateData.name,
                to: this._json.children[index].name
              }
            })
          }
        }
      }
    })


    updateData.predecessors.forEach(child => {
      let index = this._json.children.findIndex(x => x.name == child)
      if (index !== -1) {
        if (this._json.children[index].successors.indexOf(updateData.name) === -1) {
          this._json.children[index].successors.push(updateData.name)

          if(nodeEnabled) {
            sendEvent("dataChanged", {
              task: "addEdge",
              data: {
                from: this._json.children[index].name,
                to: updateData.name
              }
            })
          }
        }
      }
    })




    // Check if Edges have been removed
    this._json.children.forEach((child, id, arr) => {
      let index = child.predecessors.indexOf(updateData.name)
      if (index !== -1) {
        if (updateData.successors.indexOf(child.name) === -1) {
          delete arr[id].predecessors[index]

          if(nodeEnabled) {
            sendEvent("dataChanged", {
              task: "deleteEdge",
              data: {
                from: updateData.name,
                to: child.name
                }
            })
          }
        }
      }

      index = child.successors.indexOf(updateData.name)
      if (index !== -1) {
        if (updateData.predecessors.indexOf(child.name) === -1) {
          delete arr[id].successors[index]

          if(nodeEnabled) {
            sendEvent("dataChanged", {
              task: "deleteEdge",
              data: {
                from: child.name,
                to: updateData.name
              }
            })
          }
        }
      }
    })

    this._json.children.push(updateData)
  }

  addTag(name, tagName) {
    let index = this._json.children.findIndex(x => x.name == name)

    if (index !== -1) {
      if (typeof this._json.children[index].tags == "undefined")
        this._json.children[index].tags = {}

      this._json.children[index].tags[tagName] = ""
    }
  }

  removeTag(name, tagName) {
    let index = this._json.children.findIndex(x => x.name == name)

    if (index !== -1)
      delete this._json.children[index].tags[tagName]
  }

  updateNodesEnabled(nodesEnabled) {
    console.log("nodesEnabled")


    if(this._json != null) {
      let diffRemovedTypes = configNode.nodesEnabled.filter(el => {
        return ( nodesEnabled.indexOf(el) == -1 )
      })

      let diffAddedTypes = nodesEnabled.filter(el => {
        return ( configNode.nodesEnabled.indexOf(el) == -1 )
      })



      // remove filtered Elements
      diffRemovedTypes.forEach(name => {

        console.log(this._json.children
          .filter(x => x.type == name))

        this._json.children
          .filter(x => x.type == name)
          .forEach(child => {
            console.log("remove")
            console.log(child.name)
            this.filterElements.push(child)

            sendEvent("dataChanged", {
              task: "deleteNode",
              data: child.name
            })
          })
      })

      
      this.filterElements.forEach(child => {
        let index = this._json.children.findIndex(x => x.name == child.name)
        if (index != -1) {
          this._json.children.splice(index, 1)
        }
      })


      let elesToAdd = []
      diffAddedTypes.forEach(name => {
        elesToAdd = elesToAdd.concat(this.filterElements.filter(x => x.type == name))
      })

      elesToAdd.forEach(child => {
        let index = this.filterElements.findIndex(x => x.name == child.name)
        this._json.children.push(child)

        if(index != -1) {
          this.filterElements.splice(index, 1)
        }
      })


      if(elesToAdd.length >= 1) {
        sendEvent("dataChanged", {
            task: "addNodes",
            data: elesToAdd
          })
      }
    }

    configNode.nodesEnabled = nodesEnabled
  }

  deleteRelationNames(name) {
    this._json.children.forEach(child => {
      child.predecessors.forEach((pred, index) => {
        if (pred == name) {
          child.predecessors.splice(index, 1);
        }
      })
      child.successors.forEach((succ, index) => {
        if (succ == name) {
          child.successors.splice(index, 1);
        }
      })
    })
  }
}
