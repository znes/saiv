class LeafleatMap {
	constructor(id) {
		this.elements = {

		}
        this.redraw = {
            ghostPoly: null,
            name: null
        }


		this.init(id)
        this.registerEvents()
		
		// debug	
	    window.map = () => {
	    	return this.elements
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
                callback: e => { this.drawPolygon() }
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
                case "changeType":
                    this.changeType(e.detail.data.name, e.detail.data.type)
                    break
                case "addNode":
                    this.addNode(e.detail.data.name, e.detail.data.type, e.detail.data.pos)
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
                case "positionUpdate":
                    this.updatePosition(e.detail.data.name, e.detail.data.pos)
                    break
            }
        })
    }

    initElements(json) {
        this.removeExistingElements()


    	json.children.forEach(child => {
            this.addNode(child.name,  child.type, child.pos)
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
        let pos = this.elements[oldName].marker.getLatLng()
        let succs = this.elements[oldName].successors

        this.addNode(newName, this.elements[oldName].type, pos)

        // rename relative links
        for (let [property, data] of Object.entries(this.elements)) {
            if(property != oldName) {
                for (let [succ, obj] of Object.entries(this.elements[property].successors)) {
                    if(succ == oldName) {
                        this.deleteEdge(property, oldName)
                        this.addEdge(property, newName)
                    }
                }
            }
        }

        // remove Old 
        this.map.removeLayer(this.elements[oldName].marker)
        for (let [succ, obj] of Object.entries(succs)) {
            this.map.removeLayer(obj.arrow)
            this.map.removeLayer(obj.head)

            this.addEdge(newName, succ)
        }
        delete this.elements[oldName]
    }

    removeExistingElements() {
        for (let [k, v] of Object.entries(this.elements)) {
            if(v.marker != null) {
                this.map.removeLayer(v.marker)

                for (let [succ, obj] of Object.entries(v.successors)) {
                    this.deleteEdge(k, succ)
                }
            }
        }

        this.elements = {}
    }

    createNode(name, pos) {
        let obj = null
        if(this.elements[name].type == "polygon") {
            let posArr = null
            
            if(typeof pos.wkt != "undefined") {
                let wkt = new Wkt.Wkt()
                wkt.read(pos.wkt)
                posArr = wkt.toJson().coordinates
            }
            else {
                posArr = pos
            }

            obj = L.polygon(posArr, {
                contextmenu: true,
                contextmenuItems: [
                {
                    text: 'Change position',
                    index: 0,
                    callback: e => {
                        this.drawPolygon(name)
                    }
                }, {
                    separator: true,
                    index: 1
                }, {
                    text: 'Connect successors',
                    index: 2,
                    callback: e => {
                        this.connectSuccessor(e, name)
                    }
                },{
                    text: 'Delete',
                    index: 3,
                    callback: e => { 
                        sendEvent("data", {
                            task: "deleteNode",
                            data: name
                        }
                    )}
                }, {
                    separator: true,
                    index: 4
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
            //.bindPopup(name)
            .on("click", () => {
                sendEvent("sidebar", {
                    task: "showId",
                    data: name
                })
            })


        return obj        
    }

    changeType(name, newType) {
        let oldType = this.elements[name].type

        this.elements[name].type = newType
        if(this.elements[name].marker != null) {
            if(oldType == "polygon" || oldType != "polygon" && newType == "polygon") {
                this.deleteNode(name, false)
                // No Pos Data
                this.showButtonAddNodes()
            }
            else {
                var pos = this.elements[name].marker.getLatLng()
                this.elements[name].marker.remove()
                this.elements[name].marker = this.createNode(name, pos)
            }
        }
    }


    sidebarTextPolyCreation(wktText, name = "") {
        const body = $('<div></div>')
        let form = $('<form class="createPolyForm"></form>')
        form.append(createInput("name", "name", name, "text", true))
            .append(createInput("type", "type", "polygon", "text", true, "readonly"))
            .append(createInput("wkt", "pos_wkt", wktText, "hidden"))
            .append('<button class="btn btn-success">Save</button>')       

        body.append(form)
            .append('<button class="resetPoly btn btn-default">Reset</button>')
            .append('<button class="revertPoly btn btn-primary">Revert</button>')  

        sendEvent("sidebar", {
            task: "show",
            data: {
                head: "Create Polygon",
                body: form
            }   
        })
    }

    sidebarTextPolyPlacement(wktText, name = "") {
        const body = $('<div></div>')
        let form = $('<form class="createPolyForm"></form>')
        form.append(createInput("name", "name", name, "hidden"))
            .append(createInput("wkt", "pos_wkt", wktText, "hidden"))
            .append('<button class="btn btn-success">Save</button>')
            

        body.append(form)
            .append('<button class="resetPoly btn btn-default">Reset</button>')
            .append('<button class="revertPoly btn btn-primary">Revert</button>')

        sendEvent("sidebar", {
            task: "show",
            data: {
                head: "<h4>Place Polygon</h4>",
                body: body
            }
        })
    }

    discard() {
        if(this.redraw.ghostPoly != null) {
            this.redraw.ghostPoly.remove()
        }

        if(this.redraw.name != null && this.elements[this.redraw.name].marker != null) {
            // redraw OLD !!!
            this.elements[this.redraw.name].marker = this.createNode(this.redraw.name, this.redraw.pos)
        }
        this.map.off('click')


        sendEvent("sidebar", {
            task: "showId",
            data: this.redraw.name
        })
    }

    drawPolygon(name = null) {
        let currentPoints = [],
            that = this

        //registerDiscardEvent(this.redrawOld)

        if(name != null) {
            if(this.elements[name].marker != null) {
                this.redraw.pos = this.elements[name].marker.getLatLngs()[0]
                this.redraw.name = name

                this.elements[name].marker.remove()
            }
        }

        modal("Info", "Start adding Points to the map. You need to add at least 3 Points to the Map. Click submit when you are done.")
        globals.unsavedChanges = true


        updateBodyPoly()

        this.map.on('click', e => {
            if(this.redraw.ghostPoly != null) {
                this.redraw.ghostPoly.remove()
            }

            currentPoints.push([e.latlng.lat, e.latlng.lng])


            this.redraw.ghostPoly = L.polygon(currentPoints, {}).addTo(this.map)
            updateBodyPoly()
        })

        function updateBodyPoly() {
            let wktText = arrayToPolygonWkt(currentPoints)

            if(name != null) {
                that.sidebarTextPolyPlacement(wktText, name)
            }
            else {
                that.sidebarTextPolyCreation(wktText, $(".createPolyForm input#name").val())
            }

            $(".createPolyForm").submit((e) => {
                e.preventDefault()
                if (currentPoints.length > 2) {
                    if(name != null) {
                        sendEvent("data", {
                            task: "updatePosition",
                            data: readForm(".createPolyForm")
                        })
                        sendEvent("sidebar", {
                            task: "showId",
                            data: name
                        })
                    }
                    else {
                        var fromData = readForm(".createPolyForm")
                        sendEvent("data", {
                            task: "addNode",
                            data:  fromData
                        })
                    }
                    
                    that.map.off('click')
                    that.redraw.ghostPoly.remove()
                    that.redraw.ghostPoly = null
                    currentPoints = []

                    globals.unsavedChanges = false
                }
                else {
                    modal("Alarm", "At least 3 points required")
                }
            })

            $(".resetPoly").on("click", (e) => {
                if (that.redraw.ghostPoly != null)
                    that.redraw.ghostPoly.remove()
                
                that.redraw.ghostPoly = null
                currentPoints = []
                return false
            })

            $(".revertPoly").on("click", (e) => {
                if(that.redraw.ghostPoly != null)
                    that.redraw.ghostPoly.remove()
                if(currentPoints.length >= 1)
                    currentPoints.pop()

                that.redraw.ghostPoly = L.polygon(currentPoints, {}).addTo(that.map)
                that.updateBodyPoly(currentPoints)
                return false
            })
        }
    }


    addDefaultBind() {
        this.map.off("click")
        this.map.off("mousemove")
        for (let [property, data] of Object.entries(this.elements)) {
            if(data.marker != null) {
                data.marker.off("click")
                    .off("mouseover")
                    .off("mouseout")
                    .on("click", () => {
                        sendEvent("sidebar", {
                            task: "showId",
                            data: property
                        })
                    })
                    //.bindPopup(property)
            }
        }
    }



    connectSuccessor(evt, name) {
        function setClickable(target, value) {
            if(value && !target.options.clickable) {
                target.options.clickable = true;
                L.Path.prototype._initEvents.call(target);
                target._path.removeAttribute('pointer-events');
            } 
            else if(!value && target.options.clickable) {
                target.options.clickable = false;

                // undoing actions done in L.Path.prototype._initEvents
                L.DomUtil.removeClass(target._path, 'leaflet-clickable');
                L.DomEvent.off(target._container, 'click', target._onMouseClick);
                ['dblclick', 'mousedown', 'mouseover', 'mouseout', 'mousemove', 'contextmenu'].forEach(function(evt) {
                    L.DomEvent.off(target._container, evt, target._fireMouseEvent);
                });

                target._path.setAttribute('pointer-events', target.options.pointerEvents || 'none');
            }
        }



        let evtFromTarget = event.target || event.cyTarget
        let fromPos = this.getCoordinates(name)
        let hoverNode = false
        let mousePos = evt.latlng


        let arrow = L.polyline([fromPos, mousePos], {
            weight: 10,
            clickable: false,
            color: "black"
        })
        arrow.addTo(this.map)
            .bringToBack()


        /*let arrowHead = L.polylineDecorator(arrow).addTo(this.map)
        arrowHead.setPatterns([
            {   offset: '100%', 
                repeat: 0, 
                symbol: L.Symbol.arrowHead({pixelSize: 10, polygon: false, pathOptions: {stroke: true}})
            }
        ])
        function updateArrowHead() {
            arrowHead.setPaths(arrow)
        }*/

        this.map.on("mousemove", e => {
            if(!hoverNode) {
                arrow.setLatLngs([fromPos, e.latlng])
                //updateArrowHead()
            }
        })

        this.map.on("click", e => {
            arrow.remove()
            //arrowHead.remove()
            this.addDefaultBind()
        })

        // add onclick Marker
        for (let [property, data] of Object.entries(this.elements)) {
            if(property != name) {
                if(data.marker != null) {
                    data.marker.on("mouseover", () => {
                        console.log("enter")
                        hoverNode = true
                        arrow.setLatLngs([fromPos, this.getCoordinates(property)])
                        //updateArrowHead()
                    })

                    data.marker.on("mouseout", () => {
                        console.log("leave")
                        hoverNode = false
                        arrow.setLatLngs([fromPos, this.getCoordinates(property)])
                        //updateArrowHead()
                    })


                    data.marker.on("click", () => {
                        arrow.remove()
                        //arrowHead.remove()

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
        console.log("addNode")
        console.log(name, type, pos)
        this.elements[name] = {
            successors: {},
            marker: null,
            type: type
        }
        if(pos != null) {
            if(typeof pos.lng != "undefined" && typeof pos.lat != "undefined"  && type != "polygon" || typeof pos.wkt != "undefined" && type == "polygon") {
                this.elements[name].marker = this.createNode(name, pos)
            }
            else {
                this.showButtonAddNodes()
            }
        }
        else {
            this.showButtonAddNodes()
        }
    }

    getNoPosDragElements() {
        let dragContainer = $("<div class=\"dragContainer\"></div>"),
            polyContainer = $("<div class=\"listContainer\"></div>"),
            list = $("<div class=\"list-group\"></div>"),
            body = $("<div></div>")

        polyContainer.append(list)


        for (let [property, data] of Object.entries(this.elements)) {
            if(data.marker == null) {
                if(data.type == "polygon") {
                    let li = $("<a class=\"list-group-item\" href=\"#\">"+property+"</a>")
                    li.on("click", e => {
                        this.drawPolygon(property)
                    })
                    list.append(li)
                }
                else {
                    let letEle = $("<div class=\"dragArticle\"></div>")

                    let imgClone = $("<img>")
                        .prop("src", config.markerSettings.src)
                        .prop("data-name", property)
                        .prop("class", "dragImg")
                        .prop("width", config.markerSettings.width)
                        .prop("height", config.markerSettings.height)

                    letEle.append('<p class="dragMarkerName">' + property + '</p>')
                    letEle.append(imgClone)
                    dragContainer.append(letEle)
                }
            }
        }

        if(dragContainer.find("div").length > 0) {
            body.append("<p>Drag Makers into Map</p>")
            body.append(dragContainer)
        }
        if(list.find("a").length > 0) {
            body.append("<p>Click element to start adding area</p>")
            body.append(polyContainer)
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
            added = false

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
            if(added) {
                srcEle.parent().remove()
            }
            else {
                srcEle.parent().removeClass('moving');
            }
            srcEle = null
            srcName = null
        }
    }

    showButtonAddNodes() {
        if($(".alertMissingPositionBar").length == 0) {
            const alertButton = $('<div class="alertMissingPositionBar leaflet-control-zoom leaflet-bar leaflet-control"><a class="leaflet-control-zoom-in" href="#" title="Show Nodes" role="button" aria-label="Show Nodes">!</a></div>')
             $('.leaflet-top.leaflet-right').append(alertButton).on('click', e => {
            
                let head = "<h4>Elements without Positions</h4>"
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

    deleteNode(name, deleteRefs = true) {
        for (let [k, v] of Object.entries(this.elements)) {
            if(k!=name){
                for (let [succ, obj] of Object.entries(this.elements[k].successors)) {
                    if(succ == name) {
                        this.map.removeLayer(obj.arrow)
                        this.map.removeLayer(obj.head)
                        if(deleteRefs)
                            delete this.elements[k].successors[succ]
                    }
                }
            }
            else {
                this.map.removeLayer(this.elements[name].marker)
                this.elements[name].marker = null
                for (let [succ, obj] of Object.entries(this.elements[k].successors)) {
                    this.map.removeLayer(obj.arrow)
                    this.map.removeLayer(obj.head)
                }
                if(deleteRefs)
                    delete this.elements[name]
            }
        }
    }

    addEdge(from, to) {
        if(this.elements[from].marker != null && this.elements[to].marker != null ) {
            let arrow = L.polyline([this.getCoordinates(from), this.getCoordinates(to)], {
                weight: 5,
                color: "#9dbaea",
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
                {   
                    offset: '100%', 
                    repeat: 0, 
                    symbol: L.Symbol.arrowHead({polygon: false, pathOptions: {stroke: true, color: "#9dbaea"}})
                }
            ])


            this.elements[from].successors[to] = {
                arrow: arrow,
                head: arrowHead
            }
        }
        else {
            this.elements[from].successors[to] = {
                arrow: null,
                head: null
            }
        }
    }

    getCoordinates(name) {
        if(this.elements[name].type == "polygon") {
            // different implementations for polygons can be found here
            // https://stackoverflow.com/questions/22796520/finding-the-center-of-leaflet-polygon
            return this.elements[name].marker.getBounds().getCenter()
        }
        else {
            return this.elements[name].marker.getLatLng()
        }
    }

    deleteEdge(from, to) {
        if (this.elements[from].successors[to].arrow != null) {
            this.map.removeLayer(this.elements[from].successors[to].arrow)
            this.map.removeLayer(this.elements[from].successors[to].head)
            this.elements[from].successors[to].arrow = null
            this.elements[from].successors[to].head = null
        }
        delete this.elements[from].successors[to]
    }

    updatePosition(name, pos) {
        // checck if already on Map
        if(this.elements[name].marker != null) {
            if(this.elements[name].type == "polygon") {
                this.elements[name].marker.remove()
                this.elements[name].marker = this.createNode(name, pos)
            }
            else {
                this.elements[name].marker.setLatLng(pos)
            }
            // Update Connections
            for (let [prob, data] of Object.entries(this.elements)) {
                if(prob == name) {
                    for (let [succ, obj] of Object.entries(data.successors)) {
                        this.deleteEdge(name,succ)
                        this.addEdge(name,succ)
                    }
                }
                else {
                    for (let [succ, obj] of Object.entries(data.successors)) {
                        if(succ == name) { 
                            this.deleteEdge(prob, name)
                            this.addEdge(prob, name)
                        }
                    }
                }
            } 
            
        }
        // create Node and Successors
        else {
            this.elements[name].marker = this.createNode(name, pos)

            // check succs
            for (let [prob, data] of Object.entries(this.elements)) {
                if(prob == name) {
                    for (let [succ, obj] of Object.entries(data.successors)) {
                        // check if marker already exists
                        if(this.elements[succ].marker != null) {
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
        for (let [k, v] of Object.entries(this.elements)) {
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