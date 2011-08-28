var fs = require('fs')
var EventEmitter = require('events').EventEmitter
var find = require('findit').find
var exec = require('child_process').exec
var uuid = require('node-uuid')

var fileStates = {}
var versionHistory = {}

var saveVersionHistory = function() {
    var contents = JSON.stringify(versionHistory)
    fs.writeFile(process.cwd() + '/.nide/versions.json', contents)
}

var loadVersionHistory = function() {
    try {
        versionHistory = JSON.parse(fs.readFileSync(process.cwd() + '/.nide/versions.json'))
    } catch (e) {
        
    }
}

setInterval(function() {
    for (var file in fileStates) {
        if (fileStates[file] == 'modified') {
            if (!versionHistory[file]) {
                versionHistory[file] = []
            }
            var generatedUuid = uuid()
            versionHistory[file].push({
                date: (new Date()).valueOf(),
                uuid: generatedUuid
            })
            exec('cp -- ' + (process.cwd() + file) + ' ' + (process.cwd() + '/.nide/' + generatedUuid), function(err) {
                if (!err) {
                    saveVersionHistory()
                }
            })
            delete fileStates[file]
        }
    }
}, 1000*5)

exports.start = function() {
    loadVersionHistory()
    try {
        var stat = fs.statSync('.nide')
        if (!stat.isDirectory()) {
            console.error('Error: `.nide` is not a directory.')
            process.exit(-1)
        }
    } catch (e) {
        console.error('Error: Not inside a project. Run `nide init` to create a new project on the current directory.')
        process.exit(-1)
    }
}

exports.init = function() {
    try {
        fs.mkdirSync('.nide', '755')
    } catch (e) {
        console.error('Error: Cannot create new project. `.nide` already exists.')
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
        if (components[i] != '.') {
            composite_path = composite_path + "/" + components[i]
            current.children[components[i]] = {
                name: components[i],
                type: "file",
                path: composite_path,
                children: {}
            }
        }
    }
    find(cwd)
    .on('file', function(path) {
        add(path)        
    })
    .on('directory', function(path) {
        add(path + "/.")        
    })
    .on('end', function() {
        ee.emit('success', result)
    })
    return ee
}

exports.add = function(path) {
    var ee = new EventEmitter()
    if (path.charAt(0) != '/' || path.indexOf('..') != -1) {
        process.nextTick(function() {
            ee.emit('error', 'Invalid Path')
        })
    } else {
        fs.stat(process.cwd() + path, function(err, result) {
            if (!err) {
                ee.emit('error', 'File already exists');
            } else {
                fs.writeFile(process.cwd() + path, '', 'utf8', function(err) {
                    if (err) ee.emit('error', err);
                    else {
                        ee.emit('success');
                    }
                })
            }
        })
    }
    return ee;
}

exports.addFolder = function(path) {
    var ee = new EventEmitter()
    if (path.charAt(0) != '/' || path.indexOf('..') != -1) {
        process.nextTick(function() {
            ee.emit('error', 'Invalid Path')
        })
    } else {
        fs.stat(process.cwd() + path, function(err, result) {
            if (!err) {
                ee.emit('error', 'Folder already exists');
            } else {
                console.log(process.cwd() + path)
                fs.mkdir(process.cwd() + path, '755', function(err) {
                    if (err) ee.emit('error', err);
                    else {
                        ee.emit('success');
                    }
                })
            }
        })
    }
    return ee;
}

exports.remove = function(path) {
    var ee = new EventEmitter()
    if (path.charAt(0) != '/' || path.indexOf('..') != -1 || path == '/') {
        process.nextTick(function() {
            ee.emit('error', 'Invalid Path')
        })
    } else {
        exec('rm -rf -- ' + process.cwd() + path, function(err) {
            if (!err) {
                ee.emit('success')
            } else {
                ee.emit('err', err)
            }
        })
    }
    return ee;
}


exports.rename = function(oldpath, newpath) {
    var ee = new EventEmitter()
    if (oldpath.charAt(0) != '/' || oldpath.indexOf('..') != -1 || oldpath == '/' ||
        newpath.charAt(0) != '/' || newpath.indexOf('..') != -1 || newpath == '/') {
        process.nextTick(function() {
            ee.emit('error', 'Invalid Path')
        })
    } else {
        fs.rename(process.cwd() + oldpath, process.cwd() + newpath, function(err) {
            if (!err) {
                ee.emit('success')
            } else {
                ee.emit('err', err)
            }
        })
    }
    return ee;
}

exports.save = function(path, contents) {
    var ee = new EventEmitter()
    if (path.charAt(0) != '/' || path.indexOf('..') != -1) {
        process.nextTick(function() {
            ee.emit('error', 'Invalid Path')
        })
    } else {
        fs.writeFile(process.cwd() + path, contents, 'utf8', function(err) {
            if (err) ee.emit('error', err);
            else {
                fileStates[path] = 'modified'
                ee.emit('success');
            }
        })
    }
    return ee;
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

exports.versions = function(path) {
    var ee = new EventEmitter()
    var versions = versionHistory[path]
    if (!versions) {
        versions = []
    }
    process.nextTick(function() {
        ee.emit('success', versions)
    })
    return ee;
}

exports.version = function(versionUuid) {
    var ee = new EventEmitter()
    if (!versionUuid.match(/^[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
        process.nextTick(function() {
            ee.emit('error', 'Invalid version uuid')
        })
    } else {
        fs.readFile(process.cwd() + '/.nide/' + versionUuid, 'utf8', function(err, data) {
            if (err) ee.emit('error', err);
            else {
                ee.emit('success', data);
            }
        })
    }
    return ee
}

exports.packages = function() {
    var ee = new EventEmitter()
    exec('npm ls', function(err, stdout, stderr) {
        if (err) {
            ee.emit('error', err);
            return;
        }
        var lines = stdout.split('\n')
        var packages = []
        for (var i = 0; i < lines.length; i++) {
            var packageName = lines[i].match(/^(├──|├─┬|└─┬|└──) (.+)$/)
            if (packageName && packageName[2]) {
                packages.push(packageName[2])
            }
        }
        ee.emit('success', packages)
    })
    return ee;
}

exports.install = function(package, save) {
    var ee = new EventEmitter()
    exec('npm install' + (save ? ' --save' : '')+ ' -- ' + package, function(err, stdout, stderr) {
        if (err) {
            ee.emit('error', stderr);
        } else {
            ee.emit('success')
        }
    })
    return ee;
}

exports.uninstall = function(package, save) {
    var ee = new EventEmitter()
    console.log(package)
    exec('npm uninstall' + (save ? ' --save' : '') + ' -- ' + package, function(err, stdout, stderr) {
        if (err) {
            ee.emit('error', stderr);
        } else {
            ee.emit('success')
        }
    })
    return ee;
}