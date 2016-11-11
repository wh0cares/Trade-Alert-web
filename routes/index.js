var express = require('express');
var router = express.Router();

var db = require('../queries');


router.get('/api/stocks', db.getAllStocks);
router.get('/api/stocks/:symbol', db.getSingleStock);
router.post('/api/stocks', db.createStock);
router.put('/api/stocks/:symbol', db.updateStock);
router.get('/api/stocks/:symbol/:index/realtime', db.getStockRealtime);
router.get('/api/stocks/:symbol/volume', db.getStockRealtimeVolume);

router.post('/api/users/register', db.createUser);
router.post('/api/users/login', db.authenticateUser);

router.get('/api/users/portfolio', db.getUserPortfolio);
router.delete('/api/users/portfolio/:symbol', db.removeFromPortfolio);
router.post('/api/users/portfolio/:symbol', db.addToPortfolio);
module.exports = router;