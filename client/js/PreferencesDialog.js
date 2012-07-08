


var PreferencesDialog = function (editorThemes)
{
	this.dialogHtml = undefined;
	this.preferencesHtml = undefined;
	this.editorThemes = editorThemes;

	this.load();
};

PreferencesDialog.prototype.load = function()
{
	var self = this;

	$.get('dialog.html', function(response)
	{
		self.dialogHtml = response;

		$.get('preferences.html', function (response)
		{
			self.preferencesHtml = response;
		})
	});
}

PreferencesDialog.prototype.open = function()
{
	var self = this;

	// Create Overlay
	$('body').append(this.dialogHtml);
	$('.dialog-title').html('Preferences');
	$('.dialog-content').html(this.preferencesHtml);

	// Center Dialog
	$(window).resize(function() {
		$('.dialog').css({
			'top'  : ($(window).height() - $('.dialog').outerHeight()) / 2,
			'left' : ($(window).width() - $('.dialog').outerWidth()) / 2
		});
	}).resize();

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
		// Store current value to a cookie
		$.cookie('editor-theme', $(this).val(), {expires: 30});
	});

	$('.dialog-close').click(function(e) {
		e.preventDefault();
		$('#dialog-overlay, .dialog').fadeOut(200, function() {
			$(this).remove();
		});
	});
}