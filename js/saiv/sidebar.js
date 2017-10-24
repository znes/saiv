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

        sendEvent("sidebar", {
          task: "showId",
          data: data.name
        })
      })
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

      sendEvent("sidebar", {
        task: "showId",
        data: data.name
      })
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
  }


  createTags(tags, type) {

    /*    <div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
          <div class="panel panel-default">
            <div class="panel-heading" role="tab" id="headingOne">
              <h4 class="panel-title">
                <a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                gagaga
                </a>
              </h4>
            </div>
            <div id="collapseOne" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="headingOne">
              <div class="panel-body">
                Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.
              </div>
            </div>
          </div>
        </div>*/



    let div = $('<div class="formTags form-group panel-group"  id="accordion" role="tablist"></div>')

    let heading = $('<div class="panel panel-default"><div class="panel-heading" role="tab" id="tagsPanel"></div></div>')
    let tagTitle = $('<h4 class="panel-title"></h4>')
    tagTitle.append('<a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" aria-expanded="false" aria-controls="collapseOne">Tags</a>')

    if (configNode.allowCustomTags)
      tagTitle.append('<small><a href="#" class="addTag">Add Tag</a></small>')

    heading.find("#tagsPanel").append(tagTitle)
    div.append(heading)

    let tabBody = $('<div id="collapseOne" class="panel-collapse collapse" role="tabpanel" aria-expanded="false" aria-labelledby="tagsPanel"><div class="panel-body"></div></div>')

    //if (!configNode.allowCustomTags) {
    configNode.nodesAvailable[type].tags.forEach(tag => {

      let input = $("<div class=\"input-group\"></div>")
      if (typeof tags[tag.name] != "undefined") {
        input.append('<input class="form-control" type="' + tag.type + '" name="tags_' + tag.name + '" value="' + tags[tag.name] + '"></input>')
      } else {
        input.append('<input class="form-control" type="' + tag.type + '" name="tags_' + tag.name + '" value=""></input>')
      }

      if (configNode.allowCustomTags) {
        input.append('<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>')
      }


      tabBody.find(".panel-body").append('<label for="tags_' + tag.name + '">' + tag.name + '</label>')
        .append(input)
    })


    // if didnt added above and custom tags are allowed
    for (let [key, value] of Object.entries(tags)) {
      if (configNode.nodesAvailable[type].tags.findIndex(x => x.name == key) == -1) {
        let input = $("<div class=\"input-group\"></div>")
        if (configNode.allowCustomTags) {
          input.append('<input class="form-control" type="text" name="tags_' + key + '" value="' + value + '"></input>')
          input.append('<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>')
          tabBody.find(".panel-body").append('<label for="tags_' + key + '">' + key + '</label>')
        } else {
          input = $('<input class="form-control" type="hidden" name="tags_' + key + '" value="' + value + '"></input>')
        }

        tabBody.find(".panel-body").append(input)
      }
    }


    div.append(tabBody)
    return div
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
