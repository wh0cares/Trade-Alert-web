var express = require('express');
var router = express.Router();

var db = require('../queries');


router.get('/api/stocks', db.getAllStocks);
router.get('/api/stocks/:id', db.getSingleStock);
router.post('/api/stocks', db.createStock);
router.put('/api/stocks/:id', db.updateStock);
router.delete('/api/stocks/:id', db.removeStock);


module.exports = router;