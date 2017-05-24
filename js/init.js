/**
 * DOM Ready
 */
$(function() {
    var datam = new DataManager();
    var sb = new sidebar();
    var cy = new createCy();

    //debug
    window.cy = cy;


    // Opens Page Select Json
    selectJson();


    /**
     * init Menu Listener
     */
    $('.changeJson').click(function(){
        selectJson();
    });

    $('.home').click(function(){
        home();
    });

    $('.styleSettings').click(function(){
        selectStyle();
    });

    $('.jsonSettings').click(function(){
        jsonSettings();
    });


    /**
     * Add cytoscape events
     */
    cy.on("click", "node", {}, showNode);
    // Add Context Menu to Canvas
    cy.contextMenus({
        menuItems: [
            {
                id: 'remove',
                title: 'Remove',
                selector: 'node',
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
                    var pos = event.position || event.cyPosition;

                    if(evtFromTarget.data().type == "scenario") {
                        modal("Error", "Cant be connected to type scenario");
                        return false;
                    }

                    cy.add([{ group: "edges", data: {
                        id: "testedge", source: evtFromTarget.data().id, 
                        target: evtFromTarget.data().id}}]);


                    cy.on("mouseover", "node", {}, function(_event) {
                        var evtToTarget = _event.target || _event.cyTarget;
                        cy.$('#testedge').move({target: evtToTarget.data().id});
                    });

                    cy.on("click", "node", {}, function(_event) {
                        var evtToTarget = _event.target || _event.cyTarget; 
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
                        unbindCy();
                    });
                }            
            },
            {
                id: 'add-node',
                title: 'Add node',
                coreAsWell: true,
                onClickFunction: function (event) {
                    var pos = event.position || event.cyPosition;
                    sb.addNode($(".form"), pos, cy.elements("node"));
                }
            },
            {
                id: 'center-map',
                title: 'Center Map',
                coreAsWell: true,
                onClickFunction: function (event) {
                    cy.reset()
                    cy.center()
                }
            }
            ]
          });



    // Init Event Reciver 
    document.addEventListener("dataReceived", function(e) {
        hideContentPage();
        initListenerDataRevieved();

        datam.json = e.detail;

        var eles = createCyElements(datam.json);
        cy.$("*").remove();
        cy.add(eles);
        cy.makeLayout({
            name: "dagre"
        }).run();

        sb.showData(cy.$("node#" + datam.json.name).data());
        sb.createForm($(".form"), cy.$("node#" + datam.json.name), []);
    });


    document.addEventListener("addNode", function(e) {
        var data = e.detail;
        var formdata = {
            name: data.name,
            type: data.type,
            tags: {},
            predecessors: [],
            successors: []
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

        sb.createForm($(".form"), cy.$("node#" + data.name), cy.elements("node"));
    });


    document.addEventListener("updateNode", function(e) {
        var data = e.detail;
        
        if(data.type == "scenario") {
            datam.updateScenario(data);
        }
        else {
            datam.updateChildren(data);

            var eles = createCyElements(datam.json);
            cy.$("*").remove();
            cy.add(eles);
            cy.makeLayout({
                name: "dagre"
            }).run();

            sb.createForm($(".form"), cy.$("node#" + datam.json.name), cy.elements("node"));
        }
    });


    function unbindCy() {
        cy.off('mouseover');
        cy.off('click');

        // Add default listener
        cy.on("click", "node", {}, showNode);
    }

    function showNode(evt) {
        sb.showData(evt.cyTarget.data());
        sb.createForm($(".form"), evt.cyTarget, cy.elements("node"));

        $(".editForm .addTag").on("click", function(){
            sb.addTag($(".form"), function(newTag) {
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

    function initListenerDataRevieved() {
        $(".navbar .shoWExplorer").click(function(){
            setActiveMenuItem("Explorer");
            hideContentPage();
        }).click();

        $(".navbar .downloadJson").click(function(){
            var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datam.json));
            $('.downloadJson').prop("href", "data:" + data);
            $('.downloadJson').prop("download", "data.json");
        }).parent("li").removeClass("disabled");
    }
});