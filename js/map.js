class LeafleatMap {
	constructor(id) {
		this.mapEle = {

		}
		this.init(id)
        this.registerEvents()
		
		// debug	
	    window.map = () => {
	    	return this.mapEle
	    }
    }

    init(id) {
    	this.map = L.map(id, {
            center: [51.505, -0.09],
            zoom: 11,
            contextmenu: true,
            contextmenuWidth: 140,
            contextmenuItems: [{
                text: 'Add Node',
                callback: e => { 
                    sendEvent("sidebar", {
                        task: "addNode",
                        data: {
                            pos: e.latlng
                        }
                    })
                }
            },{
                text: 'Add Polygon',
                callback: e => { this.drawPolygon(e) }
            },{
                text: 'Show coordinates',
                callback: e => { this.showCoordinates(e) }
            }, {
                text: 'Center map',
                callback: e => { this.centerMap(e) }
            }, {
                text: 'Zoom in',
                callback: e => { this.zoomIn(e) }
            }, {
                text: 'Zoom out',
                callback: e => { this.zoomOut(e) }
            }]
        })
        //.setView([51.505, -0.09], 13)

		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo(this.map);
    }
    
    registerEvents() {
         document.addEventListener("dataChanged", (e)=> {
            switch(e.detail.task) {
                case "initElements": 
                    this.initElements(e.detail.data)
                    break
                case "updateStyle": 
                    //if(this.cy.$("nodes").length > 0) 
                    //this.updateLayout()
                    break
                case "renameNode":
                    this.renameNode(e.detail.data.oldName, e.detail.data.newName)
                    break
                case "addNode":
                    this.addNode(e.detail.data.name, e.detail.data.type, e.detail.data.pos)
                    break
                /*case "addPolygon":
                    this.addPoly(e.detail.data.name, e.detail.data.wkt)
                    break*/
                case "deleteNode":
                    this.deleteNode(e.detail.data)
                    break
                case "addEdge":
                    this.addEdge(e.detail.data.from, e.detail.data.to)
                    break
                case "deleteEdge":
                    this.deleteEdge(e.detail.data.from, e.detail.data.to)
                    break
                case "positionUpdate":
                    this.updatePosition(e.detail.data.name, e.detail.data.pos)
                    break
            }
        })
    }

    initElements(json) {
        this.removeExistingElements()


    	json.children.forEach(child => {
    		//if(typeof child.pos != "undefined") {
            this.addNode(child.name,  child.type, child.pos)
    		//}
            //else {
            //    this.addNode(child.name, child.type, child.pos)
            //}
    	})

        json.children.forEach(child => {
            child.successors.forEach( succ => {
                let index = json.children.findIndex(x => x.name==succ)
                if (index !== -1) {
                    this.addEdge(child.name, succ)
                }
            })
        })

        this.centerMap()
    }

    renameNode(oldName, newName) {
        let pos = this.mapEle[oldName].marker.getLatLng()
        let succs = this.mapEle[oldName].successors

        this.addNode(newName, this.mapEle[oldName].type, pos)

        // rename relative links
        for (let [property, data] of Object.entries(this.mapEle)) {
            if(property != oldName) {
                for (let [succ, obj] of Object.entries(this.mapEle[property].successors)) {
                    if(succ == oldName) {
                        this.deleteEdge(property, oldName)
                        this.addEdge(property, newName)
                    }
                }
            }
        }

        // remove Old 
        this.map.removeLayer(this.mapEle[oldName].marker)
        for (let [succ, obj] of Object.entries(succs)) {
            this.map.removeLayer(obj.arrow)
            this.map.removeLayer(obj.head)

            this.addEdge(newName, succ)
        }
        delete this.mapEle[oldName]
    }

    removeExistingElements() {
        for (let [k, v] of Object.entries(this.mapEle)) {
            if(v.marker != null) {
                this.map.removeLayer(v.marker)

                for (let [succ, obj] of Object.entries(v.successors)) {
                    this.map.removeLayer(obj.arrow)
                    this.map.removeLayer(obj.head)
                }
            }
        }

        this.mapEle = {}
    }

    createNode(name, type, pos) {
        let obj
        if(type == "polygon") {
            let wkt = new Wkt.Wkt()
            wkt.read(pos.wkt)

            obj = L.polygon(wkt.toJson(), {
                contextmenu: true,
                contextmenuItems: [{
                    text: 'Connect successors',
                    index: 0,
                    callback: e => {
                        this.connectSuccessor(e, name)
                    }
                },{
                    text: 'Delete',
                    index: 1,
                    callback: e => { sendEvent("data", {
                        task: "deleteNode",
                        data: name
                    })}
                }, {
                    separator: true,
                    index: 2
                }]
            }) 
        }
        else {
            obj = L.marker(pos,  {
                contextmenu: true,
                contextmenuItems: [{
                    text: 'Connect successors',
                    index: 0,
                    callback: e => {
                        this.connectSuccessor(e, name)
                    }
                },{
                    text: 'Delete',
                    index: 1,
                    callback: e => { sendEvent("data", {
                        task: "deleteNode",
                        data: name
                    })}
                }, {
                    separator: true,
                    index: 2
                }]
            })
        }

        obj.addTo(this.map)
            .bindPopup(name)
            .on("click", () => {
                sendEvent("sidebar", {
                    task: "showId",
                    data: name
                })
            })


        return obj        
    }

    sidebarTextPolyCreation(wktText, name = "") {
        let form = $('<form class="createPolyForm"></form>')
        form.append(createInput("name", "name", name, "text", true))
        form.append(createInput("type", "type", "polygon", "text", true, "disabled"))

        form.append(createInput("wkt", "pos_wkt", wktText, "hidden"))


        form.append('<input type="submit" name="Submit" value="Submit"/>')
        form.append('<button class="resetPoly">Reset</button>')
        form.append('<button class="revertPoly">Revert</button>')         


        sendEvent("sidebar", {
            task: "show",
            data: {
                head: "Crete Polygon",
                body: form
            }
        })
    } 

    drawPolygon(e) {
        let currentPoints = [],
            ghostPoly = null,
            that = this

        modal("Info", "Start adding Points to the map. You need to add at least 3 Points to the Map. Click submit when you are done.")
        globals.unsavedChanges = true

        updateBodyPoly(currentPoints)

        this.map.on('click', e => {
            if(ghostPoly != null) {
                ghostPoly.remove()
            }


            currentPoints.push([e.latlng.lat, e.latlng.lng])
            ghostPoly = L.polygon(currentPoints, {}).addTo(this.map)
            updateBodyPoly(currentPoints)
        })

        function updateBodyPoly() {
            let wktText = 'POLYGON (' + currentPoints.toString() + ')'
            that.sidebarTextPolyCreation(wktText, $(".createPolyForm input#name").val())

            $(".createPolyForm").submit((e) => {
                e.preventDefault()
                if (currentPoints.length > 2) {
                    sendEvent("data", {
                        task: "addNode",
                        data: readForm(".createPolyForm")
                    })

                    that.map.off('click')
                    ghostPoly.remove()
                    ghostPoly = null
                    currentPoints = []

                    globals.unsavedChanges = false
                }
                else {
                    modal("Alarm", "At least 3 points required")
                }
            })

            $(".resetPoly").on("click", (e) => {
                if (ghostPoly != null)
                    ghostPoly.remove()
                
                ghostPoly = null
                currentPoints = []
                return false
            })

            $(".revertPoly").on("click", (e) => {
                if(ghostPoly != null)
                    ghostPoly.remove()
                if(currentPoints.length >= 1)
                    currentPoints.pop()

                ghostPoly = L.polygon(currentPoints, {}).addTo(that.map)
                updateBodyPoly(currentPoints)
                return false
            })
        }
    }


    drawPoly(wktString) {
        let wkt = new Wkt.Wkt()
        wkt.read(wktString)

        let obj = L.polygon(wkt.toJson(), {
            contextmenu: true,
            contextmenuItems: [{
                text: 'Connect successors',
                index: 0,
                callback: e => {
                    this.connectSuccessor(e, name)
                }
            },{
                text: 'Delete',
                index: 1,
                callback: e => { sendEvent("data", {
                    task: "deleteNode",
                    data: name
                })}
            }, {
                separator: true,
                index: 2
            }]}).addTo(this.map);

        obj.bindPopup(name)
            .on("click", () => {
                sendEvent("sidebar", {
                    task: "showId",
                    data: name
                })
            })

        return obj
    }

    addDefaultBind() {
        for (let [property, data] of Object.entries(this.mapEle)) {
            if(data.marker != null) {
                data.marker.off("click")
                    .bindPopup(property)
                    .on("click", () => {
                        sendEvent("sidebar", {
                            task: "showId",
                            data: property
                        })
                    })
            }
        }
    }

    connectSuccessor(evt, name) {
        let evtFromTarget = event.target || event.cyTarget
        let fromPos = this.mapEle[name].marker.getLatLng()
        let mousePos = evt.latlng


        let arrow = L.polyline([fromPos, mousePos], {
            weight: 15
        }).addTo(this.map)


        let arrowHead = L.polylineDecorator(arrow).addTo(this.map)
        arrowHead.setPatterns([
            {   offset: '100%', 
                repeat: 0, 
                symbol: L.Symbol.arrowHead({pixelSize: 10, polygon: false, pathOptions: {stroke: true}})
            }
        ])        

        this.map.on("mousemove", e => {
            arrow.setLatLngs([fromPos, e.latlng])
        })

        this.map.on("click", e => {
            arrow.remove()
            arrowHead.remove()
            this.addDefaultBind()
        })

        // add onclick Marker
        for (let [property, data] of Object.entries(this.mapEle)) {
            if(property != name) {
                if(data.marker != null) {
                    data.marker.on("click", () => {
                        arrow.remove()
                        arrowHead.remove()
                        this.addDefaultBind()

                        sendEvent("data", {
                            task: "addEdge",
                            data: {
                                from: name,
                                to: property
                            }
                        })

                        sendEvent("sidebar", {
                            task: "showId",
                            data: property
                        })
                    })
                }
            }
        }
    }

    addNode(name, type, pos = null) {
        //console.log(additional)
        this.mapEle[name] = {
            successors: {},
            marker: null,
            type: type
        }
        if(typeof pos != "undefined") {
            if(typeof pos.lng != "undefined" && typeof pos.lat != "undefined" || typeof pos.wkt != "undefined" ) {
                this.mapEle[name].marker = this.createNode(name, type, pos)
            }
            else {
                this.showButtonAddNodes()
            }
        }
        else {
            this.showButtonAddNodes()
        }
    }

    /*addPoly(name, wkt = null) {
        //console.log(additional)
        this.mapEle[name] = {
            successors: {},
            marker: null,
            type: "polygon"
        }

        this.mapEle[name].marker = this.drawPoly(wkt)

        this.mapEle[name].marker.bindPopup(name)
            .on("click", () => {
                sendEvent("sidebar", {
                    task: "showId",
                    data: name
                })
            })
    }*/



    getNoPosDragElements() {
        let body = $("<div class=\"dragContainer\"></div>")
        //let imgSrc = $(".leaflet-marker-icon").first()


        for (let [property, data] of Object.entries(this.mapEle)) {
            if(data.marker == null) {
                let letEle = $("<div class=\"dragArticle\"></div>")

                let imgClone = $("<img>")
                    .prop("src", config.markerSettings.src)
                    .prop("data-name", property)
                    .prop("class", "dragImg")
                    .prop("width", config.markerSettings.width)
                    .prop("height", config.markerSettings.height)

                letEle.append('<p class="dragMarkerName">' + property + '</p>')
                letEle.append(imgClone)
                body.append(letEle)
            }
        }

        return body
    }

    registerDragEvents(eles) {
        let srcEle = null
        let srcName = null
        let that = this
        let added = false


        eles.each((index,item) => {
            item.addEventListener('dragstart', handleDragStart, false);
            item.addEventListener('dragend', handleDragEnd, false);
        })


        $("#" + config.dom.mapContainerId)
            .off('dragenter')
            .off('drop')
            .off('dragleave')
            .on('dragenter', handleDragEnter)
            .on('drop', handleDrop)
            .on('dragleave', handleDragLeave)

        function handleDragStart(e) {
            //console.log("handleDragStart")
            srcEle = $(this)
            srcName = srcEle.parent().find("p").text()
            srcEle.parent().addClass('moving')

            let img = new Image()
            img.crossOrigin="anonymous"
            img.src = srcEle.prop("src")

            var canvas = document.createElement('canvas');
            canvas.width = "25";
            canvas.height = "41";
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            var canvasImage = new Image();
            canvasImage.crossOrigin="anonymous"
            canvasImage.src = canvas.toDataURL();
            document.body.append(canvasImage)

            e.dataTransfer.setDragImage(canvasImage, 0, 0)
            //e.dataTransfer.setDragImage(img, -50, -50);
        }

        function handleDragEnter(e) {
            //console.log("handleDragEnter")
            // this / e.target is the current hover target.
            this.classList.add('over')
        }

        function handleDragLeave(e) {
            //console.log("handleDragLeave")
            this.classList.remove('over');  // this / e.target is previous target element.
        }

        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation() // stops the browser from redirecting.
            }
            e.preventDefault()
            let mousePos = that.map.mouseEventToLatLng(e)

            sendEvent("data", {
                task: "updatePosition",
                data: {
                    name: srcName,
                    pos: mousePos
                }
            })

            added = true
            this.classList.remove('over')
            return false
        }

        function handleDragEnd(e) {
            //console.log("handleDragEnd")
            // this/e.target is the source node.
            
            console.log(handleDragEnd)
            console.log("added")
            console.log(added)
            if(added) {
                srcEle.parent().remove()
            }
            else {
                srcEle.parent().addClass('moving');
            }
            srcEle = null
            srcName = null
        }
    }

    showButtonAddNodes() {
        if($(".alertMissingPositionBar").length == 0) {
            const alertButton = $('<div class="alertMissingPositionBar leaflet-control-zoom leaflet-bar leaflet-control"><a class="leaflet-control-zoom-in" href="#" title="Show Nodes" role="button" aria-label="Show Nodes">!</a></div>')
             $('.leaflet-top.leaflet-right').append(alertButton).on('click', e => {
            
                let head = "Elements without Positions"
                let body = this.getNoPosDragElements()

                this.registerDragEvents(body.find("img"))
                


                sendEvent("sidebar", {
                    task: "show",
                    data: {
                        head: head,
                        body: body
                    }
                })
            })
        }
    }

    deleteNode(name) {
        for (let [k, v] of Object.entries(this.mapEle)) {
            if(k!=name){
                for (let [succ, obj] of Object.entries(this.mapEle[k].successors)) {
                    if(succ == name) {
                        this.map.removeLayer(obj.arrow)
                        this.map.removeLayer(obj.head)
                        delete this.mapEle[k].successors[succ]
                    }
                }
            }
            else {
                this.map.removeLayer(this.mapEle[name].marker)
                for (let [succ, obj] of Object.entries(this.mapEle[k].successors)) {
                    this.map.removeLayer(obj.arrow)
                    this.map.removeLayer(obj.head)
                }
                delete this.mapEle[name]
            }
        }
        delete this.mapEle[name]
    }

    addEdge(from, to) {
        if(this.mapEle[from].marker != null && this.mapEle[to].marker != null ) {
            let arrow = L.polyline([this.mapEle[from].marker.getLatLng(), this.mapEle[to].marker.getLatLng()], {
                weight: 10,
                contextmenu: true,
                contextmenuItems: [{
                    text: 'Delete Edge',
                    index: 0,
                    callback: e => {
                        sendEvent("data", {
                            task: "deleteEdge",
                            data: {
                                from: from,
                                to: to
                            }
                    })}
                }, {
                    separator: true,
                    index: 1
                }]
            }).addTo(this.map)


            let arrowHead = L.polylineDecorator(arrow).addTo(this.map)
            arrowHead.setPatterns([
                {   offset: '100%', 
                    repeat: 0, 
                    symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true}})
                }
            ])


            this.mapEle[from].successors[to] = {
                arrow: arrow,
                head: arrowHead
            }
        }
        else {
            this.mapEle[from].successors[to] = {
                arrow: null,
                head: null
            }
        }
    }

    deleteEdge(from, to) {
        this.map.removeLayer(this.mapEle[from].successors[to].arrow)
        this.map.removeLayer(this.mapEle[from].successors[to].head)
        delete this.mapEle[from].successors[to]
    }

    updatePosition(name, pos) {
        // checck if already on Map
        if(this.mapEle[name].marker != null) {
            this.mapEle[name].marker.setLatLng(pos);


            // Update Connections
            for (let [prob, data] of Object.entries(this.mapEle)) {
                if(prob == name) {
                    for (let [succ, obj] of Object.entries(data.successors)) {
                        let latlngs = obj.arrow.getLatLngs()
                        latlngs.splice(0, 1, [pos.lat,pos.lng])

                        obj.arrow.setLatLngs(latlngs)
                    }
                }
                else {
                    for (let [succ, obj] of Object.entries(data.successors)) {
                        if(succ == name) { 
                            let latlngs = obj.arrow.getLatLngs()
                            latlngs.splice(1, 1, [pos.lat,pos.lng])

                            obj.arrow.setLatLngs(latlngs)
                        }
                    }
                }
            }
        }
        // create Node and Successors
        else {
            this.mapEle[name].marker = this.createNode(name, this.mapEle[name].type, pos)

            // check succs
            for (let [prob, data] of Object.entries(this.mapEle)) {
                if(prob == name) {
                    for (let [succ, obj] of Object.entries(data.successors)) {
                        // check if marker already exists
                        if(this.mapEle[succ].marker != null) {
                            this.addEdge(name, succ)
                        }
                    }
                }
                else {
                    for (let [succ, obj] of Object.entries(data.successors)) {
                        if(succ == name) { 
                            if(data.marker != null) {
                                this.addEdge(prob, name)
                            }
                        }
                    }
                }
            }
        }
    }

    showCoordinates (e) {
        modal("Coordinates", "Latitude: " + e.latlng.lat + "</br>Longitude: " + e.latlng.lng )
    }

    centerMap (e) {
        let markers = []
        for (let [k, v] of Object.entries(this.mapEle)) {
            if(v.marker != null)
                markers.push(v.marker)
        }
        if(markers.length > 0) {
            let group = new L.featureGroup(markers)
            this.map.fitBounds(group.getBounds().pad(0.3))
        }
    }

    zoomIn (e) {
        this.map.zoomIn()
    }

    zoomOut (e) {
        this.map.zoomOut()
    }
}