(function() {
    var inferCodeMirrorModeFromPath = function(path){
        var mode = undefined;
        if (path.match(/\.js$/)) {
            mode = 'javascript';
        } else if (path.match(/\.coffee$/)) {
            mode = 'coffeescript';
        } else if (path.match(/\.json$/)) {
            mode = { name: 'javascript', json: true };
        } else if (path.match(/\.x?html?$/)) {
            mode = 'htmlmixed';
        } else if (path.match(/\.php$/)) {
            mode = 'php';
        } else if (path.match(/\.py$/)) {
            mode = 'python';
        } else if (path.match(/\.rb$/)) {
            mode = 'ruby';
        } else if (path.match(/\.lua$/)) {
            mode = 'lua';
        } else if (path.match(/\.(c|h|cpp|hpp|cc|m|cs|java)$/)) {
            mode = 'clike';
        } else if (path.match(/\.css$/)) {
            mode = 'css';
        } else if (path.match(/\.(xml|svg|od(t|p|s))$/)) {
            mode = 'xml';
        }
        return mode;
    }

    var createCodeMirror = function(parentNode, contents, path, options) {
        var mode = inferCodeMirrorModeFromPath(path);
        var options = {
            value: contents,
            mode: mode,
            lineNumbers: true,
            onChange: options.onChange,
            readOnly: options.readOnly,
            indentUnit: 4,
            enterMode: 'keep',
            tabMode: 'shift',
            electricChars: false,
            smartHome: true,
            matchBrackets: true
        }
        return CodeMirror(parentNode, options);
    }

    var createGalaxyBackground = function() {
        var galaxyBackground = document.createElement('div')
        galaxyBackground.innerHTML = 
            '<h1 class="now">Now</h1>' +
            '<h1 class="then">Then</h1>' +
            '<button class="done">Done</button>' +
            '<button class="revert">Revert</button>' +
            '<button class="backward" title="Go backward in time"><img src="img/backward.png"</button>' +
            '<button class="forward" title="Go forward in time"><img src="img/forward.png"</button>';
        return galaxyBackground;
    }

    var createActionsBar = function(path) {
        var actionsBar = document.createElement('div')
        actionsBar.className = 'actions'
        actionsBar.innerHTML = '<b>' + cwd + path + '</b> '
        
        actionsBar.renameButton = document.createElement('button')
        actionsBar.renameButton.innerHTML = 'Rename'
        actionsBar.appendChild(actionsBar.renameButton)
        
        actionsBar.versionsButton = document.createElement('button')
        actionsBar.versionsButton.innerHTML = 'Versions'
        actionsBar.appendChild(actionsBar.versionsButton)
        
        return actionsBar;
    }

    window.CodeEditor = function(entry) {
        var codeMirror;
        var galaxyBackground = createGalaxyBackground()
        var actionsBar = createActionsBar(entry.path)
        
        var time = 1000;
        var noPreviousMessage
        
        $(actionsBar.renameButton).click(function(e) {
            var newName = prompt('New filename:', entry.name)
            if (newName) {
                renameFile(entry.path, entry.path.replace(/\/[^\/]+$/, '/' + newName))
            }
        })
        
        $(actionsBar.versionsButton).click(function(e) {
            loadVersions(entry.path, function(err, versions) {
                var currentVersion = versions.length - 1;
                if (err) return;
                $(actionsBar).slideUp(time);
                $(galaxyBackground).animate({
                    left: '-250px'
                }, time)
                $(editor).animate({
                    left: '5%',
                    top: '50px',
                    bottom: '50px',
                    right: '52.5%'
                }, time).addClass('windowed')
                if (versions.length == 0) {
                    noPreviousMessage = document.createElement('div')
                    noPreviousMessage.innerHTML = 'There are no previous versions for this file.'
                    noPreviousMessage.className = 'no-previous'
                    galaxyBackground.appendChild(noPreviousMessage)
                    $(".revert, .backward, .forward", galaxyBackground).hide()
                } else {
                    $(".revert, .backward, .forward", galaxyBackground).show()
                }
                $(".then", galaxyBackground).html((new Date(versions[currentVersion].date)).toString())
                for (var i = 0; i < versions.length; i++) {
                    var version = versions[i]
                    var versionEditor = document.createElement('div')
                    versionEditor.className = 'code-editor'
                    versionEditor.style.zIndex = 98;
                    versionEditors.push(versionEditor)
                    galaxyBackground.appendChild(versionEditor)
                    $(versionEditor).animate({
                        right: '5%',
                        top: '50px',
                        bottom: '50px',
                        left: '52.5%'
                    }, time).addClass('windowed');
                    (function(versionEditor, i) {
                        loadVersion(version.uuid, function(err, contents) {
                            if (err) {
                                contents = '<ERROR: Could not load file contents>'
                            }
                            var codeMirror = createCodeMirror(versionEditor, contents, entry.path, { readOnly: true })
                            versions[i].content = contents;
                        })
                    })(versionEditor, i);
                    if (versions.length - 1 - i > 3) {
                        $(versionEditor).hide()
                    } else {
                        $(versionEditor).css({
                            scale: (1 - (versions.length - 1 - i) * 0.05),
                            translateY: -(versions.length - 1 - i)*20,
                            opacity: (1 - (versions.length - 1 - i) * (1/3))
                        })
                    }
                }
                var goVersion = function(delta) {
                    currentVersion += delta;
                    if (currentVersion >= versions.length) {
                        currentVersion = versions.length - 1;
                    }
                    if (currentVersion <= 0) {
                        currentVersion = 0;
                    }
                    $(".then", galaxyBackground).html((new Date(versions[currentVersion].date)).toString())
                    for (var i = 0; i < versions.length; i++) {
                        var version = versions[i]
                        var versionEditor = versionEditors[i]
                        var hidden = false;
                        if (currentVersion - i > 3) {
                            $(versionEditor).fadeOut()
                            hidden = true
                        } else if (currentVersion - i < 0) {
                            $(versionEditor).fadeOut()
                            hidden = true
                        } else {
                            $(versionEditor).fadeIn()
                        }
                        if (hidden) {
                            $(versionEditor).animate({
                                scale: (1 - (currentVersion - i) * 0.05),
                                translateY: -(currentVersion - i)*20,
                            }, { queue: false })
                        } else {
                            $(versionEditor).animate({
                                scale: (1 - (currentVersion - i) * 0.05),
                                translateY: -(currentVersion - i)*20,
                                opacity: (1 - (currentVersion - i) * (1/3))
                            }, { queue: false })
                        }
                    }
                }
                $(".backward", galaxyBackground).unbind('click').click(function(){
                    goVersion(-1)
                })
                $(".forward", galaxyBackground).unbind('click').click(function(){
                    goVersion(1)                
                })
                $(".revert", galaxyBackground).unbind('click').click(function(){
                    versionEditors[currentVersion].style.zIndex = 100
                    $(versionEditors[currentVersion]).animate({
                        left: '5%',
                        top: '50px',
                        bottom: '50px',
                        right: '52.5%'
                    }, time, function() {
                        codeMirror.setValue(versions[currentVersion].content)
                        $(versionEditors[currentVersion]).hide()
                        $(".done").click()
                    })
                })
            })
        })
    
        $(".done", galaxyBackground).click(function(e) {
            $(actionsBar).slideDown(time);
            $(galaxyBackground).animate({
                left: 0
            }, time)
            $(editor).animate({
                left: '0%',
                top: '0px',
                bottom: '0px',
                right: '0%'
            }, time, function() {
                $(editor).removeClass('windowed')
                for (var i = 0; i < versionEditors.length; i++) {
                    galaxyBackground.removeChild(versionEditors[i])
                }
                versionEditors = []
                if (noPreviousMessage) {
                    galaxyBackground.removeChild(noPreviousMessage)
                    noPreviousMessage = undefined
                }
            })
        })
    
        var editor = document.createElement('div')
        var versionEditors = []

        editor.appendChild(actionsBar)
        editor.className = 'code-editor'
        loadFile(entry.path, function(err, file) {
            codeMirror = createCodeMirror(editor, file, entry.path, { onChange: function(editor) {
                content = editor.getValue()
                changed = true
            }})
    
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
        galaxyBackground.appendChild(editor)
        galaxyBackground.className = 'galaxy-background'
        return galaxyBackground
    }
})()