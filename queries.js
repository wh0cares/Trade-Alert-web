var promise = require('bluebird');

var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connection = 'postgres://postgres:stkadmin@localhost:5432/project-stk';
var db = pgp(connection);

var Xray = require("x-ray");
var xray = new Xray();

function getAllStocks(req, res, next) {
    db.any('select * from stocks ORDER BY id')
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
    db.one('select * from stocks where id = $1', stockID)
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
    var datesArray = []
    var volumesArray = []
    xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', '.lm', [{
        dates: ''
    }])(function(err, data) {
        for (i = 1; i < 31; i++) {
            var dates = data[i].dates;
            var dates = dates.replace("\n", '');
            datesArray.push(dates);
        }
    });
    xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', '.rgt.rm', [{
        volumes: ''
    }])(function(err, data) {
        for (i = 1; i < 31; i++) {
            var volumes = data[i].volumes;
            var volumes = volumes.replace("\n", '');
            var volumes = volumes.replace(/,/g, '');
            volumesArray.push(parseInt(volumes));
        }
    });
    xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', 'title')(function(err, name) {
        name = name.split(':');
        req.body.name = name[0];
        req.body.dates = datesArray;
        req.body.volumes = volumesArray;
        db.none('insert into stocks(dates, name, index, symbol, volumes)' +
                'values(${dates}::text[], ${name}, ${index}, ${symbol}, ${volumes}::integer[])',
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
    var datesArray = []
    var volumesArray = []
    xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', '.lm', [{
        dates: ''
    }])(function(err, data) {
        for (i = 1; i < 31; i++) {
            var dates = data[i].dates;
            var dates = dates.replace("\n", '');
            datesArray.push(dates);
        }
    });
    xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', '.rgt.rm', [{
        volumes: ''
    }])(function(err, data) {
        for (i = 1; i < 31; i++) {
            var volumes = data[i].volumes;
            var volumes = volumes.replace("\n", '');
            var volumes = volumes.replace(/,/g, '');
            volumesArray.push(parseInt(volumes));
        }
    });
    xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', 'title')(function(err, name) {
        name = name.split(':');
        req.body.name = name[0];
        req.body.dates = datesArray;
        req.body.volumes = volumesArray;
        db.none('update stocks set dates=$1::text[], name=$2, index=$3, symbol=$4, volumes=$5::integer[] where id=$6', [req.body.dates, req.body.name, req.body.index,
                req.body.symbol, req.body.volumes, parseInt(req.params.id)
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
    });
}

function removeStock(req, res, next) {
    var stockID = parseInt(req.params.id);
    db.result('delete from stocks where id = $1', stockID)
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

//TODO Dont create user if username and/or email is already in use
function createUser(req, res, next) {
    db.none('insert into users(username, password, email)' +
            "values(${username}, crypt(${password}, gen_salt('md5')), ${email})",
            req.body)
        .then(function() {
            res.status(200)
                .json({
                    status: 'success',
                    message: 'User registered'
                });
        })
        .catch(function(err) {
            return next(err);
        });
}

function authenticateUser(req, res, next) {
    db.one("SELECT ${username} FROM users WHERE ${username} = ${username} AND password = crypt(${password}, password)", req.body)
        .then(function(data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'User logged in'
                });
        })
        .catch(function(err) {
            return next(err);
        });
}

function getStockVolume(req, res, next) {
    var stockID = parseInt(req.params.id);
    db.one('select name, symbol, index from stocks where id = $1', stockID)
        .then(function(data) {
            if (data["index"] === "NASDAQ") {
                url = 'http://www.nasdaq.com/symbol/' + data["symbol"];
                volume_id = '#' + data["symbol"] + '_Volume';
            }
            xray(url, volume_id)(function(err, volume) {
                var volume = volume.replace(/,/g, '');
                var volume = parseInt(volume);
                res.status(200)
                    .json({
                        status: 'success',
                        volume: volume,
                        message: 'Retrieved ' + data["name"] + ' volume'
                    })
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
    removeStock: removeStock,
    createUser: createUser,
    authenticateUser: authenticateUser,
    getStockVolume: getStockVolume
};
