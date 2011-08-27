var express = require('express');
var sockeio = require('socket.io')
var project = require('./project.js')

var server = express.createServer();

server.configure(function(){
  server.use(express.bodyParser());
  server.use(express.methodOverride());
  server.use(server.router);
  server.use(express.static(__dirname + '/public'));
});

var io = sockeio.listen(server)

io.configure(function () {
    io.set('transports', [
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
    ]);});


exports.listen = function(port) {
    
    server.listen(port);
    console.log("Server listening on port " + port + ".");
    
    io.sockets.on('connection', function(socket) {
        project.list()
        .on('success', function(data) {
            socket.emit('list', data)
        })
    })
}