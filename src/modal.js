import {config} from './globals.js';


export function modal(head = "", content = "", abortFunction = function() {}) {
  // Get the modal
  const modal = $(config.dom.modal.container)
  const backdrop = $(config.dom.modal.backdrop)
  $(config.dom.modal.heading).text(head)
  $(config.dom.modal.body).html(content)


  // Move success buttons to footer
  modal.find(".modal-footer .btn-success").remove()
  modal.find(".modal-body .btn-success").insertAfter('.modal-footer .btn-default')
  modal.find(".modal-footer .btn-success").on("click", e => {
    modal.find("form").submit()
  })

  modal.addClass("in")
  backdrop.addClass("in")

  window.setTimeout(() => {
    modal
      .off("click")
      .on("click", (event) => {
        if ($(event.target).hasClass("modal")) {
          abortFunction()
          hideModal()
        }
      })

    modal.find(".modal-header .close, .modal-footer .btn-default")
      .off("click")
      .on("click", (event) => {
        abortFunction()
        hideModal()
      })
  }, 100)
}

export function hideModal() {
  $(config.dom.modal.backdrop).removeClass("in")
  $(config.dom.modal.container).removeClass("in")
}
