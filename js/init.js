/**
 * DOM Ready
 */
$(function() {
    var datam = new jsonmanager();
    var sb = new sidebar();
    var cy = new createCy();
    window.csy = cy;

    cy.on("click", "node", {}, function(evt) {
        console.log(evt);
           if (evt.originalEvent.which == 3) {  
              alert("rechtsklick");  
           }  

        sb.showData(evt.cyTarget.data());
        sb.createForm($(".form"), evt.cyTarget, cy.elements("node"));
    });

    cy.on("cxttap", "node", {}, function(evt) {
        alert("rechtsklick");
    });
    
    // Read Json
    getData();


    $('.downloadJson').click(function(){
        var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datam.json));
        $('.downloadJson').prop("href", "data:" + data);
        $('.downloadJson').prop("download", "data.json");
    });

    $('.changeJson').click(function(){
        getData();
        return false;
    });


    document.addEventListener("dataReceived", function(e) {
        datam.newData(e.detail);
        console.log(datam.json);

        var eles = ElementCreator.createCyElements(datam.json);
        cy.add(eles);
        cy.makeLayout({
            name: "dagre"
        }).run();

        sb.showData(cy.$("node#" + datam.json.name).data());
        sb.createForm($(".form"), cy.$("node#" + datam.json.name), []);

        hideModal();
    });


    document.addEventListener("formSubmit", function(e) {
        var data = e.detail;
        if(data.type == "scenario") {

        }
        else {
            datam.updateChildren(e.detail);

            var eles = ElementCreator.createCyElements(datam.json);
            cy.$("*").remove();
            cy.add(eles);
            cy.makeLayout({
                name: "dagre"
            }).run();

            sb.createForm($(".form"), cy.$("node#" + datam.json.name), cy.elements("node"));
        }
    });
});