var changes = []
var updateChanges = function() {
    if (changes.length > 0) {
        $('#changes').fadeIn()
        $('#changes')[0].innerHTML = changes.length + '<span class="description">uncommited changes</span>';
    } else {
        $('#changes').fadeOut()
    }
}

var ChangeViewer = function(entry) {
    var editor = document.createElement('div')
    editor.className = 'change-viewer'
    var actionsBar = document.createElement('div')
    actionsBar.className = 'actions'
    actionsBar.innerHTML = '<button>Commit</button> <button class="right">Reset Changes</button>'
    editor.appendChild(actionsBar)
    var messageForm = document.createElement('form')
    messageForm.innerHTML = '<input type="text" placeholder="Commit Summary"><textarea placeholder="Extended Description"></textarea>'
    editor.appendChild(messageForm)
    var changesDiv = document.createElement('div')
    for (var i = 0; i < changes.length; i++) {
        var changeDiv = document.createElement('div')
        changeDiv.className = 'change'
        changeDiv.innerHTML = '<label><input type="checkbox"> ' + changes[i].sourceFile + '</label>'
        changesDiv.appendChild(changeDiv)
    }
    editor.appendChild(changesDiv)
    return editor
}