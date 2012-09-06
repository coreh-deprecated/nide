var fs = require('fs')
var EventEmitter = require('events').EventEmitter
var dive = require('dive')
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
            exec('cp -- "' + (process.cwd() + file).replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + '" "' + (process.cwd() + '/.nide/' + generatedUuid).replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + '"', function(err) {
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

exports.shouldDisplayWelcome = false

exports.init = function() {
    try {
        fs.mkdirSync('.nide', '755')
    } catch (e) {
        console.error('Error: Cannot create new project. `.nide` already exists.')
        process.exit(-1)
    }
    console.log('Created `.nide` directory')
    var gitignore = ''
    try {
        gitignore = fs.readFileSync('.gitignore', 'utf8')
    } catch (e) {}
    var gitignoreLines = gitignore.split('\n')
    if (gitignoreLines.indexOf('.nide') == -1) {
        if (gitignoreLines[gitignoreLines.length-1] == '') {
            gitignoreLines[gitignoreLines.length-1] = '.nide'
        } else {
            gitignoreLines.push('.nide')
        }
        fs.writeFileSync('.gitignore', gitignoreLines.join('\n') + '\n', 'utf8')
    }
    console.log('Added `.nide` directory to .gitignore')
    var npmignore = ''
    try {
        npmignore = fs.readFileSync('.npmignore', 'utf8')
    } catch (e) {}
    var npmignoreLines = npmignore.split('\n')
    if (npmignoreLines.indexOf('.nide') == -1) {
        if (npmignoreLines[npmignoreLines.length-1] == '') {
            npmignoreLines[npmignoreLines.length-1] = '.nide'
        } else {
            npmignoreLines.push('.nide')
        }
        fs.writeFileSync('.npmignore', npmignoreLines.join('\n') + '\n', 'utf8')
    }
    console.log('Added `.nide` directory to .npmignore')
    try {
        packageJson = fs.readFileSync('package.json', 'utf8')
    } catch (e) {
        exports.shouldDisplayWelcome = true;
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

var listCache = undefined
var addToListCache = function(path) {
    var cwd = process.cwd()
    var cwd_length = cwd.length + 1;
    var current = listCache
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
exports.list = function(noCache) {
    var ee = new EventEmitter();
    if (noCache || !listCache) {
        listCache = {
            name: "",
            type: "directory",
            path: "",
            children: {}
        }
        dive(process.cwd(), { recursive: true, all: true, directories: true },
        function(err, path) {
            if (err) {
                console.warn(err);
                return
            }

            fs.stat(path, function(err, stats) {
                if (err) {
                    console.warn(err)
                    return
                }

                if (stats.isFile()) {
                    addToListCache(path)
                } else {
                    addToListCache(path + "/.")
                }
            })
        }, function() {
            ee.emit('success', listCache)
        })
    } else {
        process.nextTick(function() {
            ee.emit('success', listCache)
        })
    }
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
                        addToListCache(process.cwd() + path)
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
                fs.mkdir(process.cwd() + path, '755', function(err) {
                    if (err) ee.emit('error', err);
                    else {
                        addToListCache(process.cwd() + path + '/.')
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
                // Invalidate file list cache
                listCache = undefined
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
                // Invalidate file list cache
                listCache = undefined
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
        fs.stat(process.cwd() + path, function(err, stats) {
            if (err) ee.emit('error', 'File not found.');
            else if (stats.size > 1024*1024) ee.emit('error', 'File larger than the maximum supported size.');
            else {
                fs.readFile(process.cwd() + path, 'utf8', function(err, data) {
                    if (err) ee.emit('error', 'File could not be read.');
                    else {
                        ee.emit('success', data);
                    }
                })                
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
            listCache = undefined
            ee.emit('success')
        }
    })
    return ee;
}

exports.uninstall = function(package, save) {
    var ee = new EventEmitter()
    exec('npm uninstall' + (save ? ' --save' : '') + ' -- ' + package, function(err, stdout, stderr) {
        if (err) {
            ee.emit('error', stderr);
        } else {
            listCache = undefined
            ee.emit('success')
        }
    })
    return ee;
}
