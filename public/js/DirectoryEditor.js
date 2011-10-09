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
            connection.renameFile(entry.path, entry.path.replace(/\/[^\/]+$/, '/' + newName))
        }
    })
    actionsBar.appendChild(renameButton)
    editor.appendChild(actionsBar)
    return editor
}
