import { store } from './store.js';
import { home } from './pages/home.js';
import { scenarioEdit } from './pages/scenario.js';
import { nodeSettings } from './pages/nodeSettings.js';
import { selectStyle } from './pages/selectStyle.js';
import { openJsonSelection, initDropEvents } from './pages/selectJson.js';
import { config } from './globals.js';
import { discardChanges, setActiveMenuItem } from './helper.js'
import { cyto } from './cytoscape.js'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import '../www/css/style.css'


document.body.classList.remove('loading')

initDropEvents()
initMenu()


document.addEventListener("discardChanges", (e) => {
	cyto.discard()
})

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

function initMenu() {
	$(config.dom.links.home).click(() => {
		if (discardChanges()) {
			home()
		}
	}).click()
	$(config.dom.links.json).click(() => {
		if (discardChanges()) {
			openJsonSelection()
		}
	})

	$(config.dom.links.scenario).click(() => {
		scenarioEdit()
	})

	$(config.dom.links.nodeSettings).click(async () => {
		let newSettings = await nodeSettings()
		let obj = await store.updateNodesEnabled(newSettings)

		cyto.updateNodesEnabled(obj.remove, obj.add)
	})

	$(config.dom.links.style).click(async () => {
		try {
			let newStyle = await selectStyle()
			cyto.updateLayout()
		} catch (e) {
			console.log(e)
		}
	})
}
