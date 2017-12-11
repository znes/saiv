import { globals, config } from './globals.js'
import { store } from './store.js'
import { sidebar, closeSitebar } from './sidebar.js'
import { discardChanges } from './helper.js'
import { modal } from './modal.js'
import cytoscape from './libCustom/cytoscape.js'
import cxtMenu from 'cytoscape-context-menus';
import 'cytoscape-context-menus/cytoscape-context-menus.css'

cytoscape.use(cxtMenu, $);


class CytoScape {
	constructor() {
		this.cy = cytoscape({
			container: $(config.dom.canvasContainer),
			layout: {

			},
			style: config.cytoscape.styleConfig
		})
		this.autoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout

		this.initMarkers()
		this.initEvents()
	}

	show() {
		this.initElements(store.getElements())
	}

	initMarkers() {


		Object.keys(config.nodes.nodesAvailable).forEach(type => {
			this.cy.style()
				.selector('node[type="' + type + '"]')
				.style({
					'background-color': config.nodes.nodesAvailable[type].color,
					'background-image': config.nodes.nodesAvailable[type].icon,
					'background-fit': 'cover'
				})
		})
	}


	$(sel) {
		return this.cy.$(sel)
	}

	/**registerEvents() {
		document.addEventListener("dataChanged", (e) => {
			switch (e.detail.task) {
				case "initElements":
					this.initElements(e.detail.data)
					break
				case "updateStyle":
					this.updateLayout()
					break
				case "renameNode":
					this.renameNode(e.detail.data.oldName, e.detail.data.newName)
					break
				case "addNode":
					this.addNode(e.detail.data.name, e.detail.data.type, e.detail.data.pos)
					break
				case "addNodes":
					this.addNodes(e.detail.data)
					break
				case "changeType":
					this.changeType(e.detail.data.name, e.detail.data.type)
					break
				case "deleteNode":
					this.deleteNode(e.detail.data)
					break
				case "addEdge":
					this.addEdge(e.detail.data.from, e.detail.data.to)
					break
				case "deleteEdge":
					this.deleteEdge(e.detail.data.from, e.detail.data.to)
					break
				case "focusNode":
					this.focusNode(e.detail.data)
					break
			}
		})
	}*/

	initEvents() {
		this.updateBind()

		this.cy.contextMenus({
			menuItems: [{
					id: 'remove',
					content: 'Remove',
					selector: 'node',
					onClickFunction: (event) => {
						let evtTarget = event.target || event.cyTarget
						if (!discardChanges())
							return

						store.deleteNode(evtTarget.id())
							.then(name => {
								this.deleteNode(name)
							})
					}
				},
				{
					id: 'add-successors',
					content: 'Connect successors',
					selector: 'node',
					onClickFunction: (event) => {
						let evtFromTarget = event.target || event.cyTarget
						let pos = event.position || event.cyPosition

						if (!discardChanges())
							return


						globals.unsavedChanges = true

						this.cy.add([{
							group: "edges",
							data: {
								id: "shadowEdge",
								source: evtFromTarget.data().id,
								target: evtFromTarget.data().id
							}
						}])


						this.cy.on("mouseover", "node", (_event) => {
							let evtToTarget = _event.target || _event.cyTarget
							this.cy.$('#shadowEdge').move({
								target: evtToTarget.data().id
							})
						})

						this.cy.on("click", "node", (_event) => {
							let evtToTarget = _event.target || _event.cyTarget
							store.addEdge(evtFromTarget.data().id, evtToTarget.data().id)
								.then(obj => {
									this.addEdge(obj.from, obj.to)
									this.$('#' + obj.to).emit("click")
								}).catch((err) => {
									modal("Error", err)
								});

							globals.unsavedChanges = false
							this.cy.$('#shadowEdge').remove()
							this.updateBind()
						})
					}
				},
				{
					id: 'remove',
					content: 'Remove',
					selector: 'edge',
					onClickFunction: (event) => {
						if (!discardChanges())
							return

						store.deleteEdge(event.cyTarget.source().id(), event.cyTarget.target().id())
							.then(() => {
								this.deleteEdge(event.cyTarget.source().id(), event.cyTarget.target().id())
							})
						closeSitebar()
					}
				},
				{
					id: 'add-node',
					content: 'Add node',
					coreAsWell: true,
					onClickFunction: async (event) => {
						if (!discardChanges())
							return

						let pos = event.position || event.cyPosition
						const addNodeData = await sidebar.addNode(pos)
						sidebar.close()
						store.addNode(addNodeData)
							.then(obj => {
								this.addNode(obj.name, obj.type, obj.pos)
							})
							.catch(e => {
								modal("Error", e)
							})
					}
				},
				{
					id: 'center-map',
					content: 'Center Map',
					coreAsWell: true,
					onClickFunction: (event) => {
						this.cy.reset()
						this.cy.center()
					}
				},
				{
					id: 'relayout-elements',
					content: 'Relayout Elements',
					coreAsWell: true,
					onClickFunction: (event) => {
						this.updateLayout()
					}
				}
			]
		})
	}

	updateBind() {
		this.cy.off('mouseover')
		this.cy.off('click')

		// Add default listener
		this.cy.on("click", evt => {
			closeSitebar()
		})

		this.cy.on("click", "node", async (evt) => {
			let evtTarget = evt.target || evt.cyTarget
			try {
				const nodeData = await sidebar.updateNodeForm(evtTarget.id())
				let updateData = await store.updateNode(nodeData)
				this.updateNode(evtTarget.id(), updateData)
			} catch (e) {
				console.log(e)
			}
		})

		this.cy.on("position", "node", evt => {
			const evtTarget = evt.target || evt.cyTarget
			const pos = event.position || event.cyPosition
			store.updatePosition(evtTarget.id(), evtTarget.position())
		})
	}

	initElements(eles) {
		this.cy.remove("*")
		this.addNodes(eles)
	}

	discard() {
		if (this.cy.$('#shadowEdge').length > 0)
			this.cy.$('#shadowEdge').remove()

		this.updateBind()
	}

	updateNodesEnabled(removeEles, addEles) {
		removeEles.forEach(child => {
			this.cy.$('#' + child.name).remove()
		})

		let edges = []
		addEles.forEach(child => {
			child.predecessors.forEach(pred=>{
				edges.push({
					group: "edges",
					data: {
						source: pred,
						target: child.name
					}
				})
			})
			child.successors.forEach(succ=>{
				// dont add if it will be added via addEle already
				if(addEles.findIndex(x=>x.name == succ) == -1) {
					edges.push({
						group: "edges",
						data: {
							source: child.name,
							target: succ
						}
					})
				}
			})
			this.addNode(child.name, child.type, child.pos)
		})

		try {
			this.cy.add(edges)
		}
		catch(e) {
			//console.log(e)
		}
	}

	updateNode(name, updateData) {
		const ele = this.cy.$("node#" + name)
		const position = ele.position()


		let edgesToUpdate = this.cy.edges("[source='" + name + "'], [target='" + name + "']");
		//replace Nodes
		let edges = []
		updateData.predecessors.forEach(pred => {
			let ele = {
				group: "edges",
				data: {
					source: pred,
					target: updateData.name
				}
			}
			edges.push(ele)
		})
		updateData.successors.forEach(succ => {
			let ele = {
				group: "edges",
				data: {
					source: updateData.name,
					target: succ
				}
			}
			edges.push(ele)
		})

		edgesToUpdate.remove()
		ele.remove()
		this.addNode(updateData.name, updateData.type, position)
		try {
			this.cy.add(edges)
		}
		catch(e) {
			//console.log(e)
		}
	}

	addNodes(childs) {
		let customPos = false

		childs.forEach(child => {
			if (typeof child.pos != "undefined") {
				if (typeof child.pos.x != "undefined" && typeof child.pos.y != "undefined") {
					customPos = true
					this.addNode(child.name, child.type, child.pos)
				} else {
					this.addNode(child.name, child.type)
				}
			} else {
				this.addNode(child.name, child.type)
			}
		})

		// Add edges when nodes loaded
		// Only add Successors
		childs.forEach(child => {
			child.successors.forEach(succ => {
				this.addEdge(child.name, succ)
			})
		})

		// check if all pred added
		childs.forEach(child => {
			child.predecessors.forEach(pred => {
				if (this.cy.edges("[source='" + pred + "'][target='" + child.name + "']").length == 0) {
					if (this.cy.$("#" + pred).length > 0) {
						this.addEdge(pred, child.name)
					}
				}
			})
		})


		if (!customPos || this.autoLayout == "true") {
			this.updateLayout()
		} else {
			this.cy.reset()
			this.cy.center()
		}
	}
	addNode(name, type, pos = {}) {
		let elementData = {}
		elementData.id = name
		elementData.type = type


		if (typeof pos.x != "undefined" && typeof pos.y != "undefined") {
			this.cy.add({
				group: "nodes",
				type: type,
				data: elementData,
				position: {
					x: Number.parseFloat(pos.x),
					y: Number.parseFloat(pos.y)
				}
			})
		} else {
			this.cy.add({
				group: "nodes",
				type: type,
				data: elementData
			})
		}

		if (this.autoLayout == "true") {
			this.updateLayout()
		}
	}


	deleteNode(name) {
		this.cy.$("#" + name).remove()
	}

	deleteEdge(from, to) {
		this.cy.edges("[source='" + from + "'][target='" + to + "']").remove()
	}

	addEdge(from, to) {
		this.cy.add([{
			group: "edges",
			data: {
				source: from,
				target: to
			}
		}])
	}

	focusNode(name = null) {
		this.cy.$(":selected").unselect()
		if (name != null) {
			this.cy.$("#" + name).select()
		}
	}

	updateLayout() {
		this.autoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout

		this.cy.makeLayout({
			name: localStorage.getItem("style") || config.cytoscape.defaultStyle
		}).run()
	}
}

export let cyto = new CytoScape()
