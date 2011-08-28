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

var io = sockeio.listen(server, { 'log level': 0 })

io.configure(function () {
    io.set('transports', ['flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});


exports.listen = function(port) {
    
    server.listen(port);
    console.log("Server listening on port " + port + ".");
    
    io.sockets.on('connection', function(socket) {
        project.list()
        .on('success', function(data) {
            socket.emit('list', data)
        })
        socket.emit('cwd', process.cwd())
        socket.on('load', function(path) {
            project.load(path)
            .on('success', function(file) {
                socket.emit('file', { path: path, error: null, file: file })
            })
            .on('error', function(err) {
                socket.emit('file', { path: path, error: err, file: null })
            })
        })
        socket.on('save', function(data) {
            project.save(data.path, data.content)
            .on('success', function(file) {
                socket.emit('save-success', { path: data.path })
            })
            .on('error', function(err) {
                socket.emit('save-error', { path: data.path, error: err })
            })
        })
    })

}