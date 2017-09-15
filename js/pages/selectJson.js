function openJsonSelection() {
  let content = $("<div></div>")
  content.append("<p>Select File</p>")
    .append("<p><label class='btn btn-default'>Browse <input type='file' id='selectFile' hidden></label></p>")
    .append("<button id='useDefault' class='btn btn-primary'>Use default</button>")
    .append("<button class='createScenario btn btn-success pull-right'>Create new scenario</button>")

  modal("Select File", content )


  $("#selectFile").on('change', event => {
    let input = event.target
    sendFile(input.files[0])
  })

  $("#useDefault").on('click', () => {
      $.getJSON("minimal-example.json", jsonData => {
        sendEvent("dataReceived", jsonData)
        hideModal()
      })
        .fail(function(er) {
          modal("Error", "Cross orgin error. Choose json file above or drop it.")
        })
  })

  $(".createScenario").on('click', () => {
    scenario()
  })
}



function sendFile(file) {
  let reader = new FileReader()

  reader.onload = function() {
    let dataURL = reader.result
    try {
      let json = JSON.parse(dataURL)
      sendEvent("dataReceived", json)
      hideModal()
    } catch(e) {
      modal("Error", "File not supported")
    }
  };

  reader.readAsText(file)
}


function initDropEvents() {
  document.addEventListener('dragover', e => {
    e.preventDefault()
  });

  document.addEventListener("drop", e => {
    e.preventDefault()
    const json = e.dataTransfer.files[0]

    sendFile(e.dataTransfer.files[0])
  })
}
