/**
 * DOM Ready
 */
$(function() {
    Promise.all(initImages())
    .then( ()=> {
        console.log("fertig")
  

        let dataManager = new DataManager()
        let sb = new Sidebar(config.dom.sidebar)
        let cy = new CyptoScape(config.dom.canvasContainer)
        let map = new LeafleatMap(config.dom.mapContainerId)


        // Init File Drop Events
        initDropEvents()
        // Open Page home
        home()


        /**
         * init menu listener
         */
        $(config.dom.links.json).click(() => {
            if(discardChanges()) {
                openJsonSelection()
            }
        })

        $(config.dom.links.home).click(() => {
            if(discardChanges()) {
                home()
            }
        })

        $(config.dom.links.style).click(() => {
            selectStyle()
        })

        $(config.dom.links.scenario).click(() => {
            scenario(dataManager.getScenario())
        })

        $(config.dom.links.nodeSettings).click(() => {
            nodeSettings()
        })

        


        document.addEventListener("discardChanges", (e) => {
            if($(".navbar li.active").length == 1) {
                let activeLink = $(".navbar li.active").text()
                switch (activeLink) {
                    case "Map":
                        map.discard()
                        break
                    case "Graph Explorer":
                        cy.discard()
                        break
                }
            }
        })


        document.addEventListener("sidebar", (e) => {
            switch(e.detail.task) {
                case "showId":
                    showId(e.detail.data)
                    break
                case "addNode":
                    sb.addNode(e.detail.data.pos)
                    break
                case "show":
                    sb.show(e.detail.data.head, e.detail.data.body)
                    break;
            }
        })

        // Init Event Reciver 
        document.addEventListener("dataReceived", (e) => {
            initListenerDataRevieved()
            dataManager.json = e.detail

            sendEvent("dataChanged", {
                task: "initElements",
                data: dataManager.json
            })

            showGraph()
        })


        function showId(id) {
            let data = dataManager.getElement(id)

            sb.updateNodeForm(data, dataManager.getAllElements())
        }

        function initListenerDataRevieved() {
            $(config.dom.links.graph)
                .off("click")
                .on("click", () => {
                    if(discardChanges()) {
                        setActiveMenuItem("Explorer")
                        showGraph()
                    }
                })
                .click()

            $(config.dom.links.map)
                .off("click")
                .on("click", () => {
                    if(discardChanges()) {
                        setActiveMenuItem("Map")
                        showMap()
                    }
                })
                .parent("li").removeClass("disabled")

            $(config.dom.links.download)
                .off("click")
                .on("click", () => {
                    let bool = confirm("Attach Explorer Positions to json?")
                    let data = dataManager.json
                    let urlString = "text/json;charset=utf-8,"

                    if(bool) {
                        for (let i = 0; i < data.children.length; i++) {
                            if(typeof data.children[i].pos == "undefined") 
                                data.children[i].pos = {}
                            Object.assign(data.children[i].pos, cy.$("#" + data.children[i].name).position())
                        }
                    }
                    else {
                        for (let i = 0; i < data.children.length; i++) {
                            if(typeof data.children[i].pos != "undefined") {
                                if(typeof data.children[i].pos.x != "undefined")
                                    delete data.children[i].pos.x;
                                if(typeof data.children[i].pos.y != "undefined")
                                    delete data.children[i].pos.y;
                            }
                        }  
                    }
                    urlString += encodeURIComponent(JSON.stringify(data))

                    $(config.dom.links.download).prop("href", "data:" + urlString)
                    $(config.dom.links.download).prop("download", "data.json")
                })
                .parent("li").removeClass("disabled")
        }
    })  
})