var fs = require('fs')
var EventEmitter = require('events').EventEmitter
var find = require('findit').find

exports.init = function() {
    try {
        fs.mkdirSync('.nide', '755')
    } catch (e) {
        console.error('Cannot initialize new project. `.nide` already exists.')
        process.exit(-1)
    }
}

exports.chdir = function(dir) {
    if (dir) {
        try {
            process.chdir(dir)
        } catch (e) {
            console.error('Could not enter directory `' + dir + '`.')
            process.exit(-1)
        }
    }
}

exports.list = function() {
    var ee = new EventEmitter();
    var cwd = process.cwd()
    var cwd_length = cwd.length + 1;
    var result = {
        name: "",
        type: "directory",
        path: "",
        children: {}
    }
    var add = function(path) {
        var current = result
        var composite_path = ""
        var components = path.substr(cwd_length).split('/')
        for (var i = 0; i < components.length - 1; i++) {
            composite_path = composite_path + "/" + components[i]
            if (!current.children[components[i]]) {
                current.children[components[i]] = {
                    name: components[i],
                    type: "directory",
                    path: composite_path,
                    children: {}
                }
            }            
            current = current.children[components[i]]
        }
        composite_path = composite_path + "/" + components[i]
        current.children[components[i]] = {
            name: components[i],
            type: "file",
            path: composite_path,
            children: {}
        }
    }
    find(cwd)
    .on('file', function(path) {
        add(path)        
    })
    .on('end', function() {
        ee.emit('success', result)
    })
    return ee
}

exports.load = function(path) {
    var ee = new EventEmitter()
    if (path.charAt(0) != '/' || path.indexOf('..') != -1) {
        process.nextTick(function() {
            ee.emit('error', 'Invalid Path')
        })
    } else {
        fs.readFile(process.cwd() + path, 'utf8', function(err, data) {
            if (err) ee.emit('error', err);
            else {
                ee.emit('success', data);
            }
        })
    }
    return ee
}