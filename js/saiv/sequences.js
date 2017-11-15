function createSequence(name, currentData = null) {
  let heading, content;
  [heading, content] = createSequenceContainer()

  heading.append("Upload Csv")
  content.append(createUpload(name, currentData))
}


function showSequence(name, data = null) {
  let heading, content;
  [heading, content] = createSequenceContainer()

  if (data) {
    heading.append("Sequences")
    let [plots, labels] = generatePlotData(data)
    for (var i = 0; i < plots.length; i++) {
      createSequenceLabel(labels[i])
      createSequencePlot(plots[i])
    }
  }
}


function createSequenceContainer() {
  let container = $(".sequenceContainer")
    .show()

  let closeIcon = $('<span class="close">×</span>')
  let heading = $('<h3></h3>')
  let content = $('<div class="sequenceContent"></div>')

  heading.append(closeIcon)

  closeIcon.on("click", () => {
    container.hide()
  })

  container.html("")
    .append(heading, content)

  return [heading, content]
}

function deleteSequence(name, entry = null) {
  if (entry) {
    sendEvent("data", {
      task: "deleteSequence",
      data: {
        name: name,
        data: entry
      }
    })

    sidebarShowId(name)
  } else {
    sendEvent("data", {
      task: "deleteSequences",
      data: name
    })

    sidebarShowId(name)
  }
}

function generatePlotData(data) {
  let plData = []
  let labels = []

  if (data["time"]) {
    Object.keys(data).forEach(key => {
      if (key != "time") {
        plData.push({
          x: data.time,
          y: data[key],
          type: "bar"
        })

        labels.push(key)
      }
    })
  } else {
    alert('Time is missing in Object')
  }
  return [plData, labels]
}

function createUpload(name, currentData) {
  const content = $("<label class='btn btn-default'>Browse <input type='file' id='selectCSV' hidden></label>")

  // Create Upload Listener
  content.find("#selectCSV")
    .on('change', event => {
      const input = event.target
      const reader = new FileReader()

      $('.loaderDiv').show()

      reader.onload = function() {
        let obj, plotData

        try {
          obj = csvToObj(reader.result)
        } catch (e) {
          console.log(e)
          modal("Error", "File not supported")
        }


        $('.loaderDiv').hide()
        $(".sequencePlot").remove()

        createSequenceForm(name, obj, currentData)
      };

      if (input.files)
        reader.readAsText(input.files[0])
    })

  return content
}


function createSequenceLabel(label) {
  const ele = document.createElement('h4')
  ele.innerHTML = label
  $(".sequenceContent").append($(ele))
}
function createSequencePlot(plot) {
  const ele = document.createElement('div')
  ele.className = "sequencePlot"
  ele.style.width = $(".sequenceContainer").width() + "px"
  ele.style.height = 200 + "px"
  $(".sequenceContent").append($(ele))


  Plotly.plot(ele, [plot], {
    margin: {
      l: 25,
      r: 25,
      t: 25,
      b: 25
    }
  })
}


function createSequenceForm(name, obj, currentData, i = 1, x = 0, y = 1, h = 0) {
  if ($('.sequenceContainer .row').length > 0) {
    $('.sequenceContainer .row').remove()
  }
  let hasTime = false;
  if (currentData) {
    if (currentData.time) {
      hasTime = true
    }
  }

  exampleSequencePlot(i, x, y)

  let form = '<div class="row">'
  form += '<div class="col-lg-6">'
  form += '<form class="sequenceForm">'
  form += createInputSequence("Header Index", "hindex", h, "number", true)
  form += createInputSequence("Start Data Index", "startI", i, "number", true)
  if (!hasTime)
    form += createInputSequence("X-Index", "xindex", x, "number", true)

  form += createInputSequence("Y-Index", "yindex", y, "number", true)
  form += createInput("name", "name", name, "hidden")
  form += '<a class="btn btn-success saveSequence">Save</a>'
  form += '<a class="btn btn-success updatePlot">Update Plot</a>'
  form += '<a class="btn btn-warning closePlot">Close</a>'
  form += '</form>'
  form += '</div>'
  form += '</div>'

  $('.sequenceContainer').append(form)


  exampleSequence(obj, i, x, y, h)

  function exampleSequence(_data, _i, _x, _y, _h) {
    console.log("exampleSequence+", _data)
    if ($('.exampleSequence').length > 0) {
      $('.exampleSequence').remove()
    }
    try {
      let example = $('<div class="exampleSequence col-lg-6"><h5>Example of first data</h5></div>')
      if (hasTime) {
        example.append('<p>X: ' + shortString(currentData.time[0]) + '<br>Y: ' + shortString(_data[_i][_y]) + ' </p>')
      } else {
        example.append('<p>X: ' + shortString(_data[_i][_x]) + '<br>Y: ' + shortString(_data[_i][_y]) + ' </p>')
      }
      example.append('<p>Header-X: Time<br>Header-Y: ' + shortString(_data[_h][_y]) + ' </p>')

      $('.sequenceContainer .row').append(example)
    } catch (e) {
      console.log(e)
    }
  }

  function exampleSequencePlot(_i, _x, _y) {
    let plotData = {
      x: null,
      y: null,
      type: "bar"
    }
    if (hasTime) {
      plotData.x = obj.time
      plotData.y = getArrayRowEntrys(obj.slice(_i), _y)
    } else {
      plotData.x = getArrayRowEntrys(obj.slice(_i), _x)
      plotData.y = getArrayRowEntrys(obj.slice(_i), _y)
    }
    createSequencePlot(plotData)
  }


  $(".sequenceForm input").on("change", (e) => {
    let formData = readForm('.sequenceForm')
    exampleSequence(obj, formData.startI, formData.xindex, formData.yindex, formData.hindex)
  })


  $('.sequenceForm .updatePlot').on('click', e => {
    let formData = readForm('.sequenceForm')
    //converData = convertToPlotly(obj.slice(formData.startI), formData.xindex, formData.yindex)
    $(".sequencePlot").remove()

    if (hasTime)
      exampleSequencePlot(obj.slice(formData.startI), 0, formData.yindex)
    else
      exampleSequencePlot(obj.slice(formData.startI), formData.xindex, formData.yindex)


    //createSequencePlot(converData)
  })

  $('.sequenceForm .closePlot').on('click', e => {
    $(".sequenceContainer").hide()
  })

  $('.sequenceForm .saveSequence').on('click', e => {
    e.preventDefault()
    let formData = readForm('.sequenceForm')
    console.log("save:")

    let eventData = {
      time: getArrayRowEntrys(obj.slice(formData.startI), formData.xindex)
    }
    eventData[obj[formData.hindex][formData.yindex]] = getArrayRowEntrys(obj.slice(formData.startI), formData.yindex)

    sendEvent("data", {
      task: "addSequence",
      data: {
        name: formData.name,
        data: eventData
      }
    })

    $(".sequenceContainer").hide()
    sidebarShowId(formData.name)
  })
}


function createInputSequence(label, key, currentValue, type, required = false, additionalTags = "") {
  let html = "<div class=\"input-group input-group-sm\">"

  if (type != "hidden") {
    html += '<span class="input-group-addon" id="describedby_' + key + '">' + label + '</span>'
  }
  if (required) {
    html += '<input class="form-control" aria-describedby="describedby_' + key + '" required type="' + type + '" id="' + key + '" name="' + key + '" ' + additionalTags + ' value="' + currentValue + '"/>'
  } else {
    html += '<input class="form-control" aria-describedby="describedby_' + key + '" type="' + type + '" id="' + key + '" name="' + key + '" ' + additionalTags + ' value="' + currentValue + '"/>'
  }
  html += "</div>"

  return html
}
