function openJsonSelection(firstCall = false) {
  let content = "Select File<br>";
  content += "<input id='selectFile' type='file'><br>";
  content += "<button id='useDefault'>Use default</button>"
  
  createContentPage("Select File", content )
  setActiveMenuItem("UploadJson")

  if(firstCall)
    initDropEvents();

  $("#selectFile").on('change', event => {
    let input = event.target
    sendFile(input.files[0]);
  });

  $("#useDefault").click(function() {
    $.getJSON("minimal-example.json", jsonData => {
      submitJson(jsonData)
    });
  });


  function sendFile(file) {
    let reader = new FileReader()

    reader.onload = function() {
      let dataURL = reader.result
      try {
        let json = JSON.parse(dataURL)
        submitJson(json)
      } catch(e) { 
        modal("Error", "File not supported")
      }
    };

    reader.readAsText(file)
  }


  function submitJson(json) {
    let event = new CustomEvent("dataReceived", {"detail": json})
    document.dispatchEvent(event)
  }


  function initDropEvents() {
    document.addEventListener('dragover', e => {
      e.preventDefault()
    });

    document.addEventListener("drop", e => {
      console.log("drop")
      e.preventDefault()  
      const json = e.dataTransfer.files[0]

      sendFile(e.dataTransfer.files[0]);
    })
  }
}