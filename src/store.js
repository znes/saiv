import { globals, config } from './globals.js'
import { sendEvent } from './helper.js'
import { modal } from './modal.js'

class Store {
	constructor() {
		this._json = null
		this.filterElements = null

		// debug
		window.json = () => {
			return this._json
		}
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

	getElements() {
		return this._json.children
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
		if (this._json) {
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
			if (typeof config.nodes.nodesAvailable[child.type] == "undefined") {
				console.log(child.name + " has been removed. Type is unknown.")
				removeItems.push(child)
			} else {
				// Node Type is not enabled
				if (config.nodes.nodesEnabled.indexOf(child.type) == -1) {
					console.log("Not enabled", child.name, child.type)
					this.filterElements.push(child)
				}
				// Node Type is enabled
				else {
					if (typeof child.tags == "undefined") {
						child.tags = {}
					} else if (!config.nodes.allowCustomTags) {
						for (let [tag, value] of Object.entries(child.tags)) {
							if (config.nodes.nodesAvailable[child.type].tags.findIndex(x => x == tag) == -1) {
								delete child.tags[tag]
							}
						}
					}

					// create tags not created;
					config.nodes.nodesAvailable[child.type].tags.forEach((tag) => {
						if (typeof child.tags[tag] == "undefined") {
							child.tags[tag] = ""
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

	/*updateData(detail) {
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
			case "addSequence":
				this.addSequence(detail.data.name, detail.data.data)
				break
			case "deleteSequence":
				this.deleteSequence(detail.data.name, detail.data.data)
				break
				break
			case "deleteSequences":
				this.deleteSequence(detail.data)
				break
			default:
				console.log("default case updateData")
				break
		}
	}*/

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
		}
	}


	addNode(data) {
		return new Promise((resolve, reject) => {
			let formdata = {
				name: data.name,
				type: data.type,
				tags: {},
				predecessors: [],
				successors: [],
				pos: {}
			}

			let index = this._json.children.findIndex(x => x.name == data.name)
			if (index !== -1) {
				modal("Error", "Element name already exists")
				reject()
				return false
			}


			if (data.pos) {
				formdata.pos = data.pos
			}

			for (let i = 0; i < config.nodes.nodesAvailable[data.type].tags.length; i++) {
				formdata.tags[config.nodes.nodesAvailable[data.type].tags[i]] = ""
			}

			this._json.children.push(formdata)

			resolve({
				name: formdata.name,
				pos: formdata.pos,
				type: formdata.type
			})
		})
	}


	/**
	 * [addEdge description]
	 * Adds predecessors and successors
	 */
	addEdge(predecessor, successor) {
		return new Promise((resolve, reject) => {
			if (predecessor == successor) {
				reject("Cant connect to same node")
			}

			let index = this._json.children.findIndex(x => x.name == predecessor)
			if (index !== -1) {
				if (this._json.children[index].successors.indexOf(successor) === -1) {
					this._json.children[index].successors.push(successor)
				} else {
					reject("Already exists")
				}
			}
			// Add Predecessor
			index = this._json.children.findIndex(x => x.name == successor)
			if (index !== -1) {
				if (this._json.children[index].predecessors.indexOf(predecessor) === -1)
					this._json.children[index].predecessors.push(predecessor)
			}


			resolve({
				from: predecessor,
				to: successor
			})
		})
	}

	deleteEdge(src, target) {
		return new Promise((resolve, reject) => {
			let srcI = this._json.children.findIndex(x => x.name == src),
				targetI = this._json.children.findIndex(x => x.name == target);

			if (srcI !== -1 && targetI !== -1) {
				this._json.children[srcI].successors = this._json.children[srcI].successors.filter(succ => {
					return succ != target
				})
				this._json.children[targetI].predecessors = this._json.children[targetI].predecessors.filter(pred => {
					return pred != src
				})

				resolve()
			}
		})
	}

	deleteNode(name) {
		return new Promise((resolve, reject) => {
			this._json.children = this._json.children.filter(child => {
				return child.name != name
			})

			this.deleteRelationNames(name)
			resolve(name)
		})
	}


	updateNode(updateData) {
		return new Promise((resolve, reject) => {
			console.log("store updateNode")
			console.log(updateData)
			let ele = this.getElement(updateData.currentId)
			let nodeEnabled = true

			if(!updateData.pos)
				updateData.pos = ele.pos
			// if name(id) changes
			if (updateData.currentId != updateData.name) {
				let index = this.getAllElements().findIndex(x => x.name == updateData.name)
				if (index != -1) {
					reject("Name is already used. Changes have been discarded")
				}
			}

			if (config.nodes.nodesEnabled.indexOf(updateData.type) == -1) {
				nodeEnabled = false

				/*sendEvent("dataChanged", {
					task: "deleteNode",
					data: updateData.currentId
				})*/
			} else {
				// check if type changed
				if (updateData.type != ele.type) {
					/*sendEvent("dataChanged", {
						task: "changeType",
						data: {
							name: updateData.currentId,
							type: updateData.type
						}
					})*/
				}
			}

			// remove current updated Child.
			this._json.children = this._json.children.filter(child => child.name != updateData.currentId)

			delete updateData['currentId']


			if (!updateData.tags) {
				updateData.tags = {}
			}


			// Add Successor and Predecessors to other
			updateData.successors.forEach(child => {
				let index = this._json.children.findIndex(x => x.name == child)
				if (index !== -1) {
					if (this._json.children[index].predecessors.indexOf(updateData.name) === -1) {
						this._json.children[index].predecessors.push(updateData.name)

						/*if (nodeEnabled) {
							sendEvent("dataChanged", {
								task: "addEdge",
								data: {
									from: updateData.name,
									to: this._json.children[index].name
								}
							})
						}*/
					}
				}
			})


			updateData.predecessors.forEach(child => {
				let index = this._json.children.findIndex(x => x.name == child)
				if (index !== -1) {
					if (this._json.children[index].successors.indexOf(updateData.name) === -1) {
						this._json.children[index].successors.push(updateData.name)

						/*if (nodeEnabled) {
							sendEvent("dataChanged", {
								task: "addEdge",
								data: {
									from: this._json.children[index].name,
									to: updateData.name
								}
							})
						}*/
					}
				}
			})



			// Check if Edges have been removed
			this._json.children.forEach((child, id, arr) => {
				let index = child.predecessors.indexOf(updateData.name)
				if (index !== -1) {
					if (updateData.successors.indexOf(child.name) === -1) {
						delete arr[id].predecessors[index]

						/*if (nodeEnabled) {
							sendEvent("dataChanged", {
								task: "deleteEdge",
								data: {
									from: updateData.name,
									to: child.name
								}
							})
						}*/
					}
				}

				index = child.successors.indexOf(updateData.name)
				if (index !== -1) {
					if (updateData.predecessors.indexOf(child.name) === -1) {
						delete arr[id].successors[index]

						if (nodeEnabled) {
							/*sendEvent("dataChanged", {
								task: "deleteEdge",
								data: {
									from: child.name,
									to: updateData.name
								}
							})*/
						}
					}
				}
			})


			if (nodeEnabled) {
				this._json.children.push(updateData)
				resolve(updateData)
			} else {
				this.filterElements.push(updateData)
				resolve()
			}
		})
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
		return new Promise((resolve, reject) => {

			let elesToAdd = []
			let elesToRemove = []

			if (this._json != null) {
				let diffRemovedTypes = config.nodes.nodesEnabled.filter(el => {
					return (nodesEnabled.indexOf(el) == -1)
				})

				let diffAddedTypes = nodesEnabled.filter(el => {
					return (config.nodes.nodesEnabled.indexOf(el) == -1)
				})


				// remove filtered Elements
				diffRemovedTypes.forEach(name => {

					//console.log(this._json.children
						//.filter(x => x.type == name))

					this._json.children
						.filter(x => x.type == name)
						.forEach(child => {
							this.filterElements.push(child)
							elesToRemove.push(child)
							/*sendEvent("dataChanged", {
								task: "deleteNode",
								data: child.name
							})*/
						})
				})


				this.filterElements.forEach(child => {
					let index = this._json.children.findIndex(x => x.name == child.name)
					if (index != -1) {
						this._json.children.splice(index, 1)
					}
				})


				diffAddedTypes.forEach(name => {
					elesToAdd = elesToAdd.concat(this.filterElements.filter(x => x.type == name))
				})

				elesToAdd.forEach(child => {
					let index = this.filterElements.findIndex(x => x.name == child.name)
					this._json.children.push(child)

					if (index != -1) {
						this.filterElements.splice(index, 1)
					}
				})


			}

			config.nodes.nodesEnabled = nodesEnabled
			resolve({remove: elesToRemove, add: elesToAdd})
		})
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

export let store = new Store();
