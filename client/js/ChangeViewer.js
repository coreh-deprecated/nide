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
    actionsBar.innerHTML = '<button>Reset All Changes</button> <button class="right">Commit and <span style="line-height: 1em;">⬆</span> Push to Origin </button> <button class="right">Commit</button>'
    editor.appendChild(actionsBar)
    var messageForm = document.createElement('form')
    messageForm.innerHTML = '<input type="text" placeholder="Commit Summary" class="commit-summary"><textarea placeholder="Extended Description" class="extended-description"></textarea>'
    $(".extended-description", messageForm).hide()
    editor.appendChild(messageForm)
    var additionalOptions = document.createElement('div')
    additionalOptions.innerHTML = '<label><input type="checkbox" checked> Clean up auto-save versions on commit</label>'
    additionalOptions.className = 'actions right-aligned'
    editor.appendChild(additionalOptions)
    var changesDiv = document.createElement('div')
    changesDiv.className = 'changes'
    var changesDivActionsBar = document.createElement('div')
    changesDivActionsBar.className = 'actions'
    changesDivActionsBar.innerHTML = '<img src="img/clip.png" class="clip"><b>Files to be commited</b> <button>Check/Uncheck All</button>'
    changesDiv.appendChild(changesDivActionsBar);
    for (var i = 0; i < changes.length; i++) {
        var changeDiv = document.createElement('div')
        changeDiv.className = 'change'
        var labelText = changes[i].sourceFile;
        var disabled = ""
        if (changes[i].destinationFile) {
            labelText += ' → ' + changes[i].destinationFile;
            disabled = "disabled"
        }
        if (changes[i].index == 'D') {
            disabled = "disabled"
            labelText += ' <b>(deleted)</b>'
        }
        if (changes[i].index == '?') {
            labelText += ' <b>(new)</b>'
        }
        changeDiv.innerHTML = '<label><input type="checkbox" checked ' + disabled +'> ' + labelText + '</label>'
        changesDiv.appendChild(changeDiv)
    }
    editor.appendChild(changesDiv)
    
    $(".commit-summary", messageForm).focus(function(){
        $(".extended-description", messageForm).slideDown();
    })
    $(".commit-summary", messageForm).blur(function(){
        if (this.value == '') {
            $(".extended-description", messageForm).slideUp();
        }
    })
    return editor
}