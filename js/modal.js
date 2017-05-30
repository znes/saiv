function modal(head = "", content = "", abortFunction = function(){} ) {
	// Get the modal
	var modal = $('.modal')
	$('.modal-content .modal-header h2').html(head)
	$('.modal-content .modal-body').html(content)

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
    $('.modal').hide()
    $('html').off('click')
}