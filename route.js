var user = require('./user');

module.exports = {
    configure: function(app) {
        app.get('/info', function(req, res) {
            user.get(req.query.region, res);
            //res.send('hey');
        });

        app.get('/notify', function (req, res){
            console.log('region' + req.body.region);
            console.log('deviceid '+ req.body.deviceid);
            user.notify(req.query.region, req.query.deviceid, res);
        });

        app.post('/register', function (req, res){
            user.register(req.body.deviceid, req.body.tokenid, res);
        });
    }
};

