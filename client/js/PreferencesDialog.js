


var PreferencesDialog = function (editorThemes)
{
	this.dialog = undefined;
	this.preferences = undefined;
	this.editorThemes = editorThemes;

	this.load();
};

PreferencesDialog.prototype.open = function()
{
	this.dialog.show();
};

PreferencesDialog.prototype.load = function()
{
	var self = this;

	$.get('dialog.html', function(response)
	{
		self.dialog = $(response);
		self.dialog.hide();
		$('body').append(self.dialog);
		$('.dialog-title').html('Preferences');

		$.get('preferences.html', function (response)
		{
			self.preferences = $(response);
			$('.dialog-content').html(response);

			self.finalInit();
		})
	});
}

PreferencesDialog.prototype.finalInit = function()
{
	var self = this;

	// Center Dialog
	$(window).resize(function() {
		$('.dialog').css({
			'top'  : ($(window).height() - $('.dialog').outerHeight()) / 2,
			'left' : ($(window).width() - $('.dialog').outerWidth()) / 2
		});
	}).resize();

	this.handleDialogClose();
	this.handleAllInputs();
	this.handleThemeSelection();
	this.handleCodeEditorUpdates();
};

PreferencesDialog.prototype.handleThemeSelection = function()
{
	var self = this;

	var $theme_selection = $('#theme-selection');
	$.each(self.editorThemes || [], function() {
		$('<option value=' + this.value + '>' + this.name + '</option>')
			.attr('selected', ($.cookie('editor-theme') == this.value))
			.appendTo($theme_selection);
	});
	$theme_selection.change(function() {
		$('.CodeMirror-scroll')
			.removeClass(self.editorThemes.map(function(it) {return 'cm-s-' + it.value;}).join(' '))
			.addClass('cm-s-' + $(this).val());
	});
};

PreferencesDialog.prototype.handleAllInputs = function()
{
	var inputs = $('.preferences').find(":input");

	inputs.change(function(e)
	{
		var input = $(e.target);
		$.cookie(input.attr('name'), input.val(), {expires: 30});
	});

	inputs.each(function(index,e)
	{
		$(e).val($.cookie($(e).attr('name')));
	});
}

PreferencesDialog.prototype.handleDialogClose = function()
{
	var self = this;

	$('.dialog-close').click(function(e) {
		e.preventDefault();
		self.dialog.fadeOut(200);
	});

};

PreferencesDialog.prototype.handleCodeEditorUpdates = function()
{
	var inputs = $('select[name="show-line-numbers"]');

	inputs.change(function(e)
	{
		ui.setOptionOnCodeEditors('lineNumbers',$(e.target).val() == "true");
	})
}