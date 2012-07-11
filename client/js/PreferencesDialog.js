


var PreferencesDialog = function (editorThemes)
{
	this.editorThemes = editorThemes;

	this.load('html/preferences.html','Preferences',this.finalInit);
};

PreferencesDialog.prototype = new SettingsDialog();

PreferencesDialog.prototype.finalInit = function()
{
	var self = this;

	this.handleAllInputs();
	this.handleThemeSelection();
	this.handleCodeEditorUpdates();
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

PreferencesDialog.prototype.handleCodeEditorUpdates = function()
{
	var inputs = $('select[name="show-line-numbers"]');

	inputs.change(function(e)
	{
		ui.setOptionOnCodeEditors('lineNumbers',$(e.target).val() == "true");
	})
};