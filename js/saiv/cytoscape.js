class CyptoScape {

  constructor(selector) {
    this.cy = null

    this.init(selector)
    this.registerEvents()
    this.autoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout

    // debug
    window.cy = () => {
      return this.cy
    }
  }

  init(selector) {
    this.cy = cytoscape({
      container: $(selector),

      layout: {

      },
      style: [{
        selector: "node",
        style: {
          "content": "data(id)",
          "text-opacity": 0.7
        }
      }, {
        selector: "edge",
        style: {
          "target-arrow-shape": "triangle",
          "line-color": "#9dbaea",
          "target-arrow-color": "#9dbaea",
          "curve-style": "bezier"
        }
      }, {
        selector: "#shadowEdge",
        style: {
          "line-color": "rgba(0, 0, 0, 0.50)",
          "target-arrow-color": "rgba(0, 0, 0, 0.50)"
        }
      }, {
        selector: "core",
        style: {
          'active-bg-size': 0,
          'selection-box-border-width': 0,
          'active-bg-opacity': 0,
          'active-bg-color': 'red',
          'selection-box-opacity': 0,
          'selection-box-color': 'red'
        }
      }, {
        selector: ":selected",
        style: {
          'border-width': 1,
          'border-color': "#000"
        }
      }]
    })

    this.initMarkers()
    this.initEvents()
  }


  initMarkers() {
    Object.keys(configNode.nodesAvailable).forEach(type => {
      this.cy.style()
        .selector('node[type="' + type + '"]')
        .style({
          'background-color': configNode.nodesAvailable[type].color,
          'background-image': configNode.nodesAvailable[type].icon,
          'background-fit': 'cover'
        })
    })
  }


  $(sel) {
    return this.cy.$(sel)
  }

  registerEvents() {
    document.addEventListener("dataChanged", (e) => {
      switch (e.detail.task) {
        case "initElements":
          this.initElements(e.detail.data)
          break
        case "updateStyle":
          this.updateLayout()
          // only change to cytoscape view if elements available
          if (this.cy.$("node").length > 0) {
            showGraph()
          }
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
      }
    })
  }

  initEvents() {
    this.updateBind()

    this.cy.contextMenus({
      menuItems: [{
          id: 'remove',
          title: 'Remove',
          selector: 'node',
          onClickFunction: (event) => {
            if (!discardChanges())
              return

            sendEvent("data", {
              task: "deleteNode",
              data: event.cyTarget.id()
            })
          }
        },
        {
          id: 'add-successors',
          title: 'Connect successors',
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


            this.cy.on("mouseover", "node", {}, (_event) => {
              let evtToTarget = _event.target || _event.cyTarget
              this.cy.$('#shadowEdge').move({
                target: evtToTarget.data().id
              })
            })

            this.cy.on("click", "node", {}, (_event) => {
              let evtToTarget = _event.target || _event.cyTarget
              globals.unsavedChanges = false

              if (evtFromTarget == evtToTarget) {
                modal("Error", "Cant connect to same node")
              } else {
                sendEvent("data", {
                  task: "addEdge",
                  data: {
                    from: evtFromTarget.data().id,
                    to: evtToTarget.data().id
                  }
                })
              }

              this.cy.$('#shadowEdge').remove()
              this.updateBind()

              sendEvent("sidebar", {
                task: "showId",
                data: evtToTarget.data().id
              })
            })
          }
        },
        {
          id: 'remove',
          title: 'Remove',
          selector: 'edge',
          onClickFunction: (event) => {
            if (!discardChanges())
              return

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
            if (!discardChanges())
              return

            let pos = event.position || event.cyPosition
            sendEvent("sidebar", {
              task: "addNode",
              data: {
                pos: pos
              }
            })
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
    this.cy.on("click", evt => {
      closeSitebar()
    })

    this.cy.on("click", "node", {}, evt => {
      sendEvent("sidebar", {
        task: "showId",
        data: evt.cyTarget.id()
      })
    })
  }

  initElements(jsonData) {
    let eles = []
    this.cy.remove("*")


    this.addNodes(jsonData.children)
  }

  discard() {
    if (this.cy.$('#shadowEdge').length > 0)
      this.cy.$('#shadowEdge').remove()

    this.updateBind()
  }

  changeType(name, newType) {
    const ele = this.cy.$("node#" + name)
    const position = ele.position()


    let edgesToUpdate = this.cy.edges("[source='" + name + "'], [target='" + name + "']");
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


      if (target == name) {
        ele.data.source = source
        ele.data.target = name
      } else {
        ele.data.source = name
        ele.data.target = target
      }

      edges.push(ele)
    })

    edgesToUpdate.remove()
    ele.remove()
    this.addNode(name, newType, position)
    this.cy.add(edges)
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
          if(this.cy.edges("[source='" + pred + "'][target='" + child.name + "']").length == 0) {
            if(this.cy.$("#" + pred).length > 0) {
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


  renameNode(oldName, newName) {
    const ele = this.cy.$("node#" + oldName)

    let newEle = {
      group: "nodes",
      data: {
        id: newName
      },
      position: ele.position()
    }
    this.cy.add(newEle)


    let edgesToUpdate = this.cy.edges("[source='" + oldName + "'], [target='" + oldName + "']");
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

      if (target == oldName) {
        ele.data.source = source
        ele.data.target = newName
      } else {
        ele.data.source = newName
        ele.data.target = target
      }

      edges.push(ele)
    })

    ele.remove()
    edgesToUpdate.remove()
    this.cy.add(edges)
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

  updateLayout() {
    this.autoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout

    this.cy.makeLayout({
      name: localStorage.getItem("style") || config.cytoscape.defaultStyle
    }).run()
  }
}
