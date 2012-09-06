var packages = []
var updatePackages = function() {}

var NPMEditor = function(entry) {
    var editor = document.createElement('div')
    var sidebarEntry = $('.selected')
    editor.className = 'npm-editor'
    editor.innerHTML = 
        '<div class="actions"><b>Node Package Manager - Installed Packages</b> <button class="refresh">Refresh</button></div>' +
        '<div class="actions"><select multiple class="packages"></select></div>' +
        '<div class="actions">' +
        '<button class="gradient add"><img src="img/add.png"></button>' + 
        '<button class="gradient remove"><img src="img/remove.png"></button> ' +
        '<label><input type="checkbox" checked class="save"> Register packages on <code>package.json</code> on install.</label>'
        '</div>'
    updatePackages = function() {
        $(".packages", editor)[0].innerHTML = '';
        for (var i = 0; i < packages.length; i++) {
            var pack = document.createElement("option")
            pack.className = 'package'
            if (packages[i].match(/  extraneous$/)) {
                pack.className += ' extraneous';
            }
            if (packages[i].match(/^UNMET DEPENDENCY /)) {
                pack.className += ' unmet';
            }
            pack.innerHTML = packages[i]
            pack.value = packages[i]
            $(".packages", editor).append(pack)
        }
        sidebarEntry.removeClass('syncing')
    }
    updatePackages()
    $(".add", editor).click(function(){
        var package = prompt('Package to be installed:', 'package-name')
        var save = $(".save", editor)[0].checked
        if (package) {
            connection.installPackage(package, save);
            sidebarEntry.addClass('syncing')
        }
    })
    $(".remove", editor).click(function(){
        if (confirm('Are you sure?')) {
            var packageSelect = $(".packages", editor)[0]
            var selected = [];
            for (var i = 0; i < packageSelect.options.length; i++) {
                if (packageSelect.options[i].selected) {
                    selected.push(packageSelect.options[i].value.replace(/  extraneous$/,'').replace(/\@.+$/,''));
                }
            }
            if (selected.length > 0) {
                var save = $(".save", editor)[0].checked
                connection.uninstallPackage(selected, save);
                sidebarEntry.addClass('syncing')
            }
        }
    })
    $(".refresh", editor).click(function(){
        connection.refreshPackages()
        sidebarEntry.addClass('syncing')
    })
    return editor
}