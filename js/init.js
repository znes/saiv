/**
 * DOM Ready
 */
$(function() {
    var datam = new DataManager()
    var sb = new Sidebar(config.dom.sidebar)
    var cy = new CyptoScape(config.dom.canvasContainer)
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

    document.addEventListener("explorer", (e)=> {
        switch(e.detail.task) {
            case "updateStyle": 
                if(datam.json != null) {
                    cy.updateLayout()

                    showGraph()
                }
                break;
            case "renameNode":
                cy.renameNode(e.detail.data.oldName, e.detail.data.newName)
                //sb.showId(e.detail.data)
                break
            case "addNode":
                cy.addNode(e.detail.data.name, e.detail.data.additional)
                //sb.addNode(e.detail.data.pos, e.detail.data.eles)
                break
            case "deleteNode":
                cy.deleteNode(e.detail.data)
                break
            case "addEdge":
                cy.addEdge(e.detail.data.from, e.detail.data.to)
                break;
            case "deleteEdge":
                cy.deleteEdge(e.detail.data.from, e.detail.data.to)
        }
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
        datam.json = e.detail

        cy.initElements(createCyElements(datam.json))       
        showId(datam.json.children[0].name)
        showGraph();
    })


    function showId(id) {        
        var data = datam.getElement(id)

        sb.showData(data)
        sb.createForm(data, datam.json.children)
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