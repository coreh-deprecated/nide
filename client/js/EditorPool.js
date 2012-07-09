(function() {
    var MAX_EDITORS = 8
    
    var EditorPool = window.EditorPool = function() {
        this.editors = []
    }
    
    EditorPool.prototype.editorForEntry = function(entry, withDiscarted) {
        var editor;

		for (var i=0; i < this.editors.length; i++) {
            if (this.editors[i].path == entry.path &&
                this.editors[i].type == entry.type) {
                // Move editor to the first position in array
                editor = this.editors.splice(i, 1)[0]
                this.editors.splice(0, 0, editor);
                return editor.element
            }
        }
        
        switch(entry.type) {
            case "file":
                editor = new CodeEditor(entry)
            break;
            case "directory":
                editor = new DirectoryEditor(entry)
            break;
            case "documentation":
                editor = new DocumentationViewer(entry)
            break;
            case "npm":
                editor = new NPMEditor(entry)
            break;
			case "package.json":
				editor = new PackageJSONEditor(entry)
			break;
        }

		editor.type = entry.type;
		editor.path = entry.path;

        this.editors.splice(0, 0, editor)
        
        if (this.editors.length > MAX_EDITORS) {
            var discarted = this.editors.pop()
            if (withDiscarted) {
                withDiscarted(discarted)
            }
        }
        
        return editor.element
    };

	EditorPool.prototype.setOptionOnCodeEditors = function(name,value)
	{
		for (var i=0; i < this.editors.length; i++)
		{
			if (this.editors[i].type == "file")
			{
				this.editors[i].setOptionOnCodeEditor(name,value);
			}
		}
	}
})()