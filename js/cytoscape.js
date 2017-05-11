function createCy() {
	var cy;

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

    



    return cy;
}