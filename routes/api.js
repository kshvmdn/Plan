var express = require('express');
var request = require('request');
var config = require('../config');

var router = express.Router();

router.get('/location/:start/:end', function(req, res, next) {
	request('https://maps.googleapis.com/maps/api/directions/json?origin=Toronto&destination=Montreal&key='+config.GMAPS_API_KEY, function(error, response, body) {
		if (error) throw error;
		if (response.statusCode == 200) {
			body = JSON.parse(body);
			var distance_text = body.routes[0].legs[0].distance.text;
			var duration_text = body.routes[0].legs[0].duration.text;
			var start_address = body.routes[0].legs[0].start_address;
			var end_address = body.routes[0].legs[0].end_address;

			var steps = body.routes[0].legs[0].steps;
			for (var i = 0; i < steps.length; i++) {
				console.log(steps[i].end_location);
			}
		}
	});
	res.send('respond with api resource');
});

module.exports = router;
