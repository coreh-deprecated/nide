var socket = io.connect(window.location.origin, {'connect timeout': 25000});

var currentFile

var cwd = ''
var nodeVersion = 'v0.4.11'

var searchResultHtmlElementByPath
var fileHtmlElementByPath
var stateByPath = {}
var fileEntries = []
var packages = []
var updatePackages = function() {}

var ignore = ['.git', '.nide', '.DS_Store']
var limitRecursion = ['node_modules']

var addHTMLElementForFileEntry = function(entry, parentElement, fileEntriesArray, htmlElementByPathTable, ownContext, doLimitRecursion) {
    
    if (ignore.indexOf(entry.name) != -1) {
        return;
    }
    
    var thisElement = document.createElement("li");
    htmlElementByPathTable[entry.path] = thisElement
    
    if (fileEntriesArray && !doLimitRecursion) {
        fileEntriesArray.push(entry)
    }
    
    if (entry.type == "directory") {
        thisElement.className = 'folder'
        if (stateByPath[entry.path] == 'open') {
            thisElement.className += ' open'
        }
        thisElement.innerHTML = '<img src="img/folder.png">' + entry.name + (ownContext ? (' <i>(' + entry.path + ')</i>') : '')
        $(thisElement).click(function(e) {
            if (!e.offsetX) e.offsetX = e.clientX - $(e.target).position().left;
            if (!e.offsetY) e.offsetY = e.clientY - $(e.target).position().top;
            if (e.target == thisElement && e.offsetY < 24) {
                if (e.offsetX < 24) {
                    $(this).toggleClass('open');
                    stateByPath[entry.path] = $(this).hasClass('open') ? 'open' : '';
                    e.stopPropagation()
                } else {
                    selectFile(entry, htmlElementByPathTable)
                    e.stopPropagation()
                }
            }
        })
        var ul = document.createElement("ul")
        thisElement.appendChild(ul)
        for (var childEntry in entry.children) {
            addHTMLElementForFileEntry(entry.children[childEntry], ul, fileEntriesArray, ownContext ? {} : htmlElementByPathTable, false, doLimitRecursion || limitRecursion.indexOf(entry.name) != -1)
        }
    } else {
        thisElement.innerHTML = '<img src="img/file.png">' + entry.name + (ownContext ? (' <i>(' + entry.path + ')</i>') : '')
        $(thisElement).click(function(e) {
            selectFile(entry, htmlElementByPathTable)
        })
    }
    if (entry.name.charAt(0) == '.') {
        thisElement.className += ' hidden'
    }
    parentElement.appendChild(thisElement)
}

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

$(function(){
    $('#show-hidden').click(function() {
        $('#sidebar').toggleClass('show-hidden')
    })
    
    var doSearch = function() {
        if (this.value != '') {
            for (var i = 0; i < fileEntries.length; i++) {
                if (fileEntries[i].name.match(this.value)) {
                    $(searchResultHtmlElementByPath[fileEntries[i].path]).slideDown()
                } else {
                    $(searchResultHtmlElementByPath[fileEntries[i].path]).slideUp()
                }
            }
            $('#project').slideUp();
            $('#search').slideDown();
        } else {
            $('#project').slideDown();
            $('#search').slideUp();
        }
    }
    $('#search-field').keyup(doSearch).click(doSearch)
    
    $('#project').click(function(e) {
        if (e.target == $('#project')[0]) {
            selectFile({
                type: 'project',
                path: '/'
            }, null, $('#project')[0])
        }
    })

    $('#npm').click(function(e) {
        if (e.target == $('#npm')[0]) {
            selectFile({
                type: 'npm',
                path: '/'
            }, null, $('#npm')[0])
        }
    })
    
    $('#docs').click(function(e) {
        if (e.target == $('#docs')[0]) {
            selectFile({
                type: 'documentation',
                path: '/'
            }, null, $('#docs')[0])
        }
    })

    $('#add-file').click(function(e) {
        var filename = prompt('Type in a filename for the new file:', 'untitled.js')
        if (filename) {
            addFile(filename)
        }
    })
    
    $('#add-folder').click(function(e) {
        var filename = prompt('Type in a filename for the new folder', 'folder')
        if (filename) {
            addFolder(filename)
        }
    })
    
    $('#remove-file').click(function(e) {
        if (currentFile) {
            var confirmed
            if (currentFile.type == 'file') {
                confirmed = confirm('Are you sure?')
            } else if (currentFile.type == 'directory') {
                confirmed = confirm('This will remove the directory and all its contents. Are you sure?')
            } else {
                confirmed = false
            }
            if (confirmed) {
                removeFile()
            }
        }
    })
})

var renameFile = function(oldpath, newpath) {
    socket.emit('rename', { oldpath: oldpath, newpath: newpath })
}

socket.on('rename-success', function(data) {
    selectFile({
        type: 'file',
        path: data.path
    }, fileHtmlElementByPath);
})

var removeFile = function() {
    socket.emit('remove', currentFile.path)
}

var addFolder = function(filename) {
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

var addFile = function(filename) {
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
var loadFile = function(path, callback) {
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
var saveFile = function(path, content, callback) {
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
var loadVersions = function(path, callback) {
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
var loadVersion = function(uuid, callback) {
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

var setCurrentEditor = function(editor) {
    $('#content')[0].innerHTML = ''
    $('#content').append(editor)
}

var selectFile = function(entry, htmlElementByPathTable, htmlElement) {
    $('.selected').removeClass('selected')
    currentFile = entry
    $(htmlElement || htmlElementByPathTable[currentFile.path]).addClass('selected')
    
    var editor;
    switch(entry.type) {
        case "file":
            editor = new CodeEditor(entry)
        break;
        case "directory":
            editor = new DirectoryEditor(entry)
        break;
        case "documentation":
            editor = new DocumentationViewer(entry)
        break;
        case "npm":
            editor = new NPMEditor(entry)
        break;
    }
        
    setCurrentEditor(editor)
}

