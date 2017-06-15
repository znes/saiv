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
    	this.map = L.map(id).setView([51.505, -0.09], 13)

		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo(this.map);
    }
    
    registerEvents() {
         document.addEventListener("explorer", (e)=> {
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
            }
        })
    }

    initElements(json) {
    	json.children.forEach(child => {
    		if(typeof child.pos != undefined) {
    			this.mapEle[child.name] = L.marker([child.pos.long, child.pos.lat]).addTo(this.map).bindPopup(child.name)


    			child.successors.forEach( succ => {
    				let index = json.children.findIndex(x => x.name==succ)
					if (index !== -1) {
						if(typeof json.children[index].pos != undefined) {
							var arrow = L.polyline([[child.pos.long, child.pos.lat], [json.children[index].pos.long, json.children[index].pos.lat]], {}).addTo(this.map);
    						var arrowHead = L.polylineDecorator(arrow).addTo(this.map);
    						arrowHead.setPatterns([
	            				{	offset: '100%', 
	            					repeat: 0, 
	            					symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true}})
	            				}
	        				]);
						}
					}
    				
    			})
    		}
    	})
    }

    renameNode() {

    }

    addNode() {

    }

    deleteNode() {

    }

    addEdge() {

    }

    deleteEdge() {

    }

}