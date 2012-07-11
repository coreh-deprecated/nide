
var codeRunnerMenu;

$(function() {
	codeRunnerMenu = new CodeRunnerMenu();
})

var CodeRunnerMenu = function ()
{
	this.settingsDialog = new CodeRunnerDialog();

	this.initUI('html/coderunner_menu.html','#coderun-menu',this.finalInit);
};

CodeRunnerMenu.prototype = new PopupButton();

CodeRunnerMenu.prototype.finalInit = function ()
{
	var self = this;

	this.popup.find('#coderun-settings').mousedown(function(e)
	{
		self.settingsDialog.open();
	});
}