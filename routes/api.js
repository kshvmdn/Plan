var express = require('express');
var request = require('request');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with resource');
});

module.exports = router;
