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
            var newPath = entry.path.substr(0, entry.path.length - entry.name.length) + newName
            connection.renameFile(entry.path, newPath)
        }
    })
    actionsBar.appendChild(renameButton)
    editor.appendChild(actionsBar)
    return editor
}
