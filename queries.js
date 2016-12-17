var promise = require('bluebird');

var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connection = 'postgres://postgres:stkadmin@localhost:5432/project-stk';
var db = pgp(connection);

var Xray = require("x-ray");
var xray = new Xray();

var jwt = require('jsonwebtoken');

function getAllStocks(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
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
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function getSingleStock(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                db.one('select * from stocks where symbol = $1', req.params.symbol)
                    .then(function(data) {
                        res.status(200)
                            .json({
                                status: 'success',
                                data: data,
                                message: 'Retrieved single stock'
                            });
                    })
                    .catch(function(err) {
                        res.status(404)
                            .json({
                                status: 'error',
                                message: 'Stock not in database'
                            });
                    });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function createStock(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                db.one("SELECT symbol FROM stocks WHERE symbol = ${symbol}", req.body)
                    .then(function(data) {
                        res.status(422)
                            .json({
                                status: 'error',
                                message: 'Stock already in database'
                            });
                    })
                    .catch(function(err) {
                        var datesArray = []
                        var volumesArray = []
                        xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', "body@html")(function(err, data) {
                            html = data
                            xray(html, '.lm', [{
                                dates: ''
                            }])(function(err, data) {
                                for (i = 1; i < 31; i++) {
                                    var dates = data[i].dates;
                                    var dates = dates.replace("\n", '');
                                    datesArray.push(dates);
                                }
                            });
                            xray(html, '.rgt.rm', [{
                                volumes: ''
                            }])(function(err, data) {
                                for (i = 1; i < 31; i++) {
                                    var volumes = data[i].volumes;
                                    var volumes = volumes.replace("\n", '');
                                    var volumes = volumes.replace(/,/g, '');
                                    volumesArray.push(parseInt(volumes));
                                }
                            });
                            xray(html, '.g-section.hdg.top.appbar-hide>h3')(function(err, name) {
                                name = name.replace(' historical prices\n', '');
                                req.body.name = name;
                                req.body.dates = datesArray;
                                req.body.volumes = volumesArray;

                                db.one('insert into stocks(dates, name, index, symbol, volumes) values(${dates}::text[], ${name}, ${index}, ${symbol}, ${volumes}::integer[]) returning id', req.body)
                                    .then(function(data) {
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
                        });
                    });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function updateStock(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                var datesArray = []
                var volumesArray = []
                xray('https://www.google.com/finance/historical?q=NASDAQ%3A' + req.body.symbol + '&ei=DqXVV_HpForIeYf-tOgD&num=30', "body@html")(function(err, data) {
                    html = data
                    xray(html, '.lm', [{
                        dates: ''
                    }])(function(err, data) {
                        for (i = 1; i < 31; i++) {
                            var dates = data[i].dates;
                            var dates = dates.replace("\n", '');
                            datesArray.push(dates);
                        }
                    });
                    xray(html, '.rgt.rm', [{
                        volumes: ''
                    }])(function(err, data) {
                        for (i = 1; i < 31; i++) {
                            var volumes = data[i].volumes;
                            var volumes = volumes.replace("\n", '');
                            var volumes = volumes.replace(/,/g, '');
                            volumesArray.push(parseInt(volumes));
                        }
                    });
                    xray(html, '.g-section.hdg.top.appbar-hide>h3')(function(err, name) {
                        name = name.replace(' historical prices\n', '');
                        req.body.name = name;
                        req.body.dates = datesArray;
                        req.body.volumes = volumesArray;
                        db.none('update stocks set dates=$1::text[], name=$2, index=$3, symbol=$4, volumes=$5::integer[] where symbol=$6', [req.body.dates, req.body.name, req.body.index,
                                req.body.symbol, req.body.volumes, req.params.symbol
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
                });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function removeFromPortfolio(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                db.one("SELECT id FROM users WHERE access_token = $1", token)
                    .then(function(data) {
                        var userID = data["id"];
                        db.one('select id from stocks where symbol = $1', req.params.symbol)
                            .then(function(data) {
                                var stockID = data["id"];
                                db.none('delete from users_stocks where user_id = $1 AND stock_id = $2', [userID, stockID])
                                    .then(function(result) {
                                        res.status(200)
                                            .json({
                                                status: 'success',
                                                message: `Removed stock`
                                            });
                                    });
                            })
                            .catch(function(err) {
                                return next(err);
                            });
                    });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function createUser(req, res, next) {
    db.one("SELECT username FROM users WHERE username = ${username}", req.body)
        .then(function(data) {
            res.status(422)
                .json({
                    status: 'error',
                    message: 'Username in use'
                });
        })
        .catch(function(err) {
            db.one("SELECT email FROM users WHERE email = ${email}", req.body)
                .then(function(data) {
                    res.status(422)
                        .json({
                            status: 'error',
                            message: 'Email in use'
                        });
                })
                .catch(function(err) {
                    req.body.access_token = jwt.sign(req.body.username, 'testsecret');
                    db.none('insert into users(username, password, email, access_token)' + "values(${username}, crypt(${password}, gen_salt('md5')), ${email}, ${access_token})", req.body)
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

                });
        });
}

function authenticateUser(req, res, next) {
    db.one("SELECT username, email, access_token FROM users WHERE LOWER(username) = LOWER(${username}) AND password = crypt(${password}, password)", req.body)
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

function getStockRealtime(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                if (req.params.index.toUpperCase() === "NASDAQ") {
                    url = 'http://www.nasdaq.com/symbol/' + req.params.symbol;
                }
                xray(url, '#quotes_content_left_InfoQuotesResults > tr > td > .genTable.thin > table > tbody', {
                    open: 'tr:nth-child(17) > td:nth-child(2)',
                    prevClose: 'tr:nth-child(6) > td:nth-child(2)',
                    volume: 'tr:nth-child(4) > td:nth-child(2)',
                    avgVolume50Day: 'tr:nth-child(5) > td:nth-child(2)',
                    marketCap: 'tr:nth-child(8) > td:nth-child(2)',
                    peRatio: 'tr:nth-child(9) > td:nth-child(2)',
                    eps: 'tr:nth-child(11) > td:nth-child(2)',
                    currentYield: 'tr:nth-child(15) > td:nth-child(2)',
                })(function(err, obj) {
                    obj.open = obj.open.replace(/\s+/g, '').replace('$', '');
                    obj.prevClose = obj.prevClose.replace(/\s+/g, '').replace('$', '');
                    obj.volume = obj.volume.replace(/,/g, '').replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, '');
                    obj.avgVolume50Day = obj.avgVolume50Day.replace(/,/g, '');
                    obj.marketCap = obj.marketCap.replace(/,/g, '').replace(/\s+/g, '').replace('$', '');
                    obj.eps = obj.eps.replace(/\s+/g, '').replace('$', '');
                    obj.currentYield = obj.currentYield.replace(/\s+/g, '').replace('%','');
                    res.status(200)
                        .json({
                            status: 'success',
                            data: [obj],
                            message: 'Retrieved ' + req.params.symbol.toUpperCase() + ' realtime data'
                        });
                });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function getStockRealtimeVolume(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                db.one('select name, index from stocks where symbol = $1', req.params.symbol)
                    .then(function(data) {
                        if (data["index"] === "NASDAQ") {
                            url = 'http://www.nasdaq.com/symbol/' + req.params.symbol;
                            volume_id = '#' + req.params.symbol + '_Volume';
                        }
                        xray(url, volume_id)(function(err, volume) {
                            var volume = volume.replace(/,/g, '');
                            var volume = parseInt(volume);
                            res.status(200)
                                .json({
                                    status: 'success',
                                    volume: volume,
                                    message: 'Retrieved ' + data["name"] + ' realtime volume'
                                });
                        });
                    })
                    .catch(function(err) {
                        return next(err);
                    });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function getUserPortfolio(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                db.one("SELECT id FROM users WHERE access_token = $1", token)
                    .then(function(data) {
                        id = data["id"];
                        db.any('SELECT s.* FROM stocks s, users_stocks us WHERE s.id = us.stock_id AND us.user_id = $1', id)
                            .then(function(data) {
                                res.status(200)
                                    .json({
                                        status: 'success',
                                        data: data,
                                        message: 'Retrieved all users stocks'
                                    });
                            })
                            .catch(function(err) {
                                return next(err);
                            });

                    })
                    .catch(function(err) {
                        return next(err);
                    });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

function addToPortfolio(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'testsecret', function(err, decoded) {
            if (err) {
                res.status(401)
                    .json({
                        status: 'error',
                        message: 'Unauthorized'
                    });
            } else {
                db.one("SELECT id FROM users WHERE access_token = $1", token)
                    .then(function(data) {
                        var userID = data["id"];
                        db.one('select id from stocks where symbol = $1', req.params.symbol)
                            .then(function(data) {
                                var stockID = data["id"];
                                db.one("SELECT user_id, stock_id FROM users_stocks WHERE user_id = $1 AND stock_id = $2", [userID, stockID])
                                    .then(function(data) {
                                        res.status(422)
                                            .json({
                                                status: 'error',
                                                message: 'Stock already in portfolio'
                                            });
                                    })
                                    .catch(function(err) {
                                        db.none('insert into users_stocks(user_id, stock_id) values($1, $2)', [userID, stockID])
                                            .then(function() {
                                                res.status(200)
                                                    .json({
                                                        status: 'success',
                                                        message: 'Added stock to porfolio'
                                                    });
                                            })
                                            .catch(function(err) {
                                                return next(err);
                                            });
                                    });
                            })
                            .catch(function(err) {
                                return next(err);
                            });
                    });
            }
        });
    } else {
        res.status(403)
            .json({
                status: 'error',
                message: 'No token provided'
            });
    }
}

module.exports = {
    getAllStocks: getAllStocks,
    getSingleStock: getSingleStock,
    createStock: createStock,
    updateStock: updateStock,
    getStockRealtime: getStockRealtime,
    getStockRealtimeVolume: getStockRealtimeVolume,
    createUser: createUser,
    authenticateUser: authenticateUser,
    getUserPortfolio: getUserPortfolio,
    removeFromPortfolio: removeFromPortfolio,
    addToPortfolio: addToPortfolio
};
