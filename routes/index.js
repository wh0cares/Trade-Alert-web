var express = require('express');
var router = express.Router();

var db = require('../queries');


router.get('/api/stocks', db.getAllStocks);
router.get('/api/stocks/:symbol', db.getSingleStock);
router.post('/api/stocks', db.createStock);
router.put('/api/stocks/:id', db.updateStock);
//router.delete('/api/stocks/:id', db.removeStock);
router.post('/api/users/register', db.createUser);
router.post('/api/users/login', db.authenticateUser);
router.get('/api/stocks/:id/volume', db.getStockVolume);
router.get('/api/users/stocks', db.getAllUserStocks);

module.exports = router;