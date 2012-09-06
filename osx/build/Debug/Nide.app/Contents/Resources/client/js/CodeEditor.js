(function() {
    
    var VERSIONS_ANIMATION_DURATION = 1000
    
    var inferCodeMirrorModeFromPath = function(path){
        switch (true) {
            case !!path.match(/\.js$/): return 'javascript'
            case !!path.match(/\.coffee$/): return 'coffeescript'
            case !!path.match(/\.json$/): return { name: 'javascript', json: true }
            case !!path.match(/\.x?html?$/): return 'htmlmixed'
            case !!path.match(/\.php$/): return 'php'
            case !!path.match(/\.py$/): return 'python'
            case !!path.match(/\.rb$/): return 'ruby'
            case !!path.match(/\.lua$/): return 'lua'
            case !!path.match(/\.(c|h|cpp|hpp|cc|m|cs|java)$/): return 'clike'
            case !!path.match(/\.css$/): return 'css'
            case !!path.match(/\.(xml|svg|od(t|p|s))$/): return 'xml'
            case !!path.match(/\.ejs$/): return 'application/x-ejs'
            case !!path.match(/\.jsp$/): return 'application/x-jsp'
            case !!path.match(/\.aspx$/): return 'application/x-aspx'
            case !!path.match(/\.m(arkdown|d)$/): return 'text/x-markdown'
            default: return 'text/plain';
        }
    }
    
    var makeViewPath = function(path) {
        return document.location.protocol + "//" + document.location.hostname + ':' + ((parseInt(document.location.port) || 80) + 1) + path
    }

    var createCodeMirror = function(parentNode, contents, path, options) {
        var mode = inferCodeMirrorModeFromPath(path);
        var options = {
            theme: $.cookie('editor-theme') || 'default',
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

    var createGalaxyBackground = function(name) {
        var galaxyBackground = document.createElement('div')
        galaxyBackground.innerHTML = 
            '<h1 class="now">Now (' + name + ')</h1>' +
            '<h1 class="then">Then</h1>' +
            '<button class="done">Done</button>' +
            '<button class="revert">Revert</button>' +
            '<button class="backward" title="Go backward in time"><img src="img/backward.png" alt="Backward"></button>' +
            '<button class="forward" title="Go forward in time"><img src="img/forward.png" alt="Forward"></button>' +
            '<div class="no-previous">There are no previous versions for this file.</div>';

        galaxyBackground.now = $(".now", galaxyBackground)[0];
        galaxyBackground.then = $(".then", galaxyBackground)[0];
        galaxyBackground.done = $(".done", galaxyBackground)[0];
        galaxyBackground.revert = $(".revert", galaxyBackground)[0];
        galaxyBackground.backward = $(".backward", galaxyBackground)[0];
        galaxyBackground.forward = $(".forward", galaxyBackground)[0];
        galaxyBackground.noPrevious = $(".no-previous", galaxyBackground)[0];
        
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
        
        if (path.match(/\.(x?html?|svg)$/)) {
            actionsBar.viewButton = document.createElement('button')
            actionsBar.viewButton.innerHTML = 'View'
            actionsBar.appendChild(actionsBar.viewButton)
        }
        
        return actionsBar;
    }

    window.CodeEditor = function(entry) {
        var codeMirror;
        var currentVersion;
        var galaxyBackground = createGalaxyBackground(entry.name)
        var actionsBar = createActionsBar(entry.path)
        var editor = document.createElement('div')
        var versionEditors = []
        var versions;
        
        $(actionsBar.renameButton).click(function(e) {
            var newName = prompt('New filename:', entry.name)
            if (newName) {
                connection.renameFile(entry.path, entry.path.replace(/\/[^\/]+$/, '/' + newName))
            }
        })
        
        if (actionsBar.viewButton) {
            $(actionsBar.viewButton).click(function(e) {
                var url = makeViewPath(entry.path);
                window.open(url, 'view-window');
            })
        }
        
        var loadVersionNumbered = function(i) {
            if (!versions[i].content) {
                connection.loadVersion(versions[i].uuid, function(err, contents) {
                    galaxyBackground.revert.disabled = false;
                    if (err) {
                        contents = '<ERROR: Could not load file contents>';
                        galaxyBackground.revert.disabled = true;
                    }
                    var codeMirror = createCodeMirror(versionEditors[i], contents, entry.path, { readOnly: true })
                    versions[i].content = contents;
                })
            }
        }
        
        function showVersions() {
            currentVersion = versions.length - 1;

            // "Morph" the user interface into versions mode
            $(actionsBar).slideUp(VERSIONS_ANIMATION_DURATION);
            
            $(galaxyBackground).animate({ 
                left: '-250px'
            }, VERSIONS_ANIMATION_DURATION)
            
            $(editor).animate({
                left: '5%',
                top: '50px',
                bottom: '50px',
                right: '52.5%'
            }, VERSIONS_ANIMATION_DURATION).addClass('windowed')

            // Change the user interface if no previous versions are available
            if (versions.length == 0) {
                $(galaxyBackground.noPrevious).show()
                $(".revert, .backward, .forward", galaxyBackground).hide()
                return;
            }
            
            $(galaxyBackground.noPrevious).hide()
            $(".revert, .backward, .forward", galaxyBackground).show()
            
            var currentVersionDate = (new Date(versions[currentVersion].date)).toString();
            galaxyBackground.then.title = currentVersionDate;
            $(galaxyBackground.then).easydate()

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
                }, VERSIONS_ANIMATION_DURATION).addClass('windowed');
                
                if (versions.length - 1 - i > 3) {
                    $(versionEditor).hide()
                } else {
                    $(versionEditor).css({
                        scale: (1 - (versions.length - 1 - i) * 0.05),
                        translateY: -(versions.length - 1 - i)*20,
                        opacity: (1 - (versions.length - 1 - i) * (1/3))
                    })
                    
                    loadVersionNumbered(i);
                }
            }
        }
        
        $(galaxyBackground.revert).click(function(){
            versionEditors[currentVersion].style.zIndex = 100
            $(versionEditors[currentVersion]).animate({
                left: '5%',
                top: '50px',
                bottom: '50px',
                right: '52.5%'
            }, VERSIONS_ANIMATION_DURATION, function() {
                codeMirror.setValue(versions[currentVersion].content)
                $(versionEditors[currentVersion]).hide()
                hideVersions()
            })
        })

        $(galaxyBackground.backward).click(function(){
            goToVersion(-1)
        })

        $(galaxyBackground.forward).click(function(){
            goToVersion(1)                
        })
        
        var goToVersion = function(delta) {
            if (versions === undefined || currentVersion === undefined || versionEditors.length === 0) {
                throw new Error("Trying to navigate in version history with no versions loaded.")
            }
            
            currentVersion += delta;
            if (currentVersion >= versions.length) {
                currentVersion = versions.length - 1;
            }
            if (currentVersion <= 0) {
                currentVersion = 0;
            }
            
            var currentVersionDate = (new Date(versions[currentVersion].date)).toString();
            galaxyBackground.then.title = currentVersionDate
            $(galaxyBackground.then).easydate()
            
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
                    loadVersionNumbered(i)
                    $(versionEditor).animate({
                        scale: (1 - (currentVersion - i) * 0.05),
                        translateY: -(currentVersion - i)*20,
                        opacity: (1 - (currentVersion - i) * (1/3))
                    }, { queue: false })
                }
            }
        }
        
        var hideVersions = function() {
            $(actionsBar).slideDown(VERSIONS_ANIMATION_DURATION);
            $(galaxyBackground).animate({
                left: 0
            }, VERSIONS_ANIMATION_DURATION)
            $(editor).animate({
                left: '0%',
                top: '0px',
                bottom: '0px',
                right: '0%'
            }, VERSIONS_ANIMATION_DURATION, function() {
                $(editor).removeClass('windowed')
                for (var i = 0; i < versionEditors.length; i++) {
                    galaxyBackground.removeChild(versionEditors[i])
                }
                versionEditors = []
                versions = undefined
                currentVersion = undefined
            })
        }
        
        $(actionsBar.versionsButton).click(function(e) {
            connection.loadVersions(entry.path, function(err, v) {
                if (err) {
                    alert('Could not load versions: ' + err)
                } else {
                    versions = v
                    showVersions()
                }
            })
        })
        
        $(galaxyBackground.done).click(function(e) {
            hideVersions();
        })
        
        editor.appendChild(actionsBar)
        editor.className = 'code-editor'
        
        if (entry.path.match(/\.(jpe?g|png|gif|bmp)$/)) {
            var image = document.createElement('img')
            image.src = makeViewPath(entry.path);
            image.className = 'view'
            editor.appendChild(image);
            $(actionsBar.versionsButton).hide();
        } else {
            connection.loadFile(entry.path, function(err, file) {
                if (err) {
                    var errorBar = document.createElement('div');
                    errorBar.className = 'error'
                    errorBar.innerHTML = '<b>Unable to open file:</b> ' + err;
                    editor.appendChild(errorBar);
                    $(errorBar).hide();
                    $(errorBar).fadeIn(250);
                } else {
                    codeMirror = createCodeMirror(editor, file, entry.path, { onChange: function(editor) {
                        content = editor.getValue()
                        changed = true
                    }})
                    codeMirror.focus()
            
                    var content = file
                    var changed = false;
                    var saving = false;
            
                    setInterval(function() {
                        if (changed && !saving) {
                            var done = false;
                            saving = true;
                            var selected = $('.selected')
                            selected.addClass('syncing')
                            connection.saveFile(entry.path, content, function(err){
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
                }
            })
        }
        
        galaxyBackground.appendChild(editor)
        galaxyBackground.className = 'galaxy-background'
        
        galaxyBackground.focus = function() {
            if (codeMirror) {
                codeMirror.focus()
            }
        }
        
        return galaxyBackground
    }
})()
