/**
 * DOM Ready
 */
$(function() {
    var cy,eles,json;
    $(".sidebar-toggle").on("click", function() {
        $("body").toggleClass("sidebar-closed");
        cy.resize();
    });

    cy = cytoscape({
        container: $(".container"),
        layout: {
            name: "dagre",
            fit: true
        },
        style: [{
            selector: "node",
            style: {
                "content": "data(id)",
                "text-opacity": 0.5,
                "text-valign": "center",
                "text-halign": "right",
                "background-color": "#11479e"
            }
        }, {
            selector: "edge",
            style: {
                "width": 4,
                "target-arrow-shape": "triangle",
                "line-color": "#9dbaea",
                "target-arrow-color": "#9dbaea",
                "curve-style": "bezier"
            }
        }, {
            selector: ":selected",
            style: {
                "background-color": "#000"
            }
        }]
    });

    cy.on("tap", "node", {}, function(evt) {
        console.log(evt.cyTarget.data());
        $("body").toggleClass("sidebar-closed", false);
        showData(evt.cyTarget.data());
        // Create Node List
        var eles = cy.elements("node");
        ElementCreator.createForm($(".form"), evt.cyTarget, submitFunction, eles);
    });

<<<<<<< HEAD
    // Read Json
    readJson(function (jsonData) {
=======

    $.getJSON("minimal-example.json", function(jsonData) {
        console.log(jsonData);
>>>>>>> Initial Commit
        json = jsonData;
        eles = ElementCreator.createCyElements(jsonData);
        cy.add(eles);

        cy.makeLayout({
            name: "dagre"
        }).run();

        showData(cy.$("node#" + jsonData.name).data());
        ElementCreator.createForm($(".form"), cy.$("node#" + jsonData.name), submitFunction, []);
    });
<<<<<<< HEAD


=======
>>>>>>> Initial Commit
    function submitFunction (e) {
        var data = readData(e);
        //console.log(data);
        if(data.type == "scenario") {

        }
        else {
            json.children = $.grep(json.children, function (child) {
                return child.name != data.currentid;
            });
            delete data['currentid'];

            json.children.push(data);

            eles = ElementCreator.createCyElements(json);
            cy.$("*").remove();
            cy.add(eles);
            cy.makeLayout({
                name: "dagre"
            }).run();

            // Create Node List
            var eles = cy.elements("node");
            ElementCreator.createForm($(".form"), cy.$("node#" + data.name), submitFunction, eles);
        }
    }
});

function showData(text) {
    $(".head").html(JSON.stringify(text));
}

function readData(e) {
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
    console.log(formData);
    return formData;
}