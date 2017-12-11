import {modal, hideModal} from '../modal.js'
import {sendEvent} from '../helper.js'
import {scenarioEdit} from './scenario.js'



export function openJsonSelection() {
  let content = $("<div></div>")
  content.append("<p>Select File</p>")
    .append("<p><label class='btn btn-default'>Browse <input type='file' id='selectFile' hidden></label></p>")
    .append("<button class='createScenario btn btn-success pull-right'>Create new scenario</button>")

  modal("Select File", content)


  $("#selectFile").on('change', event => {
    $('.loaderDiv').show()
    let input = event.target
    sendFile(input.files[0])
  })

  $(".createScenario").on('click', () => {
    scenarioEdit(true)
  })
}


function sendFile(file) {
  let reader = new FileReader()

  reader.onload = function() {
    let dataURL = reader.result
    try {
      $('.loaderDiv').hide()
      let json = JSON.parse(dataURL)
      sendEvent("dataReceived", json)
      hideModal()
    } catch (e) {
      $('.loaderDiv').hide()
      modal("Error", "File not supported")
      console.log("Error", e)
    }
  };

  reader.readAsText(file)
}


export function initDropEvents() {
  document.addEventListener('dragover', e => {
    e.preventDefault()
  });

  document.addEventListener("drop", e => {
    e.preventDefault()
    const json = e.dataTransfer.files[0]

    sendFile(e.dataTransfer.files[0])
  })
}
