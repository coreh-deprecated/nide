var socket = io.connect(undefined, {'connect timeout': 25000});

var currentFile

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
            $('#files').slideUp();
            $('#search-results').slideDown();
        } else {
            $('#files').slideDown();
            $('#search-results').slideUp();
        }
    }
    $('#search-field').keyup(doSearch).click(doSearch)
})

var selectFile = function(entry, htmlElementByPathTable) {
    $('.selected').removeClass('selected')
    currentFile = entry.path
    $(htmlElementByPathTable[currentFile]).addClass('selected')    
    var codeMirror = CodeMirror($('#content')[0], {
      value: "function myScript(){return 100;}\n",
      mode:  "javascript",
      lineNumbers: true,
    });
    console.log(codeMirror)
}