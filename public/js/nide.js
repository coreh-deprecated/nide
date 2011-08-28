var socket = io.connect(undefined, {'connect timeout': 25000});

var currentFile

var cwd = ''
var nodeVersion = ''

var searchResultHtmlElementByPath
var fileHtmlElementByPath
var stateByPath = {}
var fileEntries = []

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

var CodeEditor = function(entry) {
    var editor = document.createElement('div')
    var actionsBar = document.createElement('div')
    actionsBar.className = 'actions'
    actionsBar.innerHTML = '<b>' + cwd + entry.path + '</b> '
    var renameButton = document.createElement('button')
    renameButton.innerHTML = 'Rename'
    $(renameButton).click(function(e) {
        var newName = prompt('New filename:', entry.name)
        if (newName) {
            renameFile(entry.path, entry.path.replace(/\/[^\/]+$/, '/' + newName))
        }
    })
    actionsBar.appendChild(renameButton)
    var versionsButton = document.createElement('button')
    versionsButton.innerHTML = 'Versions'
    $(versionsButton).click(function(e) {
        loadVersions(entry.path, function(err, versions) {
            console.log(versions)
        })
    })
    actionsBar.appendChild(versionsButton)
    editor.appendChild(actionsBar)
    editor.className = 'code-editor'
    loadFile(entry.path, function(err, file) {
        var codeMirror = CodeMirror(editor, {
            value: file,
            mode: "javascript",
            lineNumbers: true,
            onChange: function(editor) {
                content = editor.getValue()
                changed = true
            }
        });
        
        var content = file
        var changed = false;
        var saving = false;
        
        setInterval(function() {
            if (changed && !saving) {
                var done = false;
                saving = true;
                var selected = $('.selected')
                selected.addClass('syncing')
                saveFile(entry.path, content, function(err){
                    if (!err) {
                        changed = false
                        done = true;
                        selected.removeClass('syncing')
                    }
                    saving = false
                })
                setTimeout(function() {
                    if (!done) {
                        saving = false
                    }
                }, 8000)
            }
        }, 3000)
    })
    
    return editor
}

var DirectoryEditor = function(entry) {
    var editor = document.createElement('div')
    editor.className = 'directory-editor'
    var actionsBar = document.createElement('div')
    actionsBar.className = 'actions'
    actionsBar.innerHTML = '<b>' + cwd + entry.path + '</b> '
    var renameButton = document.createElement('button')
    renameButton.innerHTML = 'Rename'
    $(renameButton).click(function(e) {
        var newName = prompt('New folder name:', entry.name)
        if (newName) {
            renameFile(entry.path, entry.path.replace(/\/[^\/]+$/, '/' + newName))
        }
    })
    actionsBar.appendChild(renameButton)
    editor.appendChild(actionsBar)
    return editor
}

var documentationIframe
var DocumentationViewer = function(entry) {
    var editor = document.createElement('div')
    editor.className = 'documentation-viewer'
    if (!documentationIframe) {
        documentationIframe = document.createElement('iframe')
        documentationIframe.src = 'http://nodejs.org/docs/' + nodeVersion + '/api/index.html'
    }
    editor.appendChild(documentationIframe)
    return editor
}

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
    }
    
    setCurrentEditor(editor)
}

