class CyptoScape {

    constructor(selector) {
        this.cy = null

        this.init(selector)
        this.registerEvents()

        // debug
        window.cy = () => {
            return this.cy
        }
    }

    init (selector) {
        this.cy = cytoscape({
            container: $(selector),
            layout: {
                fit: true
            },
            style: [{
                selector: "node",
                style: {
                    "content": "data(id)",
                    "text-opacity": 0.5,
                    "text-valign": "center",
                    "text-halign": "right",
                    "background-color": "#11479e"
                }
            }, {
                selector: "edge",
                style: {
                    "width": 4,
                    "target-arrow-shape": "triangle",
                    "line-color": "#9dbaea",
                    "target-arrow-color": "#9dbaea",
                    "curve-style": "bezier"
                }
            }, {
                selector: "#shadowEdge",
                style: {
                    "line-color": "rgba(0, 0, 0, 0.50)",
                    "target-arrow-color": "rgba(0, 0, 0, 0.50)",
                }
            }, {
                selector: ":selected",
                style: {
                    "background-color": "#000"
                }
            }]
        })

        this.initEvents()
    }


    $(sel) {
        return this.cy.$(sel)
    }

    registerEvents() {
         document.addEventListener("dataChanged", (e)=> {
            switch(e.detail.task) {
                case "initElements": 
                    
                    this.initElements(e.detail.data)
                    break
                case "updateStyle": 
                    if(this.cy.$("nodes").length > 0) {
                        this.updateLayout()

                        showGraph()
                    }
                    break
                case "renameNode":
                    this.renameNode(e.detail.data.oldName, e.detail.data.newName)
                    break
                case "addNode":
                    this.addNode(e.detail.data.name, e.detail.data.additional)
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
            }
        })
    }

    createElementsCy(jsonData) {
        
    }

    initEvents() {
        this.updateBind()


        this.cy.contextMenus({
            menuItems: [
            {
                id: 'remove',
                title: 'Remove',
                selector: 'node',
                onClickFunction: (event) => {
                    sendEvent("data", {
                        task: "deleteNode",
                        data: event.cyTarget.id()
                    })
                    //datam.deleteNode(event.cyTarget.id())
                }
            },
            {
                id: 'add-successors',
                title: 'Connect successors',
                selector: 'node',
                onClickFunction: (event) => {
                    var evtFromTarget = event.target || event.cyTarget
                    var pos = event.position || event.cyPosition

                    if(evtFromTarget.data().type == "scenario") {
                        modal("Error", "Cant be connected to type scenario")
                        return false
                    }

                    this.cy.add([{ group: "edges", data: {
                        id: "shadowEdge", source: evtFromTarget.data().id, 
                        target: evtFromTarget.data().id}}])


                    this.cy.on("mouseover", "node", {}, (_event) => {
                        var evtToTarget = _event.target || _event.cyTarget
                        this.cy.$('#shadowEdge').move({target: evtToTarget.data().id})
                    })

                    this.cy.on("click", "node", {}, (_event) => {
                        var evtToTarget = _event.target || _event.cyTarget 
                        if(evtFromTarget == evtToTarget ) {
                            modal("Error", "Cant connect to same node")
                        }
                        else if (evtToTarget.data().type == "scenario") {
                            modal("Error", "Cant be connected to type scenario")
                        }
                        else {
                            sendEvent("data", {
                                task: "addEdge",
                                data: {
                                    from: evtFromTarget.data().id,
                                    to: evtToTarget.data().id
                                }
                            })
                            //datam.addEdge(, )
                                
                            /*sendEvent("sidebar", {
                                task: "showId",
                                data: _event.cyTarget.id()
                            })*/
                        }
                        this.cy.$('#shadowEdge').remove()
                        this.updateBind()
                    })
                }            
            },
            {
                id: 'remove',
                title: 'Remove',
                selector: 'edge',
                onClickFunction: (event) => {

                    sendEvent("data", {
                        task: "deleteEdge",
                        data: {
                            from: event.cyTarget.source().id(),
                            to: event.cyTarget.target().id()
                        }
                    })
                    //datam.deleteEdge(, ) 
                    //event.cyTarget.remove()
                }
            },
            {
                id: 'add-node',
                title: 'Add node',
                coreAsWell: true,
                onClickFunction: (event) => {
                    var pos = event.position || event.cyPosition
                    sendEvent("sidebar", {
                        task: "addNode",
                        data: {
                            pos: pos,
                            eles: this.cy.elements("node")
                        }
                    })
                    //sb.addNode(pos, this.cy.elements("node"))
                }
            },
            {
                id: 'center-map',
                title: 'Center Map',
                coreAsWell: true,
                onClickFunction: (event) => {
                    this.cy.reset()
                    this.cy.center()
                }
            },
            {
                id: 'relayout-elements',
                title: 'Relayout Elements',
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
        this.cy.on("click", "node", {}, evt => {
            sendEvent("sidebar", {
                task: "showId",
                data: evt.cyTarget.id()
            })
        })
    }

    initElements(jsonData) {
        let eles = []
        let customPos = false

        jsonData.children.forEach(child => {
            let ele = {
                group: "nodes",
                data: {
                    id: child.name
                }
            }
            if(typeof child.pos != "undefined") {
                if(typeof child.pos.x != "undefined" && typeof child.pos.y != "undefined") {
                    customPos = true
                    ele.position = {
                        x: child.pos.x,
                        y: child.pos.y,
                    }
                }
            }

            eles.push(ele)
        })

        // Add edges when nodes loaded
        // Only add Successors 
        jsonData.children.forEach(child => {
            child.successors.forEach(succ => {
                eles.push({
                    data: {
                        source: child.name,
                        target: succ
                    },
                    group: "edges"
                })
            })
        })


        this.cy.$("*").remove()
        this.cy.add(eles)

        if(!customPos) {
            this.updateLayout()
        }
        else {
            this.cy.reset()
            this.cy.center()
        }
    }

    addNode(name, additional) {
        this.cy.add({
            group: "nodes",
            data: {
                id: name,
            },
            position: {
                x: parseInt(additional.x),
                y: parseInt(additional.y)
            }
        })
    }

    renameNode(oldName, newName) {
        var ele = this.cy.$("node#" + oldName)

        var newEle = {
            group: "nodes",
            data: {
                id: newName
            },
            position: ele.position()
        }
        this.cy.add(newEle)
        

        var edgesToUpdate = this.cy.edges("[source='" + oldName + "'], [target='" + oldName + "']");
        //replace Nodes
        let edges = []
        edgesToUpdate.forEach(edge => {
            let target = edge.target().id(),
                source = edge.source().id(),
                ele = {
                    group: "edges",
                    data: {
                        source: "",
                        target: ""
                    }
                }

            
            if(target == oldName) {
                ele.data.source = source
                ele.data.target = newName
            }
            else {
                ele.data.source = newName
                ele.data.target = target
            }

            edges.push(ele)
        })
        ele.remove();
        edgesToUpdate.remove();
        this.cy.add(edges)
    }


    deleteNode(name) {
        this.cy.$("#" + name).remove()
    }

    deleteEdge(from, to) {
        this.cy.edges("[source='" + from + "'][target='" + to + "']").remove()
    }

    addEdge(from, to) {
        this.cy.add([{ group: "edges", data: { source: from, target: to}}])
    }

    updateLayout() {
        this.cy.makeLayout({
            name: localStorage.getItem("style") || config.cytoscape.styles[0]
        }).run()
    }
}