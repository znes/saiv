/**
 * DOM Ready
 */
$(function() {
    var dataManager = new DataManager()
    var sb = new Sidebar(config.dom.sidebar)
    var cy = new CyptoScape(config.dom.canvasContainer)
    var map = new LeafleatMap(config.dom.mapContainerId)


    // Opens Page "Select Json"
    openJsonSelection()


    /**
     * init menu listener
     */
    $(config.dom.links.json).click(() => {
        openJsonSelection()
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

    


    document.addEventListener("sidebar", (e) => {
        switch(e.detail.task) {
            case "showId":
                showId(e.detail.data)
                break
            case "addNode":
                sb.addNode(e.detail.data.pos, e.detail.data.eles)
                break
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

        showId(dataManager.json.children[0].name)
        showGraph();
    })


    function showId(id) {        
        var data = dataManager.getElement(id)

        sb.showData(data)
        sb.createForm(data, dataManager.json.children)
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
            var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataManager.json))
            $(config.dom.links.download).prop("href", "data:" + data)
            $(config.dom.links.download).prop("download", "data.json")
        }).parent("li").removeClass("disabled")


        $(config.dom.links.downloadJsonPos).click(() => {
            let data = dataManager.json
            for (var i = 0; i < data.children.length; i++) {
                if(typeof data.children[i].pos == "undefined") data.children[i].pos = {}

                Object.assign(data.children[i].pos, cy.$("#" + data.children[i].name).position())
            }
            //let data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataManager.json))
            let urlString = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
            $(config.dom.links.downloadJsonPos).prop("href", "data:" + urlString)
            $(config.dom.links.downloadJsonPos).prop("download", "data.json")
        }).parent("li").removeClass("disabled")
    }
})