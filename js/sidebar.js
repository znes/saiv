function sidebar() {
	var that = this;

	(function init (){

		$(".sidebar-toggle").on("click", function() {
	        $("body").toggleClass("sidebar-closed");
	        cy.resize();
	    });
	    
	})()

	this.showData = function (data) {
		that.open();
		$(".head").html(JSON.stringify(data));
	}

	this.addTag = function (element, ready) {
		element.html("");
		form = $('<form class="editForm"></form>');

		form.append(ElementCreator.createInput("Tag name", "tag", "", "text"));
		form.append('<input type="submit" value="Save">');

		form.submit(function(e) {
			e.preventDefault();
			ready(that.readForm().tag);
		});

		element.append(form);
	}

	this.readForm = function () {
	    var formData = {};
	    $.each($(".form input").serializeArray(), function(i, field) {
	        if (field.name.substring(0, 5) == "tags_") {
	            if (typeof(formData.tags) === "undefined")
	                formData.tags = {};
	            formData.tags[field.name.substring(5, field.name.length)] = field.value;
	        } else {
	            formData[field.name] = field.value;
	        }
	    }); 
	    $(".form select").val(function( index, value ) {
	        formData[this.name] = value;
	    });
	    return formData;
	}

	this.createForm = function (element, object, nodes) {
		element.html("");
		form = $('<form class="editForm"></form>');


		var objData = object.data();
		form.append(ElementCreator.createInput("currentid", "currentid", objData.id, "hidden"));

		if (objData.type == 'scenario') {
			form.append(ElementCreator.createInput("name", "name", objData.id, "text"));
			form.append(ElementCreator.createInput("type", "type", objData.type, "hidden"));
		}
		$.each(objData.data, function(key, value) {
			if (key == "tags") {
				form.append('<label>Tags</label><br/>');
				if(objData.type != "scenario")
					form.append('<a href="#" class="addTag">Add Tag</label><br/>');
				$.each(objData.data[key], function(tag, tagValue) {
					form.append('<a href="#" class="removeTag">Remove ' + tag + '</a><br/>');
					form.append(ElementCreator.createInput(tag, "tags_" + tag, tagValue, "text"));
				});
			} else if (key == "predecessors" || key == "successors") {
				form.append(ElementCreator.createSelect(key, value, nodes));
				$('.js-example-basic-multiple', form).select2();
			} else {
				form.append(ElementCreator.createInput(key, key, value, "text"));
			}
		});

		form.append('<input type="submit" value="Save">');
		form.submit(function(e) {
			e.preventDefault();

			var event = new CustomEvent("updateNode", {"detail": that.readForm()});
			document.dispatchEvent(event);
		});
		element.append(form);
	}

	this.addNode = function(element, pos, nodes) {
		element.html("");
		form = $('<form class="editForm"></form>');
		form.append(ElementCreator.createInput("name", "name", "", "text", true));
		form.append(ElementCreator.createInput("type", "type", "", "text", true));
		form.append(ElementCreator.createInput("posx", "posx", pos.x, "hidden"));
		form.append(ElementCreator.createInput("posy", "posy", pos.y, "hidden"));

		form.append('<input type="submit" value="Add Node">');


		form.submit(function(e) {
			e.preventDefault();

			var event = new CustomEvent("addNode", {"detail": that.readForm()});
			document.dispatchEvent(event);
		});
		element.append(form);
	}

	this.open = function () {
		$("body").toggleClass("sidebar-closed", false);
	}
}