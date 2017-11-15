class LeafleatMap {
  constructor(id) {
    // Set variables
    this.elements = {}
    this.redraw = {
      ghostPoly: null,
      name: null
    }
    this.shadowEdge = null
    this.focusedElement = null
    this.icons = {}
    this.containerElement = $("#" + id)

    this.init(id)
  }

  init(id) {
    this.extendSidebar()

    this.map = L.map(id, {
      // Flensburg
      center: [54.79118460009706, 9.434165954589844],
      zoom: 11,
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuItems: [{
        text: 'Add Node',
        callback: e => {
          if (discardChanges())
            sendEvent("sidebar", {
              task: "addNode",
              data: {
                pos: e.latlng
              }
            })
        }
      }, {
        text: 'Show coordinates',
        callback: e => {
          modal("Coordinates", "Latitude: " + e.latlng.lat + "</br>Longitude: " + e.latlng.lng)
        }
      }, {
        text: 'Center map',
        callback: e => {
          this.centerMap(e)
        }
      }, {
        text: 'Zoom in',
        callback: e => {
          this.map.zoomIn()
        }
      }, {
        text: 'Zoom out',
        callback: e => {
          this.map.zoomOut()
        }
      }]
    })

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(this.map);


    this.alertButton = $('<div class="alertMissingPositionBar leaflet-control-zoom leaflet-bar leaflet-control"><a class="leaflet-control-zoom-in" href="#" title="Show Nodes" role="button" aria-label="Show Nodes">!</a></div>')
    $('.leaflet-top.leaflet-right')
      .append(this.alertButton)

    this.alertButton.hide()
      .on('click', e => {
        if (!discardChanges())
          return

        let head = "<h4>Elements without Positions</h4>"
        let body = this.getNoPosElements()

        this.registerDragEvents(body.find("img"))


        sendEvent("sidebar", {
          task: "show",
          data: {
            head: head,
            body: body
          }
        })
      })

    // Init Menu Listener
    $(".navbar .mapSettings").on("click", e => {
      this.openSettingsModal()
    })

    this.initMarkers()
    this.registerEvents()
    this.addDefaultBind()
  }

  //
  initMarkers() {
    let cssRules = $("<style></style>")

    Object.keys(configNode.nodesAvailable).forEach(type => {
      this.icons[type] = L.icon({
        iconUrl: configNode.nodesAvailable[type].icon,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        className:  "markerIcon-" + type
      })

      cssRules.append(`.markerIcon-${type} {background-color: ${configNode.nodesAvailable[type].color}}`)
    })

    $('head').append(cssRules)
  }

  registerEvents() {
    document.addEventListener("dataChanged", (e) => {
      switch (e.detail.task) {
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
          this.changeType(e.detail.data.name, e.detail.data.type, e.detail.data.geometry_type)
          break
        case "addNode":
          this.addNode(e.detail.data.name, e.detail.data.type, e.detail.data.pos, e.detail.data.geometry_type)
          break
        case "addNodes":
          this.addNodes(e.detail.data)
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
          this.updatePosition(e.detail.data.name, e.detail.data.pos, e.detail.data.geometry_type)
          break
        case "focusNode":
          this.focusNode(e.detail.data)
          break
      }
    })
  }

  initElements(json) {
    this.removeExistingElements()
    this.addNodes(json.children)
    this.centerMap()
  }

  extendSidebar() {
    Sidebar.onOpenShowId((e)=>{
      this.addPositionToSidebar(e.detail.data)
    })()
  }

  addPositionToSidebar(name) {
    const setPositionEle = $('<a href="#" class="btn btn-success setPosition">Set Position</a>')
    let that = this
    $(".editForm").append(setPositionEle)

    setPositionEle.on("click", e => {
      $(".contentPage").css("visibility", "hidden")
      $("#map").css("visibility", "visible")
      setActiveMenuItem(".showMap")

      switch (this.elements[name].geometry_type) {
        case "polygon":
          console.log("Listener Poly");
          that.drawPolygon(name)
          break
        case "line":
          console.log("Listener Line");
          that.drawLine(name)
          break
        case "point":
          console.log("Listener Line");
          this.drawPoint(name)
      }
    })
  }

  renameNode(oldName, newName) {
    let pos = this.elements[oldName].marker.getLatLng()
    let succs = this.elements[oldName].successors

    this.addNode(newName, this.elements[oldName].type, pos, this.elements[oldName].geometry_type)

    // rename relative links
    for (let [property, data] of Object.entries(this.elements)) {
      if (property != oldName) {
        for (let [succ, obj] of Object.entries(this.elements[property].successors)) {
          if (succ == oldName) {
            this.deleteEdge(property, oldName)
            this.addEdge(property, newName)
          }
        }
      }
    }

    // remove Old
    this.map.removeLayer(this.elements[oldName].marker)
    for (let [succ, obj] of Object.entries(succs)) {
      this.deleteEdge(oldName, succ)

      this.addEdge(newName, succ)
    }
    delete this.elements[oldName]
  }

  removeExistingElements() {
    for (let [k, v] of Object.entries(this.elements)) {
      if (v.marker != null) {
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

    if (this.elements[name].geometry_type == "polygon") {
      let posArr = null

      if (typeof pos.wkt != "undefined") {
        let wkt = new Wkt.Wkt()
        wkt.read(pos.wkt)
        posArr = wkt.toJson().coordinates
      } else {
        posArr = pos
      }

      obj = L.polygon(posArr, {
        contextmenu: true,
        contextmenuItems: [{
          text: 'Change position',
          index: 0,
          callback: e => {
            if (discardChanges())
              this.drawPolygon(name)
          }
        }, {
          separator: true,
          index: 1
        }, {
          text: 'Connect successors',
          index: 2,
          callback: e => {
            if (discardChanges())
              this.connectSuccessor(e, name)
          }
        }, {
          text: 'Delete',
          index: 3,
          callback: e => {
            if (discardChanges())
              sendEvent("data", {
                task: "deleteNode",
                data: name
              })
          }
        }, {
          separator: true,
          index: 4
        }]
      })
    } else if (this.elements[name].geometry_type == "point") {
      obj = L.marker(pos, {
        icon: this.icons[this.elements[name].type],
        contextmenu: true,
        contextmenuItems: [{
          text: 'Connect successors',
          index: 0,
          callback: e => {
            if (discardChanges())
              this.connectSuccessor(e, name)
          }
        }, {
          text: 'Delete',
          index: 1,
          callback: e => {
            if (discardChanges())
              sendEvent("data", {
                task: "deleteNode",
                data: name
              })
          }
        }, {
          separator: true,
          index: 2
        }]
      })
    } else if (this.elements[name].geometry_type == "line") {
      let posArr = null

      if (typeof pos.wkt != "undefined") {
        let wkt = new Wkt.Wkt()
        wkt.read(pos.wkt)
        posArr = wkt.toJson().coordinates
      } else {
        posArr = pos
      }

      obj = L.polyline(posArr, {
        contextmenu: true,
        contextmenuItems: [{
          text: 'Change position',
          index: 0,
          callback: e => {
            if (discardChanges())
              this.drawLine(name)
          }
        }, {
          separator: true,
          index: 1
        }, {
          text: 'Connect successors',
          index: 2,
          callback: e => {
            if (discardChanges())
              this.connectSuccessor(e, name)
          }
        }, {
          text: 'Delete',
          index: 3,
          callback: e => {
            if (discardChanges()) {
              sendEvent("data", {
                task: "deleteNode",
                data: name
              })

              closeSitebar()
            }
          }
        }, {
          separator: true,
          index: 4
        }]
      })
    }

    obj.addTo(this.map)
      //.bindPopup(name)
      .on("click", () => {
        sidebarShowId(name)
        return false
      })


    return obj
  }


  focusNode(name = null) {
    if (this.elementInMap(this.focusedElement)) {
      if (this.elements[this.focusedElement].geometry_type == "point") {
        L.DomUtil.removeClass(this.elements[this.focusedElement].marker._icon, 'selectedMarker')
      }
    }

    if (this.elementInMap(name)) {
      //$(this.elements[name].marker._icon).addClass("selectedMarker")
      if (this.elements[name].geometry_type == "point") {
        L.DomUtil.addClass(this.elements[name].marker._icon, 'selectedMarker')
      }
      this.focusedElement = name
    } else {
      this.focusedElement = null
    }
  }


  /**
   * return true or false depending if element is in map
   */
  elementInMap(name = null) {
    if (name != null) {
      if (typeof this.elements[name] != 'undefined') {
        if (this.elements[name].marker != null) {
          return true
        }
      }
    }
    return false
  }


  changeType(name, newType, geometryType) {
    let oldType = this.elements[name].type
    let oldGeo = this.elements[name].geometry_type

    this.elements[name].type = newType
    this.elements[name].geometry_type = geometryType

    if (this.elements[name].marker != null) {
      if (oldGeo != geometryType) {
        this.deleteNode(name, false)
        // No Pos Data
        this.alertButton.show()
      } else {
        let pos = null
        if (oldGeo == "line" || oldGeo == "polygon")
          pos = this.elements[name].marker.getLatLngs()
        else
          pos = this.elements[name].marker.getLatLng()

        this.elements[name].marker.remove()
        this.elements[name].marker = this.createNode(name, pos)
      }
    }
  }



  sidebarTextPlacement(wktText, name = "", heading = "Place Polygon") {
    const body = $('<div></div>')
    let form = $('<form class="createPolyForm clearfix"></form>')
    form.append(createInput("name", "name", name, "hidden"))
      .append(createInput("wkt", "pos_wkt", wktText, "hidden"))
      .append('<button class="btn btn-success">Save</button>')
      .append('<a class="cancel btn btn-warning pull-right">Cancel</a>')


    body.append(form)
      .append('<button class="resetPoly btn btn-default m-t-sm">Reset</button>')
      .append('<button class="revertPoly btn btn-primary m-t-sm pull-right">Revert</button>')

    sendEvent("sidebar", {
      task: "show",
      data: {
        head: "<h4>" + heading + "</h4>",
        body: body
      }
    })
  }


  sidebarTextPointPlacement(name = "", pos = {}) {
    const body = $('<div></div>')
    let form = $('<form class="dragPointForm clearfix"></form>')

    form.append(createInput("name", "name", name, "hidden"))
      .append(createInput("Latitude", "pos_lat", pos.lat, "number"))
      .append(createInput("Longitude", "pos_lng", pos.lng, "number"))
      .append('<button class="btn btn-success">Save</button>')
      .append('<a class="cancel btn btn-warning pull-right">Cancel</a>')


    body.append(form)

    sendEvent("sidebar", {
      task: "show",
      data: {
        head: "<h4>Drag Point</h4>",
        body: body
      }
    })
  }

  discard() {
    globals.unsavedChanges = false
    closeSitebar()

    if (this.redraw.ghostPoly != null) {
      this.redraw.ghostPoly.remove()
      this.redraw.ghostPoly = null
    }

    if (this.redraw.name != null && this.elements[this.redraw.name].marker != null) {
      // redraw OLD !!!
      this.elements[this.redraw.name].marker.remove()
      this.elements[this.redraw.name].marker = this.createNode(this.redraw.name, this.redraw.pos)

      this.redraw.name = null
    }

    if (this.shadowEdge != null) {
      this.shadowEdge.remove()
      this.shadowEdge = null
    }


    this.addDefaultBind()
  }

  drawPolygon(name) {
    let currentPoints = [],
      that = this

    if (this.elements[name].marker != null) {
      this.redraw.pos = this.elements[name].marker.getLatLngs()[0]
      this.redraw.name = name

      this.elements[name].marker.remove()
    }

    modal("Info", "Start adding Points to the map. You need to add at least 3 Points to the Map. Click submit when you are done.")
    globals.unsavedChanges = true

    this.removeClickListener()
    updateBodyPoly()

    this.map.on('click', e => {
      if (this.redraw.ghostPoly != null) {
        this.redraw.ghostPoly.remove()
      }

      currentPoints.push([e.latlng.lat, e.latlng.lng])

      this.redraw.ghostPoly = L.polygon(currentPoints, {}).addTo(this.map)
      updateBodyPoly()
    })

    function updateBodyPoly() {
      let wktText = arrayToPolygonWkt(currentPoints)

      // if (name != null) {
      that.sidebarTextPlacement(wktText, name)
      /* } else {
          that.sidebarTextPolyCreation(wktText, $(".createPolyForm input#name").val())
      }*/

      $(".createPolyForm").submit((e) => {
        e.preventDefault()
        if (currentPoints.length > 2) {
          if (name != null) {
            sendEvent("data", {
              task: "updatePosition",
              data: readForm(".createPolyForm")
            })

            sidebarShowId(name)
            that.checkCountNoPosElements()
          } else {
            var fromData = readForm(".createPolyForm")
            sendEvent("data", {
              task: "addNode",
              data: fromData
            })
          }

          that.addDefaultBind()
          that.redraw.ghostPoly.remove()
          that.redraw.ghostPoly = null
          currentPoints = []

          globals.unsavedChanges = false
        } else {
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

      $(".cancel").on("click", (e) => {
        that.discard()
        return false
      })

      $(".revertPoly").on("click", (e) => {
        if (that.redraw.ghostPoly != null)
          that.redraw.ghostPoly.remove()
        if (currentPoints.length >= 1)
          currentPoints.pop()

        that.redraw.ghostPoly = L.polygon(currentPoints, {}).addTo(that.map)
        updateBodyPoly()
        return false
      })
    }
  }


  drawLine(name) {
    let currentPoints = [],
      that = this


    if (this.elements[name].marker != null) {
      this.redraw.pos = this.elements[name].marker.getLatLngs()
      this.redraw.name = name

      this.elements[name].marker.remove()
    }

    modal("Info", "Start adding Points to the map. You need to add at least 2 Points to the Map. Click submit when you are done.")
    globals.unsavedChanges = true

    this.removeClickListener()
    updateBodyPoly()

    this.map.on('click', e => {
      if (this.redraw.ghostPoly != null) {
        this.redraw.ghostPoly.remove()
      }

      currentPoints.push([e.latlng.lat, e.latlng.lng])

      this.redraw.ghostPoly = L.polyline(currentPoints, {}).addTo(this.map)
      updateBodyPoly()
    })

    function updateBodyPoly() {
      let wktText = arrayToPolylineWkt(currentPoints)

      that.sidebarTextPlacement(wktText, name, "Place Line")

      $(".createPolyForm").submit((e) => {
        e.preventDefault()
        if (currentPoints.length >= 2) {
          if (name != null) {
            sendEvent("data", {
              task: "updatePosition",
              data: readForm(".createPolyForm")
            })
            sidebarShowId(name)

            that.checkCountNoPosElements()
          } else {
            var fromData = readForm(".createPolyForm")
            sendEvent("data", {
              task: "addNode",
              data: fromData
            })
          }

          that.addDefaultBind()
          that.redraw.ghostPoly.remove()
          that.redraw.ghostPoly = null
          currentPoints = []

          globals.unsavedChanges = false
        } else {
          modal("Alarm", "At least 2 points required")
        }
      })

      $(".resetPoly").on("click", (e) => {
        if (that.redraw.ghostPoly != null)
          that.redraw.ghostPoly.remove()

        that.redraw.ghostPoly = null
        currentPoints = []
        return false
      })

      $(".cancel").on("click", (e) => {
        that.discard()
        return false
      })

      $(".revertPoly").on("click", (e) => {
        if (that.redraw.ghostPoly != null)
          that.redraw.ghostPoly.remove()
        if (currentPoints.length >= 1)
          currentPoints.pop()

        that.redraw.ghostPoly = L.polyline(currentPoints, {}).addTo(that.map)
        updateBodyPoly()
        return false
      })
    }
  }

  drawPoint(name) {
    if (this.elements[name].marker == null) {
      // opens sidebar to drag into map
      this.alertButton.click()
    } else {
      modal("Info", "Start dragging selected marker")
      this.elements[name].marker.dragging.enable()
      this.redraw.pos = this.elements[name].marker.getLatLng()
      this.redraw.name = name
      globals.unsavedChanges = true

      this.sidebarTextPointPlacement(name, this.redraw.pos)
      this.removeClickListener()
      this.map.off("click")

      let watchForm = (form) => {
        form.find("input[name='pos_lng'], input[name='pos_lat']").on("change", e => {
          const formData = readForm(".dragPointForm")
          this.elements[name].marker.setLatLng(formData.pos)
        })

        $(".dragPointForm").submit((e) => {
          e.preventDefault()
          let currentPos = roundLatLng(this.elements[name].marker.getLatLng())

          if (currentPos.lat == this.redraw.pos.lat && currentPos.lng == this.redraw.pos.lng) {
            this.discard()
          } else {
            globals.unsavedChanges = false
            var data = readForm(".dragPointForm")
            data.pos = currentPos
            this.elements[name].marker.dragging.disable()

            this.addDefaultBind()
            sendEvent("data", {
              task: "updatePosition",
              data: data
            })
            sidebarShowId(name)
          }
        })

        $(".cancel").on("click", (e) => {
          this.discard()
          return false
        })
      }

      this.elements[name].marker.on("dragend", e => {
        this.sidebarTextPointPlacement(name, roundLatLng(this.elements[name].marker.getLatLng()))
        watchForm($(".dragPointForm"))
      })


      watchForm($(".dragPointForm"))
    }
  }


  addDefaultBind() {
    this.map.off("click")
      .off("mousemove")
      .on("click", (e) => {
        closeSitebar()
      })
    for (let [property, data] of Object.entries(this.elements)) {
      if (data.marker != null) {
        data.marker.off("click")
          .off("mouseover")
          .off("mouseout")
          .on("click", () => {
            sidebarShowId(property)
          })
      }
    }
  }

  removeClickListener() {
    for (let [property, data] of Object.entries(this.elements)) {
      if (data.marker != null) {
        data.marker.off("click")
      }
    }
  }



  connectSuccessor(evt, name) {
    let evtFromTarget = event.target || event.cyTarget,
      fromPos = this.getCoordinates(name),
      hoverNode = false,
      mousePos = evt.latlng

    globals.unsavedChanges = true

    this.shadowEdge = L.polyline([fromPos, mousePos], {
      weight: 5,
      clickable: false,
      color: "black"
    })

    this.shadowEdge
      .addTo(this.map)
      .bringToBack()


    this.map.on("mousemove", e => {
      if (!hoverNode) {
        this.shadowEdge.setLatLngs([fromPos, e.latlng])
      }
    })

    this.map.on("click", e => {
      globals.unsavedChanges = false
      this.shadowEdge.remove()
      this.addDefaultBind()
    })

    // add onclick Marker
    for (let [property, data] of Object.entries(this.elements)) {
      if (property != name) {
        if (data.marker != null) {
          data.marker.on("mouseover", () => {
            hoverNode = true
            this.shadowEdge.setLatLngs([fromPos, this.getCoordinates(property)])
          })

          data.marker.on("mouseout", () => {
            hoverNode = false
            this.shadowEdge.setLatLngs([fromPos, this.getCoordinates(property)])
          })


          data.marker
            .off("click")
            .on("click", () => {
              globals.unsavedChanges = false
              this.shadowEdge.remove()
              this.shadowEdge = null
              this.addDefaultBind()

              sendEvent("data", {
                task: "addEdge",
                data: {
                  from: name,
                  to: property
                }
              })

              sidebarShowId(property)
            })
        }
      }
    }
  }

  addNode(name, type, pos = null, geometry_type) {
    this.elements[name] = {
      successors: {},
      marker: null,
      type: type,
      geometry_type: geometry_type
    }

    if (pos != null) {
      if (typeof pos.lng != "undefined" && typeof pos.lat != "undefined" && geometry_type == "point" || typeof pos.wkt != "undefined" && geometry_type == "polygon" || typeof pos.wkt != "undefined" && geometry_type == "line") {
        this.elements[name].marker = this.createNode(name, pos)
      } else {
        this.alertButton.show()
      }
    } else {
      this.alertButton.show()
    }
  }

  addNodes(childs) {
    childs.forEach(child => {
      this.addNode(child.name, child.type, child.pos, child.geometry_type)
    })

    childs.forEach(child => {
      child.successors.forEach(succ => {
        //let index = childs.findIndex(x => x.name == succ)
        if (typeof this.elements[succ] != "undefined") {
          this.addEdge(child.name, succ)
        }
      })
      child.predecessors.forEach(pred => {
        if (typeof this.elements[pred] != "undefined") {
          if (typeof this.elements[pred].successors[child.name] == "undefined") {
            this.addEdge(pred, child.name)
          }
        }
      })
    })
  }

  getNoPosElements() {
    let dragContainer = $("<div class=\"dragContainer row\"></div>"),
      polyContainer = $("<div class=\"listContainer\"></div>"),
      list = $("<div class=\"list-group\"></div>"),
      body = $("<div></div>")

    polyContainer.append(list)


    for (let [property, data] of Object.entries(this.elements)) {
      if (data.marker == null) {
        if (data.geometry_type == "polygon" || data.geometry_type == "line") {
          let li = $("<a class=\"list-group-item\" href=\"#\">" + property + "</a>")
          li.on("click", e => {
            if (data.geometry_type == "polygon") {
              this.drawPolygon(property)
            } else if(data.geometry_type == "line"){
              this.drawLine(property)
            }
          })
          list.append(li)
        } else {
          let letEle = $("<div class=\"dragArticle col-xs-6 col-md-4\"></div>")

          let imgClone = $("<img>")
            .prop("src", configNode.nodesAvailable[data.type].icon)
            .prop("data-name", property)
            .prop("class", "dragImg img-responsive")

          letEle.append(`<p class="dragMarkerName">${property}</p>`)
          letEle.append(imgClone)
          dragContainer.append(letEle)
        }
      }
    }

    if (dragContainer.find("div").length > 0) {
      body.append("<p>Drag Makers into Map</p>")
      body.append(dragContainer)
    }
    if (list.find("a").length > 0) {
      body.append("<p>Click element to set position</p>")
      body.append(polyContainer)
    }

    return body
  }

  checkCountNoPosElements() {
    let count = 0
    for (let [property, data] of Object.entries(this.elements)) {
      if (data.marker == null)
        count += 1
    }

    if (count == 0)
      this.alertButton.hide()

    return count
  }


  /**
   * Register Drag Events of Marker in Sidebar
   */
  registerDragEvents(eles) {
    let srcEle = null,
      srcName = null,
      that = this,
      added = false


    eles.each((index, value) => {
      value.addEventListener('dragstart', handleDragStart, false)
      value.addEventListener('dragend', handleDragEnd, false)
    })


    this.containerElement
      .off('drop')
      .on('drop', handleDrop)
      //.off('dragenter')
      //.off('dragleave')
      //.on('dragenter', handleDragEnter)
      //.on('dragleave', handleDragLeave)

    function handleDragStart(e) {
  		srcEle = $(e.target)
  		srcName = srcEle.parent().find("p").text()
  		srcEle.parent().addClass('moving')
  		added = false

  		let img = new Image()
  		img.src = srcEle.prop("src")
  		img.width = srcEle.width()
  		img.height = srcEle.height()

  		//e.dataTransfer.setDragImage(img, -(srcEle.width()/2), -(srcEle.height()))
  	}

    function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation()
      }
      e.preventDefault()
      let mousePos = that.map.mouseEventToLatLng(e)
      added = true

      sendEvent("data", {
        task: "updatePosition",
        data: {
          name: srcName,
          pos: mousePos
        }
      })

      this.classList.remove('over')

      if (that.checkCountNoPosElements() == 0) {
        closeSitebar()
      }

      return false
    }

    function handleDragEnd(e) {
      if (added) {
        srcEle.parent().remove()
      } else {
        srcEle.parent().removeClass('moving');
      }
      srcEle = null
      srcName = null
    }
  }

  deleteNode(name, deleteRefs = true) {
    for (let [k, v] of Object.entries(this.elements)) {
      if (k != name) {
        for (let [succ, obj] of Object.entries(this.elements[k].successors)) {
          if (succ == name) {
            if (obj.arrow != null) {
              this.map.removeLayer(obj.arrow)
              this.map.removeLayer(obj.head)
              obj.arrow = null
              obj.head = null
            }
            if (deleteRefs)
              delete this.elements[k].successors[succ]
          }
        }
      } else {
        if (this.elements[name].marker != null) {
          this.map.removeLayer(this.elements[name].marker)
          this.elements[name].marker = null
          for (let [succ, obj] of Object.entries(this.elements[k].successors)) {
            if (obj.arrow != null) {
              this.map.removeLayer(obj.arrow)
              this.map.removeLayer(obj.head)
              obj.arrow = null
              obj.head = null
            }
          }
        }
        if (deleteRefs)
          delete this.elements[name]
      }
    }
  }



  addEdge(from, to) {
    if (this.elements[from].marker != null && this.elements[to].marker != null) {
      let arrow = L.polyline([this.getCoordinates(from), this.getCoordinates(to)], {
        weight: 5,
        color: "#9dbaea",
        contextmenu: true,
        className: 'successorsLine',
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
            })
          }
        }, {
          separator: true,
          index: 1
        }]
      }).addTo(this.map)


      let arrowHead = L.polylineDecorator(arrow, {className: 'successorsLine'}).addTo(this.map)
      arrowHead.setPatterns([{
        offset: '100%',
        repeat: 0,
        className: 'successorsLine',
        symbol: L.Symbol.arrowHead({
          polygon: false,
          className: 'successorsLine',
          pathOptions: {
            stroke: true,
            color: "#9dbaea"
          }
        })
      }])


      if (typeof this.elements[from].successors[to] != "undefined") {
        if (this.elements[from].successors[to].arrow != null) {
          this.map.removeLayer(this.elements[from].successors[to].arrow)
          this.map.removeLayer(this.elements[from].successors[to].head)
        }
      }

      this.elements[from].successors[to] = {
        arrow: arrow,
        head: arrowHead
      }
    } else {
      this.elements[from].successors[to] = {
        arrow: null,
        head: null
      }
    }
  }


  /**
   * Get position of marker or center of polygon/line
   */
  getCoordinates(name) {
    if (this.elements[name].geometry_type == "polygon" || this.elements[name].geometry_type == "line") {
      // different implementations for polygons can be found here
      // https://stackoverflow.com/questions/22796520/finding-the-center-of-leaflet-polygon
      return this.elements[name].marker.getBounds().getCenter()
    } else {
      return this.elements[name].marker.getLatLng()
    }
  }


  /**
   * Remove edge
   */
  deleteEdge(from, to) {
    if (this.elements[from].successors[to].arrow != null) {
      this.map.removeLayer(this.elements[from].successors[to].arrow)
      this.map.removeLayer(this.elements[from].successors[to].head)
      this.elements[from].successors[to].arrow = null
      this.elements[from].successors[to].head = null
    }
    delete this.elements[from].successors[to]
  }


  /**
   * sets position of an element
   */
  updatePosition(name, pos) {
    // check if already on Map
    if (this.elements[name].marker != null) {
      if (this.elements[name].geometry_type == "polygon" || this.elements[name].geometry_type == "line") {
        this.elements[name].marker.remove()
        this.elements[name].marker = this.createNode(name, pos)
      } else {
        this.elements[name].marker.setLatLng(pos)
      }
      // Update Connections
      for (let [prob, data] of Object.entries(this.elements)) {
        if (prob == name) {
          for (let [succ, obj] of Object.entries(data.successors)) {
            this.deleteEdge(name, succ)
            this.addEdge(name, succ)
          }
        } else {
          for (let [succ, obj] of Object.entries(data.successors)) {
            if (succ == name) {
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
        if (prob == name) {
          for (let [succ, obj] of Object.entries(data.successors)) {
            // check if marker already exists
            if (this.elements[succ].marker != null) {
              this.addEdge(name, succ)
            }
          }
        } else {
          for (let [succ, obj] of Object.entries(data.successors)) {
            if (succ == name) {
              if (data.marker != null) {
                this.addEdge(prob, name)
              }
            }
          }
        }
      }
    }
  }

  /**
   * Center Map to view all elements
   */
  centerMap(e) {
    let markers = []
    for (let [k, v] of Object.entries(this.elements)) {
      if (v.marker != null)
        markers.push(v.marker)
    }
    if (markers.length > 0) {
      let group = new L.featureGroup(markers)
      this.map.fitBounds(group.getBounds().pad(0.3))
    }
  }

  /**
   * Calls Modal to set boolean showPredAndSuccOnMap
   */
  openSettingsModal() {
    const heading = "Map Settings"
    const form = $("<form class='mapSettingsForm'></form>")

    if (globals.showPredAndSuccOnMap) {
      form.append('<div class="form-group"><label for="showPredAndSuccOnMap">Show predecessors and successors on map</label><input checked class="" type="checkbox" name="showPredAndSuccOnMap"></div>')
    } else {
      form.append('<div class="form-group"><label for="showPredAndSuccOnMap">Show predecessors and successors on map</label><input class="" type="checkbox" name="showPredAndSuccOnMap"></div>')
    }

    form.append('<button class="btn btn-success">Save</button>')


    form.submit((e) => {
      e.preventDefault()
      let formData = readForm(".mapSettingsForm")


      if (typeof formData.showPredAndSuccOnMap != "undefined") {
        globals.showPredAndSuccOnMap = true
      } else {
        globals.showPredAndSuccOnMap = false
      }
      this.updateStyle()

      hideModal()
    })

    modal(heading, form)
  }


  /**
   * depending on current globals.showPredAndSuccOnMap boolean
   * predecessors and successors gets hided
   */
  updateStyle() {
    if(globals.showPredAndSuccOnMap)
      $(".successorsLine").css("display", "block")
    else
      $(".successorsLine").css("display", "none")
  }
}
