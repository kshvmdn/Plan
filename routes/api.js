var express = require('express');
var request = require('request');
var config = require('../config');

var yelp = require("yelp").createClient({ // https://github.com/olalonde/node-yelp
  consumer_key: config.YELP_CONSUMER_KEY, 
  consumer_secret: config.YELP_CONSUMER_SECRET,
  token: config.YELP_TOKEN,
  token_secret: config.YELP_TOKEN_SECRET
});

var router = express.Router();

var MAPS_API_KEY = config.GMAPS_API_KEY;

router.get('/location/:start/:end', function(req, res, next) {

	var get_businesses = function(lat, lng, cb) {
		request('https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key='+MAPS_API_KEY, function(error, response, body) {
			if (response.statusCode == 200) {
				body = JSON.parse(body);
				var nearest_address;
				if (body.results.length > 1) {
					nearest_address = body.results[0].formatted_address;
				} else {
					nearest_address = body.results.formatted_address;
				}

				if (typeof nearest_address != "undefined") {
					yelp.search({term: "food", location: nearest_address, limit: 3}, function(error, data) {
						if (error) throw error;
						var businesses = [];
						for (var j = 0; j < data.businesses.length; j++) {
							var business = {};
							business.business_name = data.businesses[j].name;
							business.yelp_url = data.businesses[j].url;
							business.img_url = data.businesses[j].image_url;
							businesses.push(business);
						}
						cb(businesses);
					});
				}
			}
		});
	}

	request('https://maps.googleapis.com/maps/api/directions/json?origin=Toronto&destination=Montreal&key='+MAPS_API_KEY, function(error, response, body) {
		if (error) throw error;
		if (response.statusCode == 200) {
			body = JSON.parse(body);
			var route = {
				distance : body.routes[0].legs[0].distance.text,
				duration : body.routes[0].legs[0].duration.text,
				start_address : body.routes[0].legs[0].start_address,
				end_address : body.routes[0].legs[0].end_address,
				steps : []
			};

			var steps = body.routes[0].legs[0].steps;
			for (var i = 0; i < steps.length; i++) {
				var step = {};

				step.instructions = steps[i].html_instructions;
				step.start_location = steps[i].start_location;
				step.end_location = steps[i].end_location;
				step.distance = steps[i].distance.text;
				step.duration = steps[i].duration.text;
				step.businesses = [];

				get_businesses(step.end_location.lat, step.end_location.lng, function(businesses){
					step.businesses = [1,2,3];
					//console.log(businesses);
					//console.log(step);
				});
				route.steps.push(step);
			}
			console.log(route);
			//res.render('location', {title: 'Plan', route: route });
			res.send(route);
		}
	});

});

module.exports = router;
