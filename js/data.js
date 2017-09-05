class DataManager {
	constructor() {
		this._json = null
		this._filterElements = null

		// debug	
	    window.json = () => {
	    	return this._json
	    }

	    document.addEventListener("data", (e) => {
	        this.updateData(e.detail);
	    })
    }

    set json  (paraJson)  { 
    	this._json = paraJson 
    	this.initData()
    }
    get json  ()       { return this._json }


    getElement(id) {
    	let index = this._json.children.findIndex(x => x.name==id)
		if (index !== -1) {
			return this._json.children[index]
		}
    }

	updateScenario (data) {	
		this._json.name = data.name
		this._json.tags.description = data.tags.description
	}

	getScenario () {
		if(this._json != null) {
			return {
				name: this._json.name,
				description: this._json.tags.description
			}
		}
		else 
			return null
	}

	initData () {
		this.filterElements = []


		this._json.children.forEach((child, index, object) => {
			if(configNode.nodesEnabled.indexOf(child.type) == -1) {
				this.filterElements.push(child)
				object.splice(index, 1)
			}
			else {
				// create tags object
				if(typeof child.tags == "undefined")
					child.tags = {}
				// remove wrong tags
				else if(!configNode.allowCustomTags) {
					for (let [tag, value] of Object.entries(child.tags)) {
		                if (configNode.nodesAvailable[child.type].tags.findIndex(x => x.name==tag) == -1) {
							delete child.tags[tag]
						}
					}
				}

				// create tags not created
				configNode.nodesAvailable[child.type].tags.forEach((tag) => {
					if(typeof child.tags[tag] == "undefined") {
						child.tags[tag.name] = ""
					}
					else {
						// parse value
					}
				})
			}
		})
	} 

	updateData (detail) {
		switch(detail.task) {
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
			default:
				console.log("default case updateData")
				break
		}
	}

	updateRelationNames (newName, oldName) {
		this._json.children.forEach((child,index) => {
			child.predecessors.forEach((pred,j) => {
				if(pred == oldName) this._json.children[index].predecessors[j] = newName
			})
			child.successors.forEach((succ,j) => {
				if(succ == oldName)  this._json.children[index].successors[j] = newName
			})
		})
	}

	updatePosition (name, pos) {
		let index = this._json.children.findIndex(x => x.name==name)
		if (index !== -1) {
			/*if(typeof this._json.children[index].pos == "undefined") {
				this._json.children[index].pos = {}		
			}*/

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

	addNode (data) {
		let formdata = {
            name: data.name,
            type: data.type,
            tags: {},
            predecessors: [],
            successors: [],
            pos: {}
        }

        let index = this._json.children.findIndex(x => x.name==data.name)
		if (index !== -1) {
			modal("Error", "Element name already exists")
			return false
		}

		if(typeof data.pos != "undefined") {
			if(typeof data.pos.lat != "undefined" && typeof data.pos.lng != "undefined") {
	        	formdata.pos = {
	        		lat: data.pos.lat,
	        		lng: data.pos.lng
	        	}
	        }
	        else if(typeof data.pos.x != "undefined" && typeof data.pos.y != "undefined") {
	        	formdata.pos = {
	        		x: parseInt(data.pos.x),
	        		y: parseInt(data.pos.y)
	        	}
	        }
	        else if(typeof data.pos.wkt != "undefined") {
	        	formdata.pos = data.pos
	        }
		}


		for (var i = 0; i < configNode.nodesAvailable[type].tags.length; i++) {
			formdata.tags[configNode.nodesAvailable[type].tags[i]] = ""
		}

        sendEvent("dataChanged", {
			task: "addNode",
			data: {
				name: data.name,
				pos: formdata.pos,
				type: data.type
			}
		})

		this._json.children.push(formdata)

		sendEvent("sidebar", {
            task: "showId",
            data: data.name
        })
	}


	/**
	 * [addEdge description]
	 * Adds predecessors and successors
	 */
	addEdge (predecessors, successors) {
		// Add Successor
		let index = this._json.children.findIndex(x => x.name==predecessors)
		if (index !== -1) {
			if(this._json.children[index].successors.indexOf(successors) === -1) {
				this._json.children[index].successors.push(successors)
			} else {
				modal("Error", "Already exists")
				return false;
			}
		}
		// Add Predecessor
		index = this._json.children.findIndex(x => x.name==successors)
		if (index !== -1) {
			if(this._json.children[index].predecessors.indexOf(predecessors) === -1)
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
		let srcI = this._json.children.findIndex(x => x.name==src),
			targetI = this._json.children.findIndex(x => x.name==target);

		if (srcI !== -1 && targetI !== -1) {
			this._json.children[srcI].successors = this._json.children[srcI].successors.filter(succ =>{
				return succ != target
			})
			this._json.children[targetI].predecessors = this._json.children[targetI].predecessors.filter(pred =>{
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

	deleteNode (name) {
		this._json.children = this._json.children.filter(child => {
            return child.name != name
        })

		this.deleteRelationNames(name)

		sendEvent("dataChanged", {
			task: "deleteNode",
			data: name
		})
	}

	updateNode (updateData) {

		// check if pos changed
        if(typeof updateData.pos != "undefined") {
	        if(typeof updateData.pos.lat != "undefined" && typeof updateData.pos.lng != "undefined") {
	        	let ele = this.getElement(updateData.currentId)
	        	
	        	if(updateData.pos.lat != ele.pos.lat || updateData.pos.lng != ele.pos.lng) {
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
	    if(updateData.type != this.getElement(updateData.currentId).type) {
	    	sendEvent("dataChanged", {
				task: "changeType",
				data: {
					name: updateData.currentId,
					type: updateData.type
				}
			})
		}

		this._json.children = this._json.children.filter(child => child.name != updateData.currentId)

        // if name(id) changes
        if(updateData.currentId != updateData.name) {
        	this.updateRelationNames(updateData.name, updateData.currentId)

        	sendEvent("dataChanged", {
        		task: "renameNode",
        		data: {
					oldName: updateData.currentId,
					newName: updateData.name
				}
			})
        }


        delete updateData['currentId']


        if(typeof updateData.tags == "undefined") {
        	updateData.tags = {}
        }
        

        // Add Successor and Predecessors to other
        updateData.successors.forEach(child => {
        	let index = this._json.children.findIndex(x => x.name==child)
			if (index !== -1) {
				if(this._json.children[index].predecessors.indexOf(updateData.name) === -1) {
					this._json.children[index].predecessors.push(updateData.name)

					sendEvent("dataChanged", {
						task: "addEdge",
		        		data: {
							from: updateData.name,
							to: this._json.children[index].name
						}
					})
				}
			}
        })
        updateData.predecessors.forEach(child => {
        	let index = this._json.children.findIndex(x => x.name==child)
			if (index !== -1) {
				if(this._json.children[index].successors.indexOf(updateData.name) === -1) {
					this._json.children[index].successors.push(updateData.name)


					sendEvent("dataChanged", {
						task: "addEdge",
		        		data: {
							from: this._json.children[index].name,
							to: updateData.name
						}
					})
				}
			}
        })


 

        // Check if Edges have been removed
        this._json.children.forEach((child, id, arr)=> {
        	let index = child.predecessors.indexOf(updateData.name)
        	if( index !== -1)
        	{
        		if(updateData.successors.indexOf(child.name) === -1) {
        			delete arr[id].predecessors[index]

        			sendEvent("dataChanged", {
        				task: "deleteEdge",
						data : { 
							from: updateData.name,
							to: child.name
						}
        			})
        		}
        	}

        	index = child.successors.indexOf(updateData.name)
        	if( index !== -1)
        	{
        		if(updateData.predecessors.indexOf(child.name) === -1) {
        			delete arr[id].successors[index]
        			
        			sendEvent("dataChanged", {
        				task: "deleteEdge",
						data : { 
							from: child.name,
							to: updateData.name
						}
        			})
        		}
        	}
        })

        this._json.children.push(updateData)

        /*sendEvent("sidebar", {
            task: "showId",
            data: updateData.name
        })*/
    }

    addTag (name, tagName) {
    	let index = this._json.children.findIndex(x => x.name==name)

    	if( index !== -1) {
    		if(typeof this._json.children[index].tags == "undefined")
    			this._json.children[index].tags = {}
    		
    		this._json.children[index].tags[tagName] = ""
    	}
    }

    removeTag (name, tagName) {
    	let index = this._json.children.findIndex(x => x.name==name)

    	if( index !== -1)
    		delete this._json.children[index].tags[tagName]
    }

    deleteRelationNames (name) {
    	this._json.children.forEach(child => {
    		child.predecessors.forEach((pred, index) =>  {
    			if(pred == name) {
					child.predecessors.splice(index,1);
				}
    		})
    		child.successors.forEach((succ, index) =>  {
    			if(succ == name) {
					child.successors.splice(index,1);
				}
    		})
    	})
    }
}