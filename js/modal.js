function modal(head = "", content = "", abortFunction = function(){} ) {
	console.log(content);
	// Get the modal
	const modal = $(config.dom.modal.container)
	$(config.dom.modal.heading).text(head)
	$(config.dom.modal.body).html(content)

	// Get the <span> element that closes the modal
	modal.show()

	window.setTimeout(() => {
		$('html').on("click", (event) => {
		    if (!$.contains(modal[0], event.target) && event.target != modal[0]) {
		    	abortFunction()
		    	hideModal()
		    }
		})

		modal.find(".close").click((event) => {
			abortFunction()
		    hideModal()
		})
	},100)
}
function hideModal() {
    $(config.dom.modal.container).hide()
    $('html').off('click')
}