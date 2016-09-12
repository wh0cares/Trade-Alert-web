////////////////////////
//    For Testing     //
////////////////////////

var Xray = require("x-ray");
var xray = new Xray();

xray('https://www.google.com/finance/historical?q=NASDAQ%3AGOOGL&ei=DqXVV_HpForIeYf-tOgD&num=30', 'title')(function(err, name) {
    name = name.split(':');
    console.log(name[0])
})

xray('https://www.google.com/finance/historical?q=NASDAQ%3AGOOGL&ei=DqXVV_HpForIeYf-tOgD&num=30', '.lm', [{
    date: ''
}]).write('dates.json')

xray('https://www.google.com/finance/historical?q=NASDAQ%3AGOOGL&ei=DqXVV_HpForIeYf-tOgD&num=30', '.rgt.rm', [{
    volume: ''
}]).write('volumes.json')