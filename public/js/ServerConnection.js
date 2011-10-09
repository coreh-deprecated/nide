var ServerConnection = function() {
    var socket = io.connect(window.location.origin, {'connect timeout': 25000});
    
    socket.on('cwd', function(path) {
        cwd = path
    })

    socket.on('node-version', function(version) {
        nodeVersion = version
    })

    socket.on('packages', function(reportedPackages) {
        packages = reportedPackages
        updatePackages()
    })

    socket.on('welcome', function() {
        $('#lightbox').fadeIn()
        $('.setup form').bind('submit', function(e) {
            var name = $(".setup input[name='name']")[0].value;
            var description = $(".setup input[name='description']")[0].value;
            var author = $(".setup input[name='author']")[0].value;
            var version = $(".setup input[name='version']")[0].value;
            if (!version.match(/^[0-9]+\.[0-9]+\.[0-9]+$/)) {
                alert('Please enter the version number in the X.Y.Z format.')
                e.preventDefault();
                return;
            }
            e.preventDefault()
            socket.emit('add', '/package.json')
            socket.emit('save', { path: '/package.json', content: JSON.stringify({
                name: name,
                description: description,
                version: version,
                author: author,
                dependencies: {},
                devDependencies: {}
            }, undefined, '    ')})
            $('#lightbox').fadeOut()
            socket.emit('skip-welcome')
        })
        $('.setup .skip').click(function(){
            $('#lightbox').fadeOut()
            socket.emit('skip-welcome')
        })
    })

    socket.on('list', function (data) {
        searchResultHtmlElementByPath = {}
        fileHtmlElementByPath = {}
        fileEntries = []
        var ul = document.createElement("ul")
        for (var childEntry in data.children) {
            addHTMLElementForFileEntry(data.children[childEntry], ul, fileEntries, fileHtmlElementByPath)
        }
        document.getElementById('files').innerHTML = '';
        document.getElementById('files').appendChild(ul);
        ul = document.createElement("ul")
        for (var i = 0; i < fileEntries.length; i++) {
            addHTMLElementForFileEntry(fileEntries[i], ul, null, searchResultHtmlElementByPath, true)
        }
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-results').appendChild(ul);
    });

    this.renameFile = function(oldpath, newpath) {
        socket.emit('rename', { oldpath: oldpath, newpath: newpath })
    }

    socket.on('rename-success', function(data) {
        selectFile({
            type: 'file',
            path: data.path
        }, fileHtmlElementByPath);
    })

    this.removeFile = function() {
        socket.emit('remove', currentFile.path)
    }

    this.addFolder = function(filename) {
        var path;
        if (!currentFile) {
            path = '/'
        } else {
            switch(currentFile.type) {
                case 'directory':
                    path = currentFile.path + '/'
                    break;
                case 'file':
                    path = currentFile.path.replace(/\/[^\/]+$/, '/')
                    break;
                default:
                    path = '/'
                    break;
            }
        }
        socket.emit('add-folder', path + filename);
    }

    this.addFile = function(filename) {
        var path;
        if (!currentFile) {
            path = '/'
        } else {
            switch(currentFile.type) {
                case 'directory':
                    path = currentFile.path + '/'
                    break;
                case 'file':
                    path = currentFile.path.replace(/\/[^\/]+$/, '/')
                    break;
                default:
                    path = '/'
                    break;
            }
        }
        socket.emit('add', path + filename);
    }

    var loadFileCallbacks = {}
    this.loadFile = function(path, callback) {
        socket.emit('load', path)
        if (!loadFileCallbacks[path]) {
            loadFileCallbacks[path] = [callback]
        } else {
            loadFileCallbacks[path].push(callback)
        }
    }

    socket.on('file', function(data) { 
        var callbacks = loadFileCallbacks[data.path] || []
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](data.error, data.file)
        }
        delete loadFileCallbacks[data.path]
    })

    var saveFileCallbacks = {}
    this.saveFile = function(path, content, callback) {
        socket.emit('save', {path: path, content: content})
        if (!saveFileCallbacks[path]) {
            saveFileCallbacks[path] = [callback]
        } else {
            saveFileCallbacks[path].push(callback)
        }
    }

    socket.on('save-success', function(data) { 
        var callbacks = saveFileCallbacks[data.path] || []
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](null)
        }
        delete saveFileCallbacks[data.path]
    })

    socket.on('save-error', function(data) { 
        var callbacks = saveFileCallbacks[data.path] || []
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](data.error)
        }
        delete saveFileCallbacks[data.path]
    })

    var versionsCallbacks = {}
    this.loadVersions = function(path, callback) {
        socket.emit('versions', path)
        if (!versionsCallbacks[path]) {
            versionsCallbacks[path] = [callback]
        } else {
            versionsCallbacks[path].push(callback)
        }
    }

    socket.on('versions', function(data) { 
        var callbacks = versionsCallbacks[data.path] || []
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](data.error, data.versions)
        }
        delete versionsCallbacks[data.path]
    })

    var versionCallbacks = {}
    this.loadVersion = function(uuid, callback) {
        socket.emit('version', uuid)
        if (!versionCallbacks[uuid]) {
            versionCallbacks[uuid] = [callback]
        } else {
            versionCallbacks[uuid].push(callback)
        }
    }

    socket.on('version-success', function(data) { 
        var callbacks = versionCallbacks[data.uuid] || []
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](null, data.content)
        }
        delete versionCallbacks[data.uuid]
    })

    socket.on('version-error', function(data) { 
        var callbacks = versionCallbacks[data.uuid] || []
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](data.error)
        }
        delete versionCallbacks[data.uuid]
    })

    socket.on('install-error', function(message) {
        alert('Could not install package:\n\n' + message)
    })

    socket.on('uninstall-error', function(message) {
        alert('Could not uninstall package:\n\n' + message)
    })
    
    this.installPackage = function(package, shouldSaveOnPackageJson) {
        socket.emit('install', { package: package, save: shouldSaveOnPackageJson })
    }
    
    this.uninstallPackage = function(packages, shouldSaveOnPackageJson) {
        socket.emit('uninstall', { package: packages.join(' '), save: shouldSaveOnPackageJson })
    }
    
    this.refreshPackages = function() {
        socket.emit('packages-refresh');
    }
}