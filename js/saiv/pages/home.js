$(document).ready(function() {
  $(config.dom.links.home).click(() => {
    if (discardChanges()) {
      home()
    }
  })
})


function home() {
  const content = $("<div>Home</div>")

  createContentPage("Saiv", content)
  setActiveMenuItem("home")
}
