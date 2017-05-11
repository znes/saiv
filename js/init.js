/**
 * DOM Ready
 */
$(function() {
    var json;
    var sb = new sidebar();
    var cy = new createCy();

    cy.on("tap", "node", {}, function(evt) {
        sb.showData(evt.cyTarget.data());
        // Create Node List
        sb.createForm($(".form"), evt.cyTarget, cy.elements("node"));
    });
    

    // Read Json
    getData();


    $('.downloadJson').click(function(){
        var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
        $('.downloadJson').prop("href", "data:" + data);
        $('.downloadJson').prop("download", "data.json");
    });

    $('.changeJson').click(function(){
        getData();
        return false;
    });


    document.addEventListener("dataReceived", function(e) {
        json = e.detail;

        var eles = ElementCreator.createCyElements(json);
        cy.add(eles);
        cy.makeLayout({
            name: "dagre"
        }).run();

        sb.showData(cy.$("node#" + json.name).data());
        sb.createForm($(".form"), cy.$("node#" + json.name), []);
    });


    document.addEventListener("formSubmit", function(e) {
        var data = e.detail;
        if(data.type == "scenario") {

        }
        else {
            json.children = $.grep(json.children, function (child) {
                return child.name != data.currentid;
            });
            delete data['currentid'];
            json.children.push(data);


            var eles = ElementCreator.createCyElements(json);
            cy.$("*").remove();
            cy.add(eles);
            cy.makeLayout({
                name: "dagre"
            }).run();

            sb.createForm($(".form"), cy.$("node#" + data.name), cy.elements("node"));
        }
    });
});