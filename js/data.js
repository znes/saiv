class DataManager {
	constructor() {
		this._json = null
		// debug	
	    window.json = () => {
	    	return this._json.children
	    }

	    document.addEventListener("data", (e) => {
	        this.updateData(e.detail);
	    })
    }

    set json  (paraJson)  { this._json = paraJson }
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


	updateData (detail) {
		switch(detail.task) {
			case "addNode":
				this.addNode(detail.data)
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
			case "updateNode":
				this.updateNode(detail.data)
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

	addNode (data) {
		var formdata = {
            name: data.name,
            type: data.type,
            tags: {},
            predecessors: [],
            successors: []
        }
		this._json.children.push(formdata)

		sendEvent("dataChanged", {
			task: "addNode",
			data: {
				name: data.name,
				additional: {
					x: data.posx,
					y: data.posy
				}
			}
		})
	}

	/**
	 * [addEdge description]
	 * Adds predecessors and successors
	 */
	addEdge (predecessors, successors) {
		// Add Successor
		var index = this._json.children.findIndex(x => x.name==predecessors)
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
			this._json.children[index].predecessors.indexOf(predecessors) === -1 ? this._json.children[index].predecessors.push(predecessors) : console.log("This item already exists");
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
		var srcI = this._json.children.findIndex(x => x.name==src),
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
        });

		this.deleteRelationNames(name)

		sendEvent("dataChanged", {
			task: "deleteNode",
			data: name
		})
	}

	updateNode (updateData) {
		// check if pos changed
        if(typeof updateData.pos.lat != undefined && typeof updateData.pos.long != undefined) {
        	let ele = this._json.children.filter(child => child.name == updateData.currentid)[0]
        	
        	if(updateData.pos.lat != ele.pos.lat || updateData.pos.long != ele.pos.long) {
        		sendEvent("dataChanged", {
					task: "positionUpdate",
					data: {
						name: updateData.currentid,
						lat: updateData.pos.lat,
						long: updateData.pos.long
					}
				})
        	}
        }

		this._json.children = this._json.children.filter(child => child.name != updateData.currentid)

        // if name(id) changes
        if(updateData.currentid != updateData.name) {
        	this.updateRelationNames(updateData.name, updateData.currentid)

        	sendEvent("dataChanged", {
        		task: "renameNode",
        		data: {
					oldName: updateData.currentid,
					newName: updateData.name
				}
			})
        }


        delete updateData['currentid']
        

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
					/*sendEvent("addEdge", {
						from: updateData.name,
						to: this._json.children[index].name
					})*/
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

        // Check if something has been removed
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

        sendEvent("sidebar", {
            task: "showId",
            data: updateData.name
        })
    }

    addTag (name, tagName) {
    	let index = this._json.children.findIndex(x => x.name==name)

    	if( index !== -1)
    		this._json.children[index].tags[tagName] = ""
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