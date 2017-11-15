var store = null;

class saiv {
  constructor() {
    store = new DataManager()
    this.sb = new Sidebar(config.dom.sidebar)
    this.cy = new CyptoScape(config.dom.canvasContainer)
    this.plugins = []


    // Init File Drop Events
    initDropEvents()
    // Open Page home
    home()

    this.initClickEvents()
  }


  initClickEvents() {
    /**
     * init menu listener
     */
    $(config.dom.links.scenario).click(() => {
      scenarioEdit(store.getScenario())
    })

    $(config.dom.links.nodeSettings).click(() => {
      nodeSettings()
    })



    document.addEventListener("discardChanges", (e) => {
      if ($(".navbar li.active").length == 1) {
        let activeLink = $(".navbar li.active a").attr('class')
        let index = this.plugins.findIndex(x => x.selector == "." + activeLink)
        if (index != -1) {
          this.plugins[index].class.discard()
        } else {
          switch (activeLink) {
            case "changeJson":
              this.cy.discard()
              break
          }
        }
      }
    })


    document.addEventListener("sidebar", (e) => {
      switch (e.detail.task) {
        case "showId":
          this.showId(e.detail.data)
          break
        case "addNode":
          this.sb.addNode(e.detail.data.pos)
          break
        case "show":
          this.sb.show(e.detail.data.head, e.detail.data.body)
          break;
      }
    })

    // Init Event Reciver
    document.addEventListener("dataReceived", (e) => {
      store.json = e.detail
      this.initListenerDataRevieved()
    })
  }

  /**
   * Opens Sidebar Form
   */
  showId(id) {
    let data = store.getElement(id)

    this.sb.updateNodeForm(data, store.getAllElements())
  }


  initListenerDataRevieved (){
    $(config.dom.links.graph)
      .off("click")
      .on("click", () => {
        if (discardChanges()) {
          $(".contentPage").css("visibility", "hidden")

          setActiveMenuItem(config.dom.links.graph)
          $(config.dom.canvasContainer).css("visibility", "visible")
          $(config.dom.sidebar).show()
        }
      })
      .click()

    this.plugins.forEach(plugin => {
      $(plugin.selector)
        .off("click")
        .on("click", () => {
          if (discardChanges()) {
            $(".contentPage").css("visibility", "hidden")
            $(plugin.contentSeletor).css("visibility", "visible")
            setActiveMenuItem(plugin.selector)
            $(config.dom.sidebar).show()
          }
        })
        .parent("li").removeClass("disabled")
    })

    $(config.dom.links.download)
      .off("click")
      .on("click", () => {
        let bool = confirm("Attach Explorer Positions to json?")
        let data = store.json
        data.children = store.getAllElements()
        let urlString = "text/json;charset=utf-8,"

        if (bool) {
          for (let i = 0; i < data.children.length; i++) {
            if (typeof data.children[i].pos == "undefined")
              data.children[i].pos = {}
            Object.assign(data.children[i].pos, this.cy.$("#" + data.children[i].name).position())
          }
        } else {
          for (let i = 0; i < data.children.length; i++) {
            if (typeof data.children[i].pos != "undefined") {
              if (typeof data.children[i].pos.x != "undefined")
                delete data.children[i].pos.x;
              if (typeof data.children[i].pos.y != "undefined")
                delete data.children[i].pos.y;
            }
          }
        }
        urlString += encodeURIComponent(JSON.stringify(data, 0, 4))

        $(config.dom.links.download).prop("href", "data:" + urlString)
        $(config.dom.links.download).prop("download", "data.json")
      })
      .parent("li").removeClass("disabled")
  }

  addPlugin(pluginClass, linkSelector, contentPage) {
    this.plugins.push({
      class: pluginClass,
      selector: linkSelector,
      contentSeletor: contentPage
    })
  }
}
