
(function()
{
	var stringProps = ("charAt charCodeAt indexOf lastIndexOf substring substr slice trim trimLeft trimRight " +
		"toUpperCase toLowerCase split concat match replace search").split(" ");
	var arrayProps = ("length concat join splice push pop shift unshift slice reverse sort indexOf " +
		"lastIndexOf every some filter forEach map reduce reduceRight ").split(" ");
	var funcProps = "prototype apply call bind".split(" ");
	var javascriptKeywords = ("break case catch continue debugger default delete do else false finally for function " +
		"if in instanceof new null return switch throw true try typeof var void while with").split(" ");
	var coffeescriptKeywords = ("and break catch class continue delete do else extends false finally for " +
		"if in instanceof isnt new no not null of off on or return switch then throw true try typeof until void while with yes").split(" ");

	var CodeEditorAutocomplete = window.CodeEditorAutocomplete = {};

	CodeEditorAutocomplete.autocomplete = function(editor)
	{
		// CodeEditorAutocomplete.simpleHint(editor, CodeEditorAutocomplete.javascriptHint);
		CodeEditorAutocomplete.serverHint(editor);
	};

	/**
	 *
	 * 1. validate autocomplete possible
	 * 2. autoreplace if one option available
	 * 3. build and display selection widget
	 *
	 * @param editor
	 * @param getHints
	 * @return {*}
	 */
	CodeEditorAutocomplete.simpleHint = function(editor, getHints)
	{
		// We want a single cursor position.
		if (editor.somethingSelected()) return;

		var result = getHints(editor);
		if (!result || !result.list.length) return;
		var completions = result.list;
		function insert(str) {
			editor.replaceRange(str, result.from, result.to);
		}
		// When there is only one completion, use it directly.
		if (completions.length == 1) {insert(completions[0]); return true;}

		// Build the select widget
		var complete = document.createElement("div");
		complete.className = "CodeMirror-completions";
		var sel = complete.appendChild(document.createElement("select"));
		// Opera doesn't move the selection when pressing up/down in a
		// multi-select, but it does properly support the size property on
		// single-selects, so no multi-select is necessary.
		if (!window.opera) sel.multiple = true;
		for (var i = 0; i < completions.length; ++i) {
			var opt = sel.appendChild(document.createElement("option"));
			opt.appendChild(document.createTextNode(completions[i]));
		}
		sel.firstChild.selected = true;
		sel.size = Math.min(10, completions.length);
		var pos = editor.cursorCoords();
		complete.style.left = pos.x + "px";
		complete.style.top = pos.yBot + "px";
		document.body.appendChild(complete);
		// If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
		var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
		if(winW - pos.x < sel.clientWidth)
			complete.style.left = (pos.x - sel.clientWidth) + "px";
		// Hack to hide the scrollbar.
		if (completions.length <= 10)
			complete.style.width = (sel.clientWidth - 1) + "px";

		var done = false;
		function close() {
			if (done) return;
			done = true;
			complete.parentNode.removeChild(complete);
		}
		function pick() {
			insert(completions[sel.selectedIndex]);
			close();
			setTimeout(function(){editor.focus();}, 50);
		}
		CodeMirror.connect(sel, "blur", close);
		CodeMirror.connect(sel, "keydown", function(event) {
			var code = event.keyCode;
			// Enter
			if (code == 13) {CodeMirror.e_stop(event); pick();}
			// Escape
			else if (code == 27) {CodeMirror.e_stop(event); close(); editor.focus();}
			else if (code != 38 && code != 40) {
				close(); editor.focus();
				// Pass the event to the CodeMirror instance so that it can handle things like backspace properly.
				editor.triggerOnKeyDown(event);
				setTimeout(function(){CodeMirror.simpleHint(editor, getHints);}, 50);
			}
		});
		CodeMirror.connect(sel, "dblclick", pick);

		sel.focus();
		// Opera sometimes ignores focusing a freshly created node
		if (window.opera) setTimeout(function(){if (!done) sel.focus();}, 100);
		return true;
	};

	CodeEditorAutocomplete.javascriptHint = function(editor)
	{
		return CodeEditorAutocomplete.scriptHint(editor, javascriptKeywords,
			function (e, cur) {return e.getTokenAt(cur);});
	};

	CodeEditorAutocomplete.serverHint = function(editor)
	{
		var cur = editor.getCursor();
		var text = editor.getValue();

		connection.autocomplete({
			cursor: cur,
			text: text
		});
//
//			function onGetHints()
//			{
//
//				CodeEditorAutocomplete.simpleHint(editor, function (editor)
//				{
//					return hints;
//				});
//			};
	};

	CodeEditorAutocomplete.scriptHint = function(editor, keywords, getToken)
	{
		// Find the token at the cursor
		var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
		// If it's not a 'word-style' token, ignore the token.
		if (!/^[\w$_]*$/.test(token.string)) {
			token = tprop = {start: cur.ch, end: cur.ch, string: "", state: token.state,
				className: token.string == "." ? "property" : null};
		}
		// If it is a property, find out what it is a property of.
		while (tprop.className == "property") {
			tprop = getToken(editor, {line: cur.line, ch: tprop.start});
			if (tprop.string != ".") return;
			tprop = getToken(editor, {line: cur.line, ch: tprop.start});
			if (tprop.string == ')') {
				var level = 1;
				do {
					tprop = getToken(editor, {line: cur.line, ch: tprop.start});
					switch (tprop.string) {
						case ')': level++; break;
						case '(': level--; break;
						default: break;
					}
				} while (level > 0)
				tprop = getToken(editor, {line: cur.line, ch: tprop.start});
				if (tprop.className == 'variable')
					tprop.className = 'function';
				else return; // no clue
			}
			if (!context) var context = [];
			context.push(tprop);
		}
		return {list: CodeEditorAutocomplete.getCompletions(token, context, keywords),
			from: {line: cur.line, ch: token.start},
			to: {line: cur.line, ch: token.end}};
	};

	CodeEditorAutocomplete.getCompletions = function(token, context, keywords)
	{
		var found = [], start = token.string;
		function maybeAdd(str) {
			if (str.indexOf(start) == 0 && !arrayContains(found, str)) found.push(str);
		}
		function gatherCompletions(obj) {
			if (typeof obj == "string") forEach(stringProps, maybeAdd);
			else if (obj instanceof Array) forEach(arrayProps, maybeAdd);
			else if (obj instanceof Function) forEach(funcProps, maybeAdd);
			for (var name in obj) maybeAdd(name);
		}

		if (context) {
			// If this is a property, see if it belongs to some object we can
			// find in the current environment.
			var obj = context.pop(), base;
			if (obj.className == "variable")
				base = window[obj.string];
			else if (obj.className == "string")
				base = "";
			else if (obj.className == "atom")
				base = 1;
			else if (obj.className == "function") {
				if (window.jQuery != null && (obj.string == '$' || obj.string == 'jQuery') &&
					(typeof window.jQuery == 'function'))
					base = window.jQuery();
				else if (window._ != null && (obj.string == '_') && (typeof window._ == 'function'))
					base = window._();
			}
			while (base != null && context.length)
				base = base[context.pop().string];
			if (base != null) gatherCompletions(base);
		}
		else {
			// If not, just look in the window object and any local scope
			// (reading into JS mode internals to get at the local variables)
			for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
			gatherCompletions(window);
			forEach(keywords, maybeAdd);
		}
		return found;
	};

	function forEach(arr, f) {
		for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
	}

	function arrayContains(arr, item) {
		if (!Array.prototype.indexOf) {
			var i = arr.length;
			while (i--) {
				if (arr[i] === item) {
					return true;
				}
			}
			return false;
		}
		return arr.indexOf(item) != -1;
	};

	CodeMirror.commands.autocomplete = CodeEditorAutocomplete.autocomplete;
})();