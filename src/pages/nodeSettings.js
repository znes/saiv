import {modal, hideModal} from '../modal.js'
import {sendEvent, createSelect} from '../helper.js'
import {config} from '../globals.js'

import $ from 'jquery';
import 'select2';
import 'select2/dist/css/select2.css';


export function nodeSettings() {
  const form = $("<form class='nodeSettingsForm'></form>")
  const heading = "Node Settings"

  form.append(createSelect("Nodes enabled", config.nodes.nodesEnabled, Object.keys(config.nodes.nodesAvailable), "multiple=\"multiple\""))

  if (config.nodes.allowCustomTags == true) {
    form.append('<div class="form-group"><label for="allowCustomTags">Allow custom Tags</label><input checked class="" type="checkbox" name="allowCustomTags"></div>')
  } else {
    form.append('<div class="form-group"><label for="allowCustomTags">Allow custom Tags</label><input class="" type="checkbox" name="allowCustomTags"></div>')
  }

  form.append('<button class="btn btn-success">Save</button>')


  form.submit((e) => {
    e.preventDefault()
    let formData = readForm(".nodeSettingsForm")


    if (typeof formData.allowCustomTags != "undefined") {
      config.nodes.allowCustomTags = true
    } else {
      config.nodes.allowCustomTags = false
    }

    // Update Nodes Enabled
    if (config.nodes.nodesEnabled.toString() !== formData["Nodes enabled"].toString()) {
      sendEvent("data", {
        task: "updateNodesEnabled",
        data: formData["Nodes enabled"]
      })
    }



    hideModal()
  })

  $('select', form).select2({
    width: "100%"
  })
  modal(heading, form)
}
