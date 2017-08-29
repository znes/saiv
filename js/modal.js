function modal(head = "", content = "", abortFunction = function(){} ) {
	// Get the modal
	const modal = $(config.dom.modal.container)
	const backdrop = $(config.dom.modal.backdrop)
	$(config.dom.modal.heading).text(head)
	$(config.dom.modal.body).html(content)

	// Get the <span> element that closes the modal
	modal.addClass("in")
	backdrop.addClass("in")

	window.setTimeout(() => {
		modal.off("click")
			.on("click", (event) => {
			    if ($(event.target).hasClass("modal")) {
			    	abortFunction()
			    	hideModal()
			    }
			})

		modal.find(".close, .btn-default").off("click")
			.on("click", (event) => {
				abortFunction()
			    hideModal()
			})
	},100)
}
