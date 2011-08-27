var socket = io.connect(undefined, {'connect timeout': 25000});
socket.on('list', function (data) {
    var add = function(entry, parentElement) {
        var thisElement = document.createElement("li");
        if (entry.type == "directory") {
            thisElement.className = 'folder'
            thisElement.innerHTML = '<img src="img/folder.png">' + entry.name
            $(thisElement).click(function(e) {
                console.log(e.offsetY)
                if (e.srcElement == thisElement && e.offsetX < 24 && e.offsetY < 24) {
                    $(this).toggleClass('open');
                    e.stopPropagation()
                }
            })
            var ul = document.createElement("ul")
            thisElement.appendChild(ul)
            for (var childEntry in entry.children) {
                add(entry.children[childEntry], ul)
            }
        } else {
            thisElement.innerHTML = '<img src="img/file.png">' + entry.name
        }
        if (entry.name.charAt(0) == '.') {
            thisElement.className += ' hidden'
        }
        parentElement.appendChild(thisElement)
    }
    var ul = document.createElement("ul")
    for (var childEntry in data.children) {
        add(data.children[childEntry], ul)
    }
    document.getElementById('files').appendChild(ul);
});