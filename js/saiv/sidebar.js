class Sidebar {
  constructor(selector) {
    this.container = $(selector)
    this.head = $('<div class="head"></div>')
    this.body = $('<div class="body"></div>')
    this.container.append(this.head)
    this.container.append(this.body)
  }

  showData(data) {
    this.open()
    this.head.html(JSON.stringify(data))
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

  updateNodeForm(data, nodes) {
    this.open()
    this.head.html("<h4>Update " + data.name + "</h4>")
    this.body.html("")
    let form = $('<form class="editForm"></form>')

    form.append(createInput("currentId", "currentId", data.name, "hidden"))
      .append(createInput("Name", "name", data.name, "text"))
      .append(createSelect("type", [data.type], Object.keys(configNode.nodesAvailable).map((k) => k)))




    if (typeof data.geometry_type != "undefined")
      form.append(createSelect("geometry_type", [data.geometry_type], configNode.nodesAvailable[data.type].geometryTypes))
    else
      form.append(createSelect("geometry_type", [], configNode.nodesAvailable[data.type].geometryTypes))


    form.append(this.createTags(data.tags, data.type))
    form.append(this.createSequences(data.sequences))


    form.append(createSelect("predecessors", data.predecessors, nodes.filter(node => {
        return node != data.name
      }), "multiple=\"multiple\""))
      .append(createSelect("successors", data.successors, nodes.filter(node => {
        return node != data.name
      }), "multiple=\"multiple\""))


    $('.basic-select', form).select2()


    form.find(".addTag").on("click", () => {
      this.addTag((newTag) => {
        if (typeof newTag == "string") {
          sendEvent("data", {
            task: "addTag",
            data: {
              id: data.name,
              tag: newTag
            }
          })
        }


        sidebarShowId(data.name)
      })
    })


    // Sequence Click Listener
    form.find(".addSequence").on("click", () => {
      createSequence(data.name, data.sequences)
    })
    form.find(".removeSequence").on("click", (e) => {
      deleteSequence(data.name)
    })
    form.find(".removeSequenceId").on("click", (e) => {
      deleteSequence(data.name, e.target.dataset.item)
    })
    form.find(".showSequence").on("click", (e) => {
      showSequence(data.name, data.sequences)
    })

    // listen to changes of type
    // geometry type according to it
    this.updateGeometryTypeOnTypeChange(form)

    // update tags
    if (!configNode.allowCustomTags) {
      form.find("select[name='type']").on('change', e => {
        form.find('.formTags').replaceWith(this.createTags(data.tags, form.find('select[name="type"]').val()))
      })
    }


    form.find('.removeTag').on("click", function() {
      const inputName = $(this).parent().parent().find("input").prop("name")
      let tag = inputName.substring(5, inputName.length)

      sendEvent("data", {
        task: "removeTag",
        data: {
          id: data.name,
          tag: tag
        }
      })

      sidebarShowId(data.name)
    })

    form.append('<button class="btn btn-success">Save</button>')
    form.append('<a class="btn btn-warning cancelForm pull-right">Cancel</a>')
    form.submit(e => {
      e.preventDefault()
      let test = readForm('.editForm')


      sendEvent("data", {
        task: "updateNode",
        data: test
      })

      this.close()
    })
    form.find("a.cancelForm").on("click", (e) => {
      this.close()
      return false
    })

    this.body.append(form)


    sendEvent(
      "dataChanged", {
        task: "focusNode",
        data: data.name
      }
    )
    sendEvent("sidebar", {
      task: "openUpdateForm",
      data: data.name
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

    if (configNode.allowCustomTags)
      heading += '<small><a href="#" class="addTag">Add Tag</a></small>'

    //if (!configNode.allowCustomTags) {
    configNode.nodesAvailable[type].tags.forEach(tag => {
      body += '<label for="tags_' + tag + '">' + tag + '</label>'
      body += '<div class=\"input-group\"></div>'
      if (typeof tags[tag] != "undefined") {
        body += '<input class="form-control" type="text" name="tags_' + tag + '" value="' + tags[tag] + '"></input>'
      } else {
        body += '<input class="form-control" type="text" name="tags_' + tag + '" value=""></input>'
      }

      if (configNode.allowCustomTags) {
        body += '<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>'
      }
    })

    // if didnt added above and custom tags are allowed
    for (let [key, value] of Object.entries(tags)) {
      if (configNode.nodesAvailable[type].tags.findIndex(x => x.name == key) == -1) {
        body += '<div class=\"input-group\"></div>'
        if (configNode.allowCustomTags) {
          body += '<label for="tags_' + key + '">' + key + '</label>'
          body += '<input class="form-control" type="text" name="tags_' + key + '" value="' + value + '"></input>'
          body += '<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>'
        } else {
          body += '<input class="form-control" type="hidden" name="tags_' + key + '" value="' + value + '"></input>'
        }
      }
    }

    return createCollapseEle("tagsAccordion", "tagsAccordionBody", heading, body)
  }


  static onOpenShowId(fn) {
    return () => {
      document.addEventListener("sidebar", (e) => {
        switch (e.detail.task) {
          case "openUpdateForm":
            fn(e)
            break
        }
      })
    }
  }

  addNode(pos) {
    this.open()
    this.head.html("Add Node")
    this.body.html("")


    let form = $('<form class="editForm"></form>')
    form.append(createInput("name", "name", "", "text", true))
    form.append(createSelect("type", [configNode.nodesEnabled], configNode.nodesEnabled, "required"))
    form.append(createSelect("geometry_type", [], configNode.nodesAvailable[configNode.nodesEnabled[0]].geometryTypes))

    for (let [property, val] of Object.entries(pos)) {
      form.append(createInput("pos_" + property, "pos_" + property, val, "hidden"))
    }

    form.append('<button class="btn btn-success">Add</button>')
    form.append('<a class="btn btn-warning pull-right">Cancel</button>')

    $('.basic-select', form).select2()

    form.submit(e => {
      e.preventDefault()

      sendEvent("data", {
        task: "addNode",
        data: readForm(".editForm")
      })
    })
    form.find(".btn-warning").on("click", e => {
      this.close()
    })

    // listen to changes of type
    // update tags and geometry type according to it
    this.updateGeometryTypeOnTypeChange(form)

    this.body.append(form)
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
      form.find('label[for="geometry_type"]').parent().replaceWith(createSelect("geometry_type", [currentType], configNode.nodesAvailable[e.target.value].geometryTypes))
      $('select[name="geometry_type"]', form).select2({
        width: '100%'
      })
    })
  }
}

/**
 * Global open Sidebar function
 */
function openSitebar() {
  globals.callSitebarTimestamp = Date.now()
  $("body").removeClass("sidebar-closed")
}

/**
 * Global close Sitebar function
 */
function closeSitebar() {
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
