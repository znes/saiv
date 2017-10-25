/**
 * Init Saiv Plugin when dom is ready
 */
$(document).ready(()=> {
  const saivObj = new saiv()
  const mapPlugin = new LeafleatMap("map")

  saivObj.addPlugin(
    mapPlugin,
    ".showMap",
    "#map"
  )
})
