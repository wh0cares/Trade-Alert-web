var promise = require('bluebird');

var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connection = 'postgres://postgres:stkadmin@localhost:5432/stocks';
var db = pgp(connection);

function getAllStocks(req, res, next) {
    db.any('select * from stock ORDER BY id')
        .then(function(data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved all stocks'
                });
        })
        .catch(function(err) {
            return next(err);
        });
}

function getSingleStock(req, res, next) {
    var stockID = parseInt(req.params.id);
    db.one('select * from stock where id = $1', stockID)
        .then(function(data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved single stock'
                });
        })
        .catch(function(err) {
            return next(err);
        });
}

function createStock(req, res, next) {
    var Xray = require("x-ray");
    var xray = new Xray();

    xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', 'title')(function(err, name) {
        name = name.split(':');
        req.body.name = name[0];
        req.body.volume = parseInt(req.body.volume);
        db.none('insert into stock(date, name, index, symbol, volume)' +
                'values(${date}, ${name}, ${index}, ${symbol}, ${volume})',
                req.body)
            .then(function() {
                res.status(200)
                    .json({
                        status: 'success',
                        message: 'Inserted stock'
                    });
            })
            .catch(function(err) {
                return next(err);
            });
    });
}

function updateStock(req, res, next) {
    db.none('update stock set date=$1, name=$2, index=$3, symbol=$4, volume=$5 where id=$6', [req.body.date, req.body.name, req.body.index,
            req.body.symbol, parseInt(req.body.volume), parseInt(req.params.id)
        ])
        .then(function() {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'Updated stock'
                });
        })
        .catch(function(err) {
            return next(err);
        });
}

function removeStock(req, res, next) {
    var stockID = parseInt(req.params.id);
    db.result('delete from stock where id = $1', stockID)
        .then(function(result) {
            res.status(200)
                .json({
                    status: 'success',
                    message: `Removed ${result.rowCount} stock`
                });
        })
        .catch(function(err) {
            return next(err);
        });
}


module.exports = {
    getAllStocks: getAllStocks,
    getSingleStock: getSingleStock,
    createStock: createStock,
    updateStock: updateStock,
    removeStock: removeStock
};
