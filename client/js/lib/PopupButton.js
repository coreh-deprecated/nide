


var PopupButton = function()
{

};

PopupButton.prototype.initUI = function(popupUrl,buttonSelector,cb)
{
	var self = this;

	$.get(popupUrl, function(response)
	{
		self.buttonSelector = buttonSelector;
		self.popup = $(response);
		self.popup.hide();

		$('body').append(self.popup);

		self.handleButtonMouseDown();
		self.handleButtonMouseUp();
		self.handlePopupMouseUp();
		self.handlePopupMouseDown();
		self.handlePopupBlur();

		if (cb)
		{
			cb.call(self);
		}
	});
};

PopupButton.prototype.handleButtonMouseDown = function()
{
	var self = this;

	$(self.buttonSelector).mousedown(function(e)
	{
		self.shouldDismissCoderunMenuOnMouseUp = false;
		self.hasJustDisplayedCoderunMenu = true;

		var button = $(e.target);
		var buttonOffset = button.offset();

		self.popup.css('left',buttonOffset.left);
		self.popup.css('bottom',$(document).height() - buttonOffset.top);
		self.popup.show();

		setTimeout(function(){
			self.shouldDismissCoderunMenuOnMouseUp = true;
		}, 500)
		setTimeout(function(){
			self.hasJustDisplayedCoderunMenu = false;
		}, 0)
	});
};

PopupButton.prototype.handleButtonMouseUp = function()
{
	var self = this;

	$(self.buttonSelector).mouseup(function()
	{
		if (self.shouldDismissCoderunMenuOnMouseUp) {
			self.popup.fadeOut(200);
		}
	})
}

PopupButton.prototype.handlePopupMouseUp = function()
{
	var self = this;

	$(self.popup).mouseup(function(e)
	{
		self.popup.fadeOut(200);
	})
}

PopupButton.prototype.handlePopupMouseDown = function()
{
	var self = this;

	$(self.popup).mousedown(function(e)
	{
		e.stopPropagation();
	});
}

PopupButton.prototype.handlePopupBlur = function()
{
	var self = this;

	$(document.body).mousedown(function()
	{
		if (!self.hasJustDisplayedCoderunMenu) {
			self.popup.fadeOut(200);
		}
	})

	$(window).bind('blur resize', function()
	{
		self.popup.fadeOut(200);
	})
}