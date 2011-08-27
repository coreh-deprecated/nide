var socket = io.connect(undefined, {'connect timeout': 25000});

var currentFile

var cwd = ''

var searchResultHtmlElementByPath
var fileHtmlElementByPath
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
        thisElement.innerHTML = '<img src="img/folder.png">' + entry.name + (ownContext ? (' <i>(' + entry.path + ')</i>') : '')
        $(thisElement).click(function(e) {
            if (!e.offsetX) e.offsetX = e.clientX - $(e.target).position().left;
            if (!e.offsetY) e.offsetY = e.clientY - $(e.target).position().top;
            if (e.target == thisElement && e.offsetY < 24) {
                if (e.offsetX < 24) {
                    $(this).toggleClass('open');
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
                type: 'project'
            }, null, $('#project')[0])
        }
    })
})

var loadFileCallbacks = {}
var loadFile = function(path, callback) {
    socket.emit('load', path)
    if (!loadFileCallbacks[path]) {
        loadFileCallbacks[path] = [callback]
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

var CodeEditor = function(entry) {
    var editor = document.createElement('div')
    var actionsBar = document.createElement('div')
    actionsBar.className = 'actions'
    actionsBar.innerHTML = '<b>' + cwd + entry.path + '</b> '
    var renameButton = document.createElement('button')
    renameButton.innerHTML = 'Rename'
    actionsBar.appendChild(renameButton)
    var deleteButton = document.createElement('button')
    deleteButton.innerHTML = 'Delete'
    actionsBar.appendChild(deleteButton)
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
                console.log("salvando")
                var done = false;
                saving = true;
                saveFile(entry.path, content, function(err){
                    if (!err) {
                        changed = false
                        done = true;
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
    renameButton.innerHTML = 'Rename Folder'
    actionsBar.appendChild(renameButton)
    var deleteButton = document.createElement('button')
    deleteButton.innerHTML = 'Delete Folder and Contents'
    actionsBar.appendChild(deleteButton)
    editor.appendChild(actionsBar)
    return editor
}

var setCurrentEditor = function(editor) {
    $('#content')[0].innerHTML = ''
    $('#content').append(editor)
}

var selectFile = function(entry, htmlElementByPathTable, htmlElement) {
    $('.selected').removeClass('selected')
    currentFile = entry.path
    $(htmlElement || htmlElementByPathTable[currentFile]).addClass('selected')
    
    var editor;
    switch(entry.type) {
        case "file":
            editor = new CodeEditor(entry)
        break;
        case "directory":
            editor = new DirectoryEditor(entry)
        break;
    }
    
    setCurrentEditor(editor)
}

