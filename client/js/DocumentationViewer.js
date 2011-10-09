var documentationIframe
var DocumentationViewer = function(entry) {
    var editor = document.createElement('div')
    editor.className = 'documentation-viewer'
    if (!documentationIframe) {
        documentationIframe = document.createElement('iframe')
        documentationIframe.src = 'http://nodejs.org/docs/' + nodeVersion + '/api/index.html'
    }
    editor.appendChild(documentationIframe)
    return editor
}