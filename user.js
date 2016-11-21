var connection = require('./sql');
var request = require('request');
var util = require('util');
var FCM = require('fcm-node');
var SERVER_API_KEY = 'AIzaSyCBzbxcsX4AicGrMhsK5CLOe2yNz-j4Sac';
var fcmCli = new FCM(SERVER_API_KEY);

function User() {

    this.get = function (log, res) {
        connection.acquire(function(err, con) {
            console.log(log);
            con.query('select * from discountList where region=?',[log], function(err, result) {
                if(result.length != 0){
                    res.send(result);
                }
                else{
                    res.send({'status' : 'User does not exist'});
                }
            });
            con.release();
        });
    };

    this.notify = function (region, deviceId, res) {
        connection.acquire(function (err, con){
           console.log('region ' + region);
           console.log(deviceId);
           var deviceNotification;
           con.query('select * from discountList where region=? order by RAND() LIMIT 1',[region], function(err, result) {

               if(result.length != 0){
                   console.log('result length ' + result.length);
                   console.log('discount list ' + util.inspect(result[0]));

                   deviceNotification = 'Check out ' + result[0].pname +' are ' + result[0].discount + '% off';
                   console.log('device notification ' + deviceNotification);

                   con.query('select tokenid from users where deviceid=?', [deviceId], function (err, result2){
                      if(err){
                         console.log(err);
                      }else{
                          fcmCli = new FCM(SERVER_API_KEY);

                          var payloadOk = {
                              to : result2[0].tokenid,
                              priority : 'high',
                              notification: {
                                  title : 'Powered by beacons',
                                  body : deviceNotification
                              }
                          }

                          fcmCli.send(payloadOk, function (err, res2) {
                              if(err){
                                  console.error(err)
                              }else{
                                  console.log(res2);
                                  res.send({status : 0, message: 'Message sent to the user' });
                              }
                          });

                          //var gcm = require('node-gcm');
                          // var message = {
                          //     to : result2[0].tokenid,
                          //     collaspe_key : 'Notification from InClass03 App',
                          //     notification : {
                          //         title : 'Powered by Beacons',
                          //         body : deviceNotification
                          //     }
                          // };

                          //sendMessageToUser([result2[0].tokenid], deviceNotification);

                          // var serverkey = 'AIzaSyCBzbxcsX4AicGrMhsK5CLOe2yNz-j4Sac';
                          // var fcm = FCM(serverkey);
                          //
                          // console.log('message to fcm ' + util.inspect(message));
                          //
                          // fcm.send(message, function (err2, response) {
                          //     if(err2){
                          //         console.log('Something went wrong');
                          //     }else{
                          //         console.log('Success sent response ' + response);
                          //     }
                          // });
                      }
                   });
               }
               else{
                   res.send({'status' : 'The beacon is not registered with a category'});
               }
           });
           con.release();
        });
    };

    this.register = function (deviceid, tokenid, res) {
        connection.acquire(function (err, con){
          console.log('deviceid ' + deviceid);
          console.log(tokenid);
          var users = {
              'deviceid' : deviceid,
              'tokenid' : tokenid
          };
          con.query('insert into users set ?', users, function (err, result) {
              if(err){
                  console.log(err);
              }else{
                  console.log(result);
                  res.send({status: 0, message: 'token registered successfully'});
              }
          });
          con.release();
        });
    }


}
module.exports = new User();

function sendMessageToUser(deviceId, message) {
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type': ' application/json',
            'Authorization': 'key=AIzaSyCBzbxcsX4AicGrMhsK5CLOe2yNz-j4Sac'
        },
        body: JSON.stringify(
            {
                "priority":"high",
                "notification": {
                    "text": message
                },
                "to": JSON.stringify(deviceId)
            }
        )
    }, function (error, response, body) {
        if (error) {
            console.error(error, response, body);
        }
        else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
        }
        else {
            console.log('Done!')
        }
    });
};

