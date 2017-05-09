function modal(head = "", content = "", abortFunction = function(){} ) {
	// Get the modal
	var modal = $('.modal');
	$('.modal-content .modal-header h2').html(head);
	$('.modal-content .modal-body').html(content);

	// Get the <span> element that closes the modal
	var span = $(".close");

	modal.show();

	span.onclick = function() {
	    modal.hide();
	    abortFunction();
	}

	$('html').click(function(event) {
		console.log("dada");
		console.log(event.target);
	    if (!$.contains(modal[0], event.target) && event.target != modal[0]) {
	    	abortFunction();
	        modal.hide();
	        $('html').off('click');
	    }
	});
}