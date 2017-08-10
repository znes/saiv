var mymap = L.map('mapid').setView([51.505, -0.09], 13);


var currentPoints = []

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
}).addTo(mymap);

var marker = L.marker([51.5, -0.09]).addTo(mymap)



var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(mymap)


polygon.bindPopup("I am a polygon.")

var ghostPoly = null;

document.getElementById("createPoly").addEventListener("click", (e) => {
	console.log("Start NOW")

	
	mymap.on('click', e => {
		console.log(e.latlng)
		currentPoints.push(e.latlng)

		if(currentPoints.length == 2) {
			ghostPoly = L.polygon(currentPoints);
			ghostPoly.addTo(mymap)
		}


		if(currentPoints.length >= 2)
			ghostPoly.setLatLngs(currentPoints)
	});
})

document.getElementById("savePoly").addEventListener("click", (e) => {
	mymap.off('click')
	ghostPoly = null
	currentPoints = []
})
document.getElementById("clear").addEventListener("click", (e) => {
	mymap.off('click')
	ghostPoly.remove()
	ghostPoly = null
	currentPoints = []
})