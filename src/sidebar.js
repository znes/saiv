import { globals, config } from './globals.js'
import { sendEvent, createInput, createSelect, createCollapseEle, readForm } from './helper.js'
import { store } from './store.js'
import $ from 'jquery';
import 'select2';
import 'select2/dist/css/select2.css';



class Sidebar {
	constructor() {
		this.container = $(config.dom.sidebar)
		this.head = $('<div class="head"></div>')
		this.body = $('<div class="body"></div>')
		this.container.append(this.head)
		this.container.append(this.body)
	}

	show($head, $body) {
		this.open()
		this.head.html("").append($head)
		this.body.html("").append($body)
	}

	addTag(ready) {
		this.open()
		this.head.html("").append("<h4>Add Tag</h4>")
		this.body.html("")
		let form = $('<form class="editForm"></form>')

		form.append(createInput("Tag name", "tag", "", "text", true))
			.append('<button class="btn btn-success">Add</button>')
			.append('<a class="btn btn-warning cancelForm pull-right">Cancel</button>')

			.submit((e) => {
				e.preventDefault()
				ready(readForm(".editForm").tag)
			})
			.find("a.cancelForm")
			.on("click", (e) => {
				ready(false)
				return false
			})

		this.body.append(form)
	}

	updateNodeForm(name) {
		return new Promise((resolve, reject) => {
				const data = store.getElement(name)
				const nodes = store.getAllElements().filter(node => {
					return node.name != name
				})

				this.open()
				this.head.html("<h4>Update " + data.name + "</h4>")
				this.body.html("")
				let form = $('<form class="editForm"></form>')

				form.append(createInput("currentId", "currentId", data.name, "hidden"))
					.append(createInput("Name", "name", data.name, "text"))
					.append(createSelect("type", [data.type], Object.keys(config.nodes.nodesAvailable).map((k) => k)))


				form.append(this.createTags(data.tags, data.type))


				form.append(createSelect("predecessors", data.predecessors, nodes, 'multiple=\"multiple\"'))
					.append(createSelect("successors", data.successors, nodes, 'multiple=\"multiple\"'))


				form.find(".addTag").on("click", () => {
					this.addTag((newTag) => {
						if (typeof newTag == "string") {
							store.addTag(data.name, newTag)
						}


						this.close()
						reject()
					})
				})


				// listen to changes of type
				// geometry type according to it
				//this.updateGeometryTypeOnTypeChange(form)

				// update tags
				if (!config.nodes.allowCustomTags) {
					form.find("select[name='type']").on('change', e => {
						form.find('.formTags').replaceWith(this.createTags(data.tags, form.find('select[name="type"]').val()))
					})
				}


				form.find('.removeTag').on("click", function() {
					const inputName = $(this).parent().parent().find("input").prop("name")
					let tag = inputName.substring(5, inputName.length)

					store.removeTag(data.name, tag)
					this.close()
				})

				form.append('<button class="btn btn-success">Save</button>')
				form.append('<a class="btn btn-warning cancelForm pull-right">Cancel</a>')
				form.submit(e => {
					e.preventDefault()
					resolve(readForm('.editForm'))
					this.close()
				})
				form.find("a.cancelForm").on("click", (e) => {
					this.close()
					reject()
				})


				$('.basic-select', form).select2()
				this.body.append(form)
			})
		}

		createSequences(currentSequences = {}) {
			let objKeys = Object.keys(currentSequences)

			let body = '<a href="#" class="addSequence">Add Sequence</a><br>'
			if (objKeys.length >= 2 && currentSequences.time) {
				body += `<a href="#" class="showSequence">Show</a><br>`
			}
			if (objKeys.length > 0) {
				body += '<a href="#" class="removeSequence">Remove All</a><br>'
			}

			objKeys.forEach(key => {
				body += `${key}<a class="removeSequenceId pull-right" data-item="${key}">x</a><br>`
			})
			return createCollapseEle("sequence", "sequenceBody", "Sequences", body)
		}

		createTags(tags, type) {
			let heading = "Tags"
			let body = ""

			if (config.nodes.allowCustomTags)
				heading += '<small><a href="#" class="addTag">Add Tag</a></small>'

			//if (!config.nodes.allowCustomTags) {
			config.nodes.nodesAvailable[type].tags.forEach(tag => {
				body += '<label for="tags_' + tag + '">' + tag + '</label>'
				body += '<div class=\"input-group\"></div>'
				if (tags[tag]) {
					body += '<input class="form-control" type="text" name="tags_' + tag + '" value="' + tags[tag] + '"></input>'
				} else {
					body += '<input class="form-control" type="text" name="tags_' + tag + '" value=""></input>'
				}

				if (config.nodes.allowCustomTags) {
					body += '<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>'
				}
			})

			// if didnt added above and custom tags are allowed
			for (let [key, value] of Object.entries(tags)) {
				if (config.nodes.nodesAvailable[type].tags.findIndex(x => x.name == key) == -1) {
					body += '<div class=\"input-group\"></div>'
					if (config.nodes.allowCustomTags) {
						body += '<label for="tags_' + key + '">' + key + '</label>'
						body += '<input class="form-control" type="text" name="tags_' + key + '" value="' + value + '"></input>'
						body += '<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>'
					}
					/*else {
						body += '<input class="form-control" type="hidden" name="tags_' + key + '" value="' + value + '"></input>'
					}*/
				}
			}

			return createCollapseEle("tagsAccordion", "tagsAccordionBody", heading, body)
		}


		/*static onOpenShowId(fn) {
			return () => {
				document.addEventListener("sidebar", (e) => {
					switch (e.detail.task) {
						case "openUpdateForm":
							fn(e)
							break
					}
				})
			}
		}*/


		addNode(pos) {
			return new Promise((resolve, reject) => {
				this.open()
				this.head.html("Add Node")
				this.body.html("")


				let form = $('<form class="editForm"></form>')
				form.append(createInput("name", "name", "", "text", true))
				form.append(createSelect("type", [config.nodes.nodesEnabled], config.nodes.nodesEnabled, "required"))

				for (let [property, val] of Object.entries(pos)) {
					form.append(createInput("pos_" + property, "pos_" + property, val, "hidden"))
				}

				form.append('<button class="btn btn-success">Add</button>')
				form.append('<a class="btn btn-warning pull-right">Cancel</button>')

				$('.basic-select', form).select2()

				form.submit(e => {
					e.preventDefault()

					resolve(readForm(".editForm"))
				})
				form.find(".btn-warning").on("click", e => {
					this.close()
				})

				// listen to changes of type
				// update tags and geometry type according to it
				//this.updateGeometryTypeOnTypeChange(form)

				this.body.append(form)
			})
		}

		open() {
			openSitebar()
		}

		close() {
			closeSitebar()
		}


		updateGeometryTypeOnTypeChange(form) {
			form.find("select[name='type']").on('change', e => {
				let currentType = form.find('select[name="type"]').val()

				// update geometric types to select
				form.find('label[for="geometry_type"]').parent().replaceWith(createSelect("geometry_type", [currentType], config.nodes.nodesAvailable[e.target.value].geometryTypes))
				$('select[name="geometry_type"]', form).select2({
					width: '100%'
				})
			})
		}
	}


	export let sidebar = new Sidebar()
	/**
	 * Global open Sidebar function
	 */
	export function openSitebar() {
		globals.callSitebarTimestamp = Date.now()
		$("body").removeClass("sidebar-closed")
	}

	/**
	 * Global close Sitebar function
	 */
	export function closeSitebar() {
		// hack
		// map calls closeSitebar when polygone is clicked
		// if open call is called 100ms before it will not be called
		if (globals.callSitebarTimestamp + 100 < Date.now()) {
			$("body").addClass("sidebar-closed")
			$(".sequenceContainer").hide()
			sendEvent(
				"dataChanged", {
					task: "focusNode",
					data: null
				}
			)
		}
	}
