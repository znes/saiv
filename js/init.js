/**
 * DOM Ready
 */
$(function() {
    var datam = new DataManager()
    var sb = new Sidebar(config.dom.sidebar)
    var cy = new createCy()
    var map = new LeafleatMap(config.dom.mapContainerId)

    //debug
    window.cy = cy


    // Opens Page Select Json
    selectJson()


    /**
     * init Menu Listener
     */
    $(config.dom.links.json).click(() => {
        selectJson()
    })

    $(config.dom.links.map).click(() => {
        showMap()
    })

    $(config.dom.links.home).click(() => {
        home()
    })

    $(config.dom.links.style).click(() => {
        selectStyle()
    })

    $(config.dom.links.jsonSettings).click(() => {
        jsonSettings()
    })


    /**
     * Add cytoscape events
     */
    cy.on("click", "node", {}, showNodeEvt)
    // Add Context Menu to Canvas
    cy.contextMenus({
        menuItems: [
            {
                id: 'remove',
                title: 'Remove',
                selector: 'node',
                onClickFunction: (event) => {
                    datam.deleteNode(event.cyTarget.id())
                    event.cyTarget.remove()
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

                    cy.add([{ group: "edges", data: {
                        id: "shadowEdge", source: evtFromTarget.data().id, 
                        target: evtFromTarget.data().id}}])


                    cy.on("mouseover", "node", {}, (_event) => {
                        var evtToTarget = _event.target || _event.cyTarget
                        cy.$('#shadowEdge').move({target: evtToTarget.data().id})
                    })

                    cy.on("click", "node", {}, (_event) => {
                        var evtToTarget = _event.target || _event.cyTarget 
                        if(evtFromTarget == evtToTarget ) {
                            modal("Error", "Cant connect to same node")
                        }
                        else if (evtToTarget.data().type == "scenario") {
                            modal("Error", "Cant be connected to type scenario")
                        }
                        else {
                            if(datam.addEdge(evtFromTarget.data().id, evtToTarget.data().id)) {
                                cy.add([{ group: "edges", data: { source: evtFromTarget.data().id, target: evtToTarget.data().id}}])
                            } else {
                                modal("Error", "Already exists")
                            }
                            showId(_event.cyTarget.id())
                        }
                        cy.$('#shadowEdge').remove()
                        unbindCy()
                    })
                }            
            },
            {
                id: 'remove',
                title: 'Remove',
                selector: 'edge',
                onClickFunction: (event) => {
                    datam.deleteEdge(event.cyTarget.source().id(), event.cyTarget.target().id()) 
                    event.cyTarget.remove()
                }
            },
            {
                id: 'add-node',
                title: 'Add node',
                coreAsWell: true,
                onClickFunction: (event) => {
                    var pos = event.position || event.cyPosition
                    sb.addNode(pos, cy.elements("node"))
                }
            },
            {
                id: 'center-map',
                title: 'Center Map',
                coreAsWell: true,
                onClickFunction: (event) => {
                    cy.reset()
                    cy.center()
                }
            },
            {
                id: 'relayout-elements',
                title: 'Relayout Elements',
                coreAsWell: true,
                onClickFunction: (event) => {
                    cy.makeLayout({
                        name: localStorage.getItem("style") || config.cytoscape.styles[0]
                    }).run()
                }
            }
            ]
          })



    // Init Event Reciver 
    document.addEventListener("dataReceived", (e) => {
        initListenerDataRevieved()

        datam.json = e.detail


        var eles = createCyElements(datam.json)
        cy.$("*").remove()
        cy.add(eles)
        cy.makeLayout({
            name: localStorage.getItem("style") || config.cytoscape.styles[0]
        }).run()

        showId(datam.json.children[0].name)
        showGraph();
    })

    document.addEventListener("renameNode", (e) => {
        var ele = cy.$("node#" + e.detail.oldName),
            eleData = ele.data().data;

        let newEle = {
            group: "nodes",
            data: {
                id: e.detail.newName
            },
            position: ele.position()
        }
        cy.add(newEle)
        

        var edgesToUpdate = cy.edges("[source='" + e.detail.oldName + "'], [target='" + e.detail.oldName + "']");
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

            
            if(target == e.detail.oldName) {
                ele.data.source = source
                ele.data.target = e.detail.newName
            }
            else {
                ele.data.source = e.detail.newName
                ele.data.target = target
            }

            edges.push(ele)
        })
        ele.remove();
        edgesToUpdate.remove();
        cy.add(edges)
    })


    document.addEventListener("addNode", (e) => {
        var data = e.detail

        datam.addNode(
            data
        )

        cy.add({
            group: "nodes",
            data: {
                id: data.name,
            },
            position: {
                x: parseInt(data.posx),
                y: parseInt(data.posy)
            }
        })

        showId(data.name)
    })

    document.addEventListener("addEdge", (e) => {
        cy.add([{ group: "edges", data: { source: e.detail.from, target: e.detail.to}}])
    })

    document.addEventListener("removeEdge", (e) => {
        cy.edges("[source='" + e.detail.from + "'][target='" + e.detail.to + "']").remove();
    })

    document.addEventListener("updateNode", (e) => {
        var data = e.detail
        
        datam.updateChildren(data)
        sb.createForm(datam.getElement(e.detail.name), datam.json.children)
    })


    document.addEventListener("setStyle", (e) => {
        var data = e.detail
        
        if(datam.json != null) {
            cy.makeLayout({
                name: localStorage.getItem("style") || config.cytoscape.styles[0]
            }).run()

            showGraph();
        }
    })


    function unbindCy() {
        cy.off('mouseover')
        cy.off('click')

        // Add default listener
        cy.on("click", "node", {}, showNodeEvt)
    }

    function showNodeEvt(evt) {
        showId(evt.cyTarget.id())
    }
    function showId(id) {        
        var data = datam.getElement(id);

        sb.showData(data)
        sb.createForm(data, datam.json.children)

        $(".editForm .addTag").on("click", () => {
            sb.addTag((newTag) => {
                datam.addTag(id, newTag)

                showId(id)
            })
        })

        $('.editForm .removeTag').on("click", function(){
            var tag = $(this).text().substring(7, $(this).text().length)
            datam.removeTag(id, tag)
            showId(id)
        })
    }

    function initListenerDataRevieved() {
        $(config.dom.links.graph).click(() => {
            setActiveMenuItem("Explorer")
            showGraph()
        }).click()

        $(config.dom.links.map).click(() => {
            setActiveMenuItem("Map")
            showMap()
        }).parent("li").removeClass("disabled")

        $(config.dom.links.download).click(() => {
            var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datam.json))
            $(config.dom.links.download).prop("href", "data:" + data)
            $(config.dom.links.download).prop("download", "data.json")
        }).parent("li").removeClass("disabled")
    }
})