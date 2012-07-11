

var gearMenu;

$(function() {
	gearMenu = new GearMenu();
})

var GearMenu = function ()
{
	this.preferencesDialog = new PreferencesDialog(ui.editorThemes);

	this.initUI('html/gear_menu.html','#gear-menu',this.finalInit);
};

GearMenu.prototype = new PopupButton();

GearMenu.prototype.finalInit = function ()
{
	var self = this;

	self.popup.find('#project-refresh').click(function(e)
	{
		connection.list()
	});

	self.popup.find('#preference-settings').click(function(e)
	{
		e.preventDefault();
		self.preferencesDialog.open();
	});

	self.popup.find('#show-hidden').click(function()
	{
		$('#sidebar').toggleClass('show-hidden');
	});
}