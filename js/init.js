/**
 * DOM Ready
 */
$(function() {
    var datam = new DataManager()
    var sb = new sidebar()
    var cy = new createCy()

    //debug
    window.cy = cy


    // Opens Page Select Json
    selectJson()


    /**
     * init Menu Listener
     */
    $('.changeJson').click(() => {
        selectJson()
    })

    $('.home').click(() => {
        home()
    })

    $('.styleSettings').click(() => {
        selectStyle()
    })

    $('.jsonSettings').click(() => {
        jsonSettings()
    })


    /**
     * Add cytoscape events
     */
    cy.on("click", "node", {}, showNode)
    // Add Context Menu to Canvas
    cy.contextMenus({
        menuItems: [
            {
                id: 'remove',
                title: 'Remove',
                selector: 'node',
                onClickFunction: (event) => {
                    datam.deleteItem(event.cyTarget.id())
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
                        id: "testedge", source: evtFromTarget.data().id, 
                        target: evtFromTarget.data().id}}])


                    cy.on("mouseover", "node", {}, (_event) => {
                        var evtToTarget = _event.target || _event.cyTarget
                        cy.$('#testedge').move({target: evtToTarget.data().id})
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
                            showNode(_event)
                        }
                        cy.$('#testedge').remove()
                        unbindCy()
                    })
                }            
            },
            {
                id: 'add-node',
                title: 'Add node',
                coreAsWell: true,
                onClickFunction: (event) => {
                    var pos = event.position || event.cyPosition
                    sb.addNode($(".form"), pos, cy.elements("node"))
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
                title: 'Reorder Elements',
                coreAsWell: true,
                onClickFunction: (event) => {
                    cy.makeLayout({
                        name: "dagre"
                    }).run()
                }
            }
            ]
          })



    // Init Event Reciver 
    document.addEventListener("dataReceived", (e) => {
        hideContentPage()
        initListenerDataRevieved()

        datam.json = e.detail

        var eles = createCyElements(datam.json)
        cy.$("*").remove()
        cy.add(eles)
        cy.makeLayout({
            name: "dagre"
        }).run()

        sb.showData(cy.$("node#" + datam.json.name).data())
        sb.createForm($(".form"), cy.$("node#" + datam.json.name), [])
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

        sb.createForm($(".form"), cy.$("node#" + data.name), cy.elements("node"))
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
        sb.createForm($(".form"), datam.getElement(e.detail.name), datam.json.children)
    })


    function unbindCy() {
        cy.off('mouseover')
        cy.off('click')

        // Add default listener
        cy.on("click", "node", {}, showNode)
    }

    function showNode(evt) {
        var id = evt.cyTarget.id();
        var data = datam.getElement(id);

        console.log(data)
        sb.showData(data)
        sb.createForm($(".form"), data, datam.json.children)

        $(".editForm .addTag").on("click", () => {
            sb.addTag($(".form"), (newTag) => {
                datam.addTag(id, newTag)

                showNode(evt)
            })
        })

        $('.editForm .removeTag').on("click", function(){
            var tag = $(this).text().substring(7, $(this).text().length)
            datam.removeTag(id, tag)
            showNode(evt)
        })
    }

    function initListenerDataRevieved() {
        $(".navbar .shoWExplorer").click(() => {
            setActiveMenuItem("Explorer")
            hideContentPage()
        }).click()

        $(".navbar .downloadJson").click(() => {
            var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datam.json))
            $('.downloadJson').prop("href", "data:" + data)
            $('.downloadJson').prop("download", "data.json")
        }).parent("li").removeClass("disabled")
    }
})