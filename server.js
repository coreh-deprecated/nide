var express = require('express');
var sockeio = require('socket.io')
var project = require('./project.js')
var child_process = require('child_process')

var server = express.createServer();

server.configure(function(){
    server.use(express.bodyParser());
    server.use(express.methodOverride());
    server.use(server.router);
    server.use(express.static(__dirname + '/public'));
});

var io = sockeio.listen(server, { 'log level': 1 })

io.configure(function () {
    io.set('transports', ['flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});


exports.listen = function(port) {
    
    server.listen(port, function() {
        // if run as root, downgrade to the owner of this file
        if (process.getuid() === 0)
            require('fs').stat(__filename, function(err, stats) {
            if (err) return console.log(err)
            process.setuid(stats.uid);
        });
    });
    
    console.log("Nide running at http://localhost:" + port);
    var nideUrl = "http://localhost:" + port;
    var browser;
    switch (process.platform) {
      case "win32": browser = "start"; break;
      case "darwin": browser = "open"; break;
      default: browser = "xdg-open"; break;
    }
    // if this fails, it'll just exit with a non-zero code.
    child_process.spawn(browser, [nideUrl]);
    
    io.sockets.on('connection', function(socket) {
        project.list()
        .on('success', function(data) {
            socket.emit('list', data)
        })
        project.packages()
        .on('success', function(packages) {
            socket.emit('packages', packages)
        })
        if (project.shouldDisplayWelcome) {
            socket.emit('welcome')
        }
        socket.emit('cwd', process.cwd())
        socket.emit('node-version', process.version)
        socket.on('skip-welcome', function() {
            project.shouldDisplayWelcome = false;
        })
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
        socket.on('add', function(path) {
            project.add(path)
            .on('success', function(file) {
                project.list()
                .on('success', function(data) {
                    socket.emit('list', data)
                })
            })
            .on('error', function(err) {
                socket.emit('add-error', { path: path, error: err })
            })
        })
        socket.on('add-folder', function(path) {
            project.addFolder(path)
            .on('success', function(file) {
                project.list()
                .on('success', function(data) {
                    socket.emit('list', data)
                })
            })
            .on('error', function(err) {
                socket.emit('add-folder-error', { path: path, error: err })
            })
        })
        socket.on('remove', function(path) {
            project.remove(path)
            .on('success', function(file) {
                project.list()
                .on('success', function(data) {
                    socket.emit('list', data)
                })
            })
            .on('error', function(err) {
                socket.emit('remove-error', { path: path, error: err })
            })
        })
        socket.on('rename', function(data) {
            project.rename(data.oldpath, data.newpath)
            .on('success', function(file) {
                project.list()
                .on('success', function(list) {
                    socket.emit('list', list)
                    socket.emit('rename-success', { path: data.newpath })
                })
            })
            .on('error', function(err) {
                socket.emit('rename-error', { path: data.oldpath, error: err })
            })
        })
        socket.on('versions', function(path) {
            project.versions(path)
            .on('success', function(versions) {
                socket.emit('versions', { path: path, versions: versions })
            })
        })
        socket.on('version', function(uuid) {
            project.version(uuid)
            .on('success', function(file) {
                socket.emit('version-success', { uuid: uuid, error: null, content: file })
            })
            .on('error', function(err) {
                socket.emit('version-error', { uuid: uuid, error: err, content: null })
            })
        })
        socket.on('install', function(data) {
            project.install(data.package, data.save)
            .on('success', function() {
                project.packages()
                .on('success', function(packages) {
                    socket.emit('packages', packages)
                })
                project.list()
                .on('success', function(list) {
                    socket.emit('list', list)
                })
            })
            .on('error', function(err) {
                socket.emit('install-error', err)
            })
        })
        socket.on('uninstall', function(data) {
            project.uninstall(data.package, data.save)
            .on('success', function() {
                project.packages()
                .on('success', function(packages) {
                    socket.emit('packages', packages)
                })
                project.list()
                .on('success', function(list) {
                    socket.emit('list', list)
                })
            })
            .on('error', function(err) {
                socket.emit('uninstall-error', err)
            })
        })
        socket.on('packages-refresh', function(data) {
            project.packages()
            .on('success', function(packages) {
                socket.emit('packages', packages)
            })
        })
    })

}
