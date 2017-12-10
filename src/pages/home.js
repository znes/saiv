import {createContentPage, setActiveMenuItem} from '../helper.js'

export function home() {
  const content = $("<div>Home</div>")

  createContentPage("Saiv", content)
  setActiveMenuItem("home")
}
