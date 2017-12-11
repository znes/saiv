/*import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';*/

import { store } from './store.js';
import { home } from './pages/home.js';
import { scenarioEdit } from './pages/scenario.js';
import { nodeSettings } from './pages/nodeSettings.js';
import { selectStyle } from './pages/selectStyle.js';
import { openJsonSelection, initDropEvents } from './pages/selectJson.js';
import { config } from './globals.js';
import { discardChanges, setActiveMenuItem } from './helper.js'
import { cyto } from './cytoscape.js'
import {}




initDropEvents()
// Open Page home
home()



// init Menu
$(config.dom.links.json).click(() => {
	if (discardChanges()) {
		openJsonSelection()
	}
})

$(config.dom.links.scenario).click(() => {
	scenarioEdit()
})

$(config.dom.links.nodeSettings).click(async() => {
	let newSettings = await nodeSettings()
	let obj = await store.updateNodesEnabled(newSettings)

	cyto.updateNodesEnabled(obj.remove, obj.add)
})

$(config.dom.links.style).click(() => {
	selectStyle()
})


/**document.addEventListener("discardChanges", (e) => {
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
})*/

// Init Event Reciver
document.addEventListener("dataReceived", (e) => {
	store.json = e.detail
	initListenerDataRevieved()
})


function initListenerDataRevieved() {
	$(config.dom.links.graph)
		.off("click")
		.on("click", () => {
			if (discardChanges()) {
				$(".contentPage").css("visibility", "hidden")

				setActiveMenuItem(config.dom.links.graph)
				$(config.dom.canvasContainer).css("visibility", "visible")
				$(config.dom.sidebar).show()

				cyto.show()
			}
		})
		.click()

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
