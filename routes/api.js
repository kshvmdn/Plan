var express = require('express');
var request = require('request');
var config = require('../config');
var async = require('async');

var yelp = require("yelp").createClient({ // https://github.com/olalonde/node-yelp
  consumer_key: config.YELP_CONSUMER_KEY, 
  consumer_secret: config.YELP_CONSUMER_SECRET,
  token: config.YELP_TOKEN,
  token_secret: config.YELP_TOKEN_SECRET
});

var router = express.Router();

var MAPS_API_KEY = config.GMAPS_API_KEY;

router.get('/location/:origin/:destination', function(req, res, next) {
	origin = req.params.origin;
	destination = req.params.destination;
	request('https://maps.googleapis.com/maps/api/directions/json?origin='+origin+'&destination='+req.params.destination+'&key='+MAPS_API_KEY, function(error, response, body) {
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

				var req_steps = function(lat, lng, cb) {
					var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=' + MAPS_API_KEY; 
					request(url, function(error, response, body) {
						if (error) throw error;
						if (response.statusCode == 200) {
							body = JSON.parse(body);
							var nearest_address;
							if (body.results.length > 1)
								nearest_address = body.results[0].formatted_address;
							else
								nearest_address = body.results.formatted_address;
							cb(nearest_address);
						}
					});
				}

				var get_businesses = function(loc, cb) {
					if (typeof loc != "undefined") {
						yelp.search({term: "food", location: loc, limit: 3}, function(error, data) {
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

				async.waterfall([
					function(callback) {
						req_steps(step.end_location.lat, step.end_location.lng, function(loc){
							callback(null, loc);
						});
					}, function(loc, callback) {
						get_businesses(loc, function(businesses) {
							callback(null, businesses);
		 				});
					}, function(businesses, callback) {
						step.businesses = businesses;
						callback(null, step);
					}
				]);
				route.steps.push(step);			
			}
			res.render('location', {title: 'Plan', route: route });
			//res.send(route);
		}
	});
});

module.exports = router;
