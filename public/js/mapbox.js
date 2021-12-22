export const displayMap = (locations) => {
	mapboxgl.accessToken =
		'pk.eyJ1IjoidGFyZWstbW9raHRhciIsImEiOiJja3d5MHNlYm8waWYwMzRxdHZ5c2o3MHRtIn0.zAUnjJNZ6gx1UVPI9r8bAA';

	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/tarek-mokhtar/ckwy258e1hdf114oc0e2zs3c7',
		scrollZoom: false,
		/*center: [-118.25223, 33.998723],
	zoom:10,
	interactive:false*/
	});

	const bounds = new mapboxgl.LngLatBounds();

	locations.forEach((loc) => {
		// Create marker
		const el = document.createElement('div');
		el.className = 'marker';

		// Add marker
		new mapboxgl.Marker({
			element: el,
			anchor: 'bottom',
		})
			.setLngLat(loc.coordinates)
			.addTo(map);

		// Add popup
		new mapboxgl.Popup({
			offset: 30,
		})
			.setLngLat(loc.coordinates)
			.setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
			.addTo(map);

		// Extend map bounds to include current location
		bounds.extend(loc.coordinates);
	});

	map.fitBounds(bounds, {
		padding: {
			top: 200,
			bottom: 150,
			left: 100,
			right: 100,
		},
	});
};
