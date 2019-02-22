'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
  // add a hosted html for login
  router.get('/loginpage*', function (req, res) {
    console.log(__dirname);
    res.sendFile(__dirname + '/loginpage.html');
  });

};
