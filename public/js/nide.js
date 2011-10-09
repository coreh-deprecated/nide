var ui, connection;

$(function() {
    connection = new ServerConnection()
    ui = new UserInterfaceController()
})

var cwd = ''
var nodeVersion = 'v0.4.11'