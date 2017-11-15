$(document).ready(function() {
  $(config.dom.links.style).click(() => {
    selectStyle()
  })
})

function selectStyle() {
  let currentStyle = localStorage.getItem("style") ? localStorage.getItem("style") : config.cytoscape.defaultStyle
  let currentAutoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout
  let form = $('<form class="editStyle selectStyle"></form>')


  form.append(createSelect("style", [currentStyle], config.cytoscape.styles))

  if (currentAutoLayout == "true") {
    form.append('<div class="form-group"><label for="autoLayout">Relayout Explorer after adding Elements</label><input checked class="" type="checkbox" name="autoLayout"></div>')
  } else {
    form.append('<div class="form-group"><label for="autoLayout">Relayout Explorer after adding Elements</label><input class="" type="checkbox" name="autoLayout"></div>')
  }


  form.append('<button class="btn btn-success">Save</button>')
  form.submit(e => {
    e.preventDefault()
    let data = readForm(".editStyle")

    if (typeof data.autoLayout != "undefined") {
      globals.autoLayout = "true"
    } else {
      globals.autoLayout = "false"
    }

    localStorage.setItem("style", data.style)
    localStorage.setItem("autoLayout", globals.autoLayout)

    sendEvent("dataChanged", {
      task: "updateStyle"
    })

    hideModal()
  })

  modal("Set Explorer Styles", form)
  $('.basic-select', form).select2()
}
