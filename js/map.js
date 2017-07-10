class LeafleatMap {
	constructor(id) {
		this.mapEle = {

		};
		this.init(id)
        this.registerEvents()
		
		// debug	
	    window.map = () => {
	    	return this.map
	    }
    }

    init(id) {
    	this.map = L.map(id, {
            contextmenu: true,
            contextmenuWidth: 140,
            contextmenuItems: [{
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
                case "positionUpdate":
                    this.updatePosition(e.detail.data.name, e.detail.data.lat, e.detail.data.long)
                    break
            }
        })
    }

    initElements(json) {
    	json.children.forEach(child => {
    		if(typeof child.pos != undefined) {
                this.addNode(child.name,child.pos);
    		}
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

        this.addNode(newName, {lat: pos.lng, long: pos.lat})

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

    addNode(name, pos = null) {
        //console.log(additional)
        if (typeof pos.long != undefined) {
            this.mapEle[name] = {
                successors: {},
                marker: L.marker([pos.long, pos.lat],  {
                    contextmenu: true,
                    contextmenuItems: [{
                        text: 'Delete Node',
                        index: 0,
                        callback: e => { sendEvent("data", {
                            task: "deleteNode",
                            data: name
                        })}
                    }, {
                        separator: true,
                        index: 1
                    }]
                })
                .addTo(this.map)
                .bindPopup(name)
                .on("click", () => {
                    sendEvent("sidebar", {
                        task: "showId",
                        data: name
                    })
                })
            }
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
        //this.mapEle[name].
        delete this.mapEle[name]

    }

    addEdge(from, to) {
        if(typeof this.mapEle[from] != undefined && typeof this.mapEle[to] != undefined ) {
            var arrow = L.polyline([this.mapEle[from].marker.getLatLng(), this.mapEle[to].marker.getLatLng()], {
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


            var arrowHead = L.polylineDecorator(arrow).addTo(this.map)
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
    }

    deleteEdge(from, to) {
        console.log(from, to)
        this.map.removeLayer(this.mapEle[from].successors[to].arrow)
        this.map.removeLayer(this.mapEle[from].successors[to].head)
        delete this.mapEle[from].successors[to]
    }

    updatePosition(name, newLat, newLong) {
        console.log(name, newLat)

        this.mapEle[name].marker.setLatLng([newLat,newLong]);

        for (let [prob, data] of Object.entries(this.mapEle)) {
            if(prob == name) {
                for (let [succ, obj] of Object.entries(data.successors)) {
                    var latlngs = obj.arrow.getLatLngs()
                    latlngs.splice(0, 1, this.mapEle[name].marker.getLatLng())

                    obj.arrow.setLatLngs(latlngs)
                }
            }
            else {
                for (let [succ, obj] of Object.entries(data.successors)) {
                    if(succ == name) { 
                        var latlngs = obj.arrow.getLatLngs()
                        latlngs.splice(1, 1, this.mapEle[name].marker.getLatLng())

                        obj.arrow.setLatLngs(latlngs)
                    }
                }
            }
        }
        //this.map.removeLayer(this.mapEle[name].successors[to].arrow)
        //this.map.removeLayer(this.mapEle[name].successors[to].head)
        //delete this.mapEle[from].successors[to]
    }

    showCoordinates (e) {
        modal("Coordinates", "Latitude: " + e.latlng.lat + "</br>Longitude: " + e.latlng.lng )
    }

    centerMap (e) {
        let markers = []
        for (let [k, v] of Object.entries(this.mapEle)) {
            markers.push(v.marker)
        }
        let group = new L.featureGroup(markers);

        this.map.fitBounds(group.getBounds().pad(0.3));
    }

    zoomIn (e) {
        this.map.zoomIn()
    }

    zoomOut (e) {
        this.map.zoomOut()
    }
}