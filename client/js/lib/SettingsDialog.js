
var SettingsDialog = function()
{

};

SettingsDialog.prototype.load = function(contentUrl,title,cb)
{
	var self = this;

	self.getDialogHtml(function(dialogHtml)
	{
		self.dialog = $(dialogHtml);
		self.dialog.hide();
		self.dialog.find('.dialog-title').html(title);
		self.overlay = $('#dialog-overlay');

		$('body').append(self.dialog);

		$.get(contentUrl, function (response)
		{
			self.settings = $(response);
			self.dialog.find('.dialog-content').html(response);
			self.handleWindowResize();
			self.handleDialogClose();

			if (cb)
				cb.call(self);
		})
	});
};

SettingsDialog.prototype.getDialogHtml = function(cb)
{
	if (SettingsDialog.dialogHtml)
	{
		cb(SettingsDialog.dialogHtml);
	}
	else
	{
		$.get('dialog.html', function(response)
		{
			SettingsDialog.dialogHtml = response;

			cb(response);
		});
	}
}

SettingsDialog.prototype.handleWindowResize = function()
{
	var self = this;

	$(window).resize(function()
	{
		self.centerDialog();
	});
}

SettingsDialog.prototype.handleDialogClose = function()
{
	var self = this;

	self.dialog.find('.dialog-close').click(function(e)
	{
		e.preventDefault();
		self.dialog.fadeOut(200);
	});

};

SettingsDialog.prototype.open = function()
{
	if (this.dialog)
	{
		this.overlay.show();
		this.dialog.show();
		this.centerDialog();
	}
};

SettingsDialog.prototype.centerDialog = function()
{
	this.dialog.css({
		'top'  : ($(window).height() - this.dialog.outerHeight()) / 2,
		'left' : ($(window).width() - this.dialog.outerWidth()) / 2
	});
}