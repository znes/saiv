/**
 * DOM Ready
 */
$(function() {
    var datam = new jsonmanager();
    var sb = new sidebar();
    var cy = new createCy();

    window.cy = cy;

    cy.on("click", "node", {}, showNode);

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

    cy.contextMenus({
        menuItems: [
            {
                id: 'remove',
                title: 'Remove',
                selector: 'node',
                //selector: 'node, edge',
                onClickFunction: function (event) {
                    var target = event.target || event.cyTarget;
                    datam.deleteItem(target.data().data.name)
                    target.remove();
                }
            },
            {
                id: 'add-successors',
                title: 'Connect successors',
                selector: 'node',
                onClickFunction: function (event) {
                    var evtFromTarget = event.target || event.cyTarget;
                    console.log(evtFromTarget.data().id);
                    var pos = event.position || event.cyPosition;

                    /*cy.add([
                      { group: "nodes", data: { id: "n1" }, position: { x: pos.x, y: pos.y } },
                      { group: "edges", data: { id: "e012", source: evtFromTarget.data().id, target: "n1" } }
                    ]);*/
                    cy.add([{ group: "edges", data: {
                        id: "testedge", source: evtFromTarget.data().id, 
                        target: evtFromTarget.data().id}}]);


                    cy.on("mouseover", "node", {}, function(_event) {
                        console.log("mouseover");
                        var evtToTarget = _event.target || _event.cyTarget;
                        /*var pos = event.position || event.cyPosition;*/
                        cy.$('#testedge').move({target: evtToTarget.data().id});
                        /*cy.$('e012').show();*/
                    });

                    cy.on("click", "node", {}, function(_event) {
                        console.log("mouseclick");
                        var evtToTarget = _event.target || _event.cyTarget; 
                        console.log(evtToTarget.data().type);
                        /*var pos = event.position || event.cyPosition;*/
                        if(evtFromTarget == evtToTarget ) {
                            modal("Error", "Cant connect to same node");
                        }
                        else if (evtToTarget.data().type == "scenario") {
                            modal("Error", "Cant be connected to type scenario");
                        }
                        else {
                            if(datam.addEdge(evtFromTarget.data().id, evtToTarget.data().id)) {
                                cy.add([{ group: "edges", data: { source: evtFromTarget.data().id, target: evtToTarget.data().id}}]);
                            } else {
                                modal("Error", "Already exists");
                            }
                            showNode(_event);
                        }
                        cy.$('#testedge').remove();
                        unbind();
                    });
                }            
            },
            {
                id: 'add-node',
                title: 'add node',
                coreAsWell: true,
                onClickFunction: function (event) {
                    /*var data = {
                        group: 'nodes',
                        data: {
                            name: "",
                            type: "",
                            tags: []
                        }
                    };*/
                  
                    var pos = event.position || event.cyPosition;
                  
                    /*cy.add({
                        data: data,
                        position: {
                            x: pos.x,
                            y: pos.y
                        }
                    });*/

                    sb.addNode($(".form"), pos, cy.elements("node"));
                }
            }]
          });


    document.addEventListener("dataReceived", function(e) {
        datam.newData(e.detail);

        var eles = ElementCreator.createCyElements(datam.json);
        cy.add(eles);
        cy.makeLayout({
            name: "dagre"
        }).run();

        sb.showData(cy.$("node#" + datam.json.name).data());
        sb.createForm($(".form"), cy.$("node#" + datam.json.name), []);

        hideModal();
    });


    document.addEventListener("addNode", function(e) {
        var data = e.detail;
        var formdata = {
            name: data.name,
            type: data.type,
            tags: {},
            predecessors: data.predecessors,
            successors: data.successors
        };

        datam.addNode(
            formdata
        );

        cy.add({
            data: {
                group: "nodes",
                id: data.name,
                data: formdata
            },
            position: {
                x: parseInt(data.posx),
                y: parseInt(data.posy)
            }
        });
    });


    document.addEventListener("formSubmit", function(e) {
        var data = e.detail;
        console.log(data);
        if(data.type == "scenario") {
            datam.updateScenario(data);
        }
        else {
            datam.updateChildren(data);

            var eles = ElementCreator.createCyElements(datam.json);
            cy.$("*").remove();
            cy.add(eles);
            cy.makeLayout({
                name: "dagre"
            }).run();

            sb.createForm($(".form"), cy.$("node#" + datam.json.name), cy.elements("node"));
        }
    });


    function unbind() {
        cy.off('mouseover');
        cy.off('click');

        // Add default listener
        cy.on("click", "node", {}, showNode);
    }

    function showNode(evt) {
        sb.showData(evt.cyTarget.data());
        sb.createForm($(".form"), evt.cyTarget, cy.elements("node"));

        $('.editForm .addTag').on("click", function(){
            sb.addTag($(".form"), function(newTag) {
                console.log(newTag);
                console.log(evt.cyTarget.data().data.name);
                datam.addTag(evt.cyTarget.data().data.name, newTag);

                showNode(evt);
            });
        });

        $('.editForm .removeTag').on("click", function(){
            var tag = $(this).text().substring(7, $(this).text().length);
            datam.removeTag(evt.cyTarget.data().data.name, tag);
            showNode(evt);
        });
    }
});

