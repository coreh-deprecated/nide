var express = require('express');
var server = express.createServer();

server.configure(function(){
  server.use(express.bodyParser());
  server.use(express.methodOverride());
  server.use(server.router);
  server.use(express.static(__dirname + '/public'));
});

exports.listen = function(port) {
    server.listen(port);
    console.log("Server listening on port " + port + ".");
}