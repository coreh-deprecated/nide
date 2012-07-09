
// Licenses
// http://www.opensource.org/divcenses/category/
// http://www.gnu.org/divcenses/gpl.html
// http://opensource.org/divcenses/bsd-license.php
// http://www.mozilla.org/MPL/MPL-1.1.html
// http://opensource.org/divcenses/afl-2.1.php
// http://opensource.org/divcenses/osl-2.1.php

(function()
{
	var PackageJSONEditor = window.PackageJSONEditor = function(entry)
	{
		var self = this;
		var editor = document.createElement('div')
		var sidebarEntry = $('.selected')
		editor.className = 'package-json-editor'
		editor.innerHTML = editorForm;

		$("label",editor).hover(function(e)
		{
			self.showHint(e);
		});

		$(editor).delegate("input,select,textarea",'change',function(e)
		{
			self.save();
		});

		$("form",editor).change(function(e)
		{
			self.save();
		});

		$("button.refresh",editor).click(function(e)
		{
			self.refresh();
		});

		this.editor = editor;
		this.entry = entry;
		this.saving = false;
		this.setPackageValues(editor,entry);

		this.element = editor;
		return this;
	};

	PackageJSONEditor.prototype.showHint = function(e)
	{
		var forName = $(e.target).attr('for');
		var hintContainer = $("#hint-container",this.editor)[0];

		hintContainer.innerHTML = hints[forName];
	};

	PackageJSONEditor.prototype.refresh = function()
	{
		this.setPackageValues(this.editor,this.entry);
	};

	PackageJSONEditor.prototype.save = function()
	{
		var self = this;
		var editor = this.editor;
		var entry = this.entry;

		if (!this.saving)
		{
			this.saving = true;

			var done = false;
			var selected = $('.selected')
			selected.addClass('syncing');

			var packageDesc = this.getPackageValues(editor);
			_.defaults(packageDesc,this.packageData);
			var packageContents = JSON.stringify(packageDesc,null,4);

			connection.saveFile(entry.path, packageContents, function(err){
				if (!err) {
					done = true;
					selected.removeClass('syncing');
					self.packageData = packageDesc;
				}
				self.saving = false
			});
			setTimeout(function() {
				if (!done) {
					self.saving = false;
				}
			}, 8000);
		}
	};

	PackageJSONEditor.prototype.getPackageValues = function(editor)
	{
		return {
			name: $("#name",editor).val(),
			preferGlobal: $("input:radio[name=preferGlobal]:checked").val(),
			version: $("#version-major",editor).val().trim() + "." + $("#version-minor",editor).val().trim() + "." + $("#version-revision",editor).val().trim(),
			author: this.formatAuthor($("#author-name",editor).val().trim(),$("#author-email",editor).val().trim()),
			description: $("#description",editor).val().trim(),
			main: $("#main",editor).val().trim(),
			noAnalyze: $("input:radio[name=noAnalyze]:checked").val(),
			license: $("#license").val().trim(),
			repository: {
				type: $("#repository-type").val().trim(),
				url: $("#repository-url").val().trim()
			},
			contributors: FormBuilder.getValuesForGroupField(contributorsFieldDesc),
			scripts: FormBuilder.getValuesForGroupField(scriptsFieldDesc),
			bin: FormBuilder.getValuesForGroupField(binFieldDesc),
			keywords: FormBuilder.getValuesForGroupField(keywordsFieldDesc),
			engines: FormBuilder.getValuesForGroupField(enginesFieldDesc)
		};
	};

	PackageJSONEditor.prototype.formatAuthor = function(name,email)
	{
		if (email.length > 0)
		{
			name += " <" + email + ">";
		}

		return name;
	};

	PackageJSONEditor.prototype.setPackageValues = function(editor,entry)
	{
		var self = this;

		connection.loadFile(entry.path, function(err, file) {
			if (err)
			{
				$("#packageJSONForm").css({ visibility: 'hidden', zIndex: -1 });

				$("#errorMsg").text(err);
				$("#packageJSONError").hide();
				$("#packageJSONError").fadeIn(250);
			}
			else
			{
				$("#packageJSONError").css({ visibility: 'hidden', zIndex: -1 });
				$("#packageJSONForm").hide();
				$("#packageJSONForm").fadeIn(250);

				var packageData = self.packageData = JSON.parse(file);

				$("#name",editor).val(packageData.name);
				$("input:radio[name=preferGlobal]").each(function(index,radio)
				{
					var isChecked = $(radio).val() == packageData.preferGlobal;
					$(radio).attr('checked',isChecked);
				});
				var versionParts = packageData.version ? packageData.version.split(".") : [""];
				$("#version-major",editor).val(versionParts[0]);
				$("#version-minor",editor).val(versionParts[1]);
				$("#version-revision",editor).val(versionParts[2]);
				var authorParts = packageData.author ? packageData.author.split("<") : [""];
				$("#author-name",editor).val(authorParts[0].trim());
				$("#author-email",editor).val(authorParts.length > 1 ? authorParts[1].split(">")[0].trim() : "");
				$("#description",editor).val(packageData.description);
				$("#main",editor).val(packageData.main);
				$("input:radio[name=noAnalyze]").each(function(index,radio)
				{
					var isChecked = $(radio).val() == packageData.noAnalyze;
					$(radio).attr('checked',isChecked);
				});
				$("#license",editor).val(packageData.license);
				if (packageData.repository)
				{
					$("#repository-type").val(packageData.repository.type);
					$("#repository-url").val(packageData.repository.url);
				}

				FormBuilder.setValuesForGroupField(contributorsFieldDesc,packageData.contributors);
				FormBuilder.setValuesForGroupField(scriptsFieldDesc,packageData.scripts);
				FormBuilder.setValuesForGroupField(binFieldDesc,packageData.bin);
				FormBuilder.setValuesForGroupField(keywordsFieldDesc,packageData.keywords);
				FormBuilder.setValuesForGroupField(enginesFieldDesc,packageData.engines);

				$("#name",editor).focus();
			}
		})
	}

})();

var contributorsFieldDesc = {
	label: 'Contributors',
	id: 'contributors',
	fields: [
		{
			name: "name",
			type: "text"
		},
		{
			name: "email",
			type: "email"
		}
	]
};

var scriptsFieldDesc = {
	label: "Scripts",
	id: "scripts",
	fields: [
		{
			name: "command",
			type: "text"
		},
		{
			name: "script",
			type: "text"
		}
	]
};

var enginesFieldDesc = {
	label: "Engines",
	id: "engines",
	fields: [
		{
			name: "name",
			type: "text"
		},
		{
			name: "version",
			type: "text"
		}
	]
};

var binFieldDesc = {
	label: "Bin",
	id: "bin",
	fields: [
		{
			name: "command",
			type: "text"
		},
		{
			name: "path",
			type: "text"
		}
	]
};

var keywordsFieldDesc = {
	label: "Keywords",
	id: "keywords",
	fields: [
		{
			name: "keyword",
			type: "text"
		}
	]
};

var editorForm =
	'<div class="actions"><b>package.json editor</b> <button class="refresh">Refresh</button></div>' +
		'<div id="packageJSONError" class="error">' +
		'<b>Unable to open file:</b><span id="errorMsg"></span>' +
		'</div>' +
		'<div id="packageJSONForm">' +
		'<form id="packageJSON">' +
		'<fieldset>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="name">Name</label>' +
		'	<input type="text" placeholder="Name" id="name" name="name" />' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="preferGlobal">Prefer Global</label>' +
		'	<input type="radio" name="preferGlobal" value="true" /> Yes' +
		'	<input type="radio" name="preferGlobal" value="false" /> No' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="version">Version</label>' +
		'	<input type="text" id="version-major" name="version-major" placeholder="0" size="4" />' +
		'	<input type="text" id="version-minor" name="version-minor" placeholder="0" size="4" />' +
		'	<input type="text" id="version-revision" name="version-revision" placeholder="1" size="4" />' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="author">Author</label>' +
		'	<input type="text" placeholder="Name" id="author-name" name="author-name" />' +
		'	<input type="email" placeholder="Email" id="author-email" name="author-email" />' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="description">Description</label>' +
		'	<input type="text" placeholder="Description" id="description" name="description" />' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="main">Main</label>' +
		'	<input type="text" placeholder="./index.js" id="main" name="main" />' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="noAnalyze">No Analyze</label>' +
		'	<input type="radio" name="noAnalyze" value="true" /> Yes' +
		'	<input type="radio" name="noAnalyze" value="false" /> No' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="license">License</label>' +
		'	<input type="text" name="license" id="license" />' +
		'	<select id="license-options" onchange="onSelectSetValue(event,\'license\');">' +
		'	<option value="">-- Options --</option>' +
		'	<option value="GPL">GNU General Public License (GPL)</option>' +
		'	<option value="BSD">BSD License</option>' +
		'	<option value="MPL">Mozilla Public License (MPL)</option>' +
		'	<option value="AFL">Academic Free License (AFL)</option>' +
		'	<option value="OSL">Open Software License (OSL)</option>' +
		'	</select>' +
		'  </div>' +
		'  <div class="formRow">' +
		'	<label class="formCell" for="repository">Repository</label>' +
		'	<input type="text" placeholder="type" id="repository-type" name="repository-type" />' +
		'	<input type="url" placeholder="url" id="repository-url" name="repository-url" />' +
		'  </div>' +
		FormBuilder.generateMultiInputGroup(contributorsFieldDesc) +
		FormBuilder.generateKeyValueGroup(enginesFieldDesc) +
		FormBuilder.generateKeyValueGroup(scriptsFieldDesc) +
		FormBuilder.generateKeyValueGroup(binFieldDesc) +
		FormBuilder.generateValueArrayGroup(keywordsFieldDesc) +
		'</fieldset>' +
		'</form>' +
		'<div id="hint-container" />' +
		'</div>';


var hints = {
	"home": "Welcome to the <strong>package.json</strong> cheatsheet! <br/><br/> This is an interactive guide for exploring various important properties of the <a target='_blank' href='http://blog.nodejitsu.com/npm-cheatsheet'>package.json</a> packaging format for <a target='_blank' href='http://nodejs.org'>node.js</a> applications. <br/> <br/> You can access information about properties by <strong>mousing over</strong> or <strong>clicking</strong> the property name.</div></ul>",
	"name": "The unique name of your package. <br/><br/> This will also indicate the name of the package in the <a target='_blank' href='http://search.npmjs.org'>NPM global repository</a> ( if you choose to publish it. ) <br/><br/> On <a target='_blank' href='http://nodejitsu.com'>Nodejitsu</a>, this property will represent the name of your application.",
	"preferGlobal": "<a target='_blank' href='http://en.wikipedia.org/wiki/Flag_%28computing%29'>Flag</a> that indicates this package prefers to be installed globally. <br/><br/> This is usually reserved for packages that contain <a target='_blank' href='http://en.wikipedia.org/wiki/Command-line_interface'>command line interfaces</a> ( CLIs ). <br/> <br/> In most situations, you will <strong>NOT</strong> use this property.",
	"version": "Version of the package as specified by <a target='_blank' href='http://semver.org'>Semantic Versioning</a>.<br/><br/> It's important to keep track of your package versions <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>in a smart way</a>. If you don't follow standard versioning techniques, it will be difficult for users to keep track of your packages. <br/><br/> Consider the following version updates: <br/><br/> 0.1.0 -> 0.1.1 should be <strong>non-breaking</strong>. <br/> 0.1.1 -> 0.2.0 could be <strong>breaking</strong>.",
	"author": "The author of the project. <br/><br/>Hopefully one day soon, it will be your name!",
	"description": "The description of the project. <br/><br/>Try to keep it short and concise.",
	"contributors": "An array of objects representing contributors to the project. <br/><br/> Each object represents one contributor.",
	"bin": "A <a target='_blank' href='http://stackoverflow.com/questions/2364289/what-exactly-is-a-hash-in-regards-to-json'>hash</a> containing key/pair mappings of binary script names and node.js script paths. <br/> <br/> This is used to expose binary scripts from your package. It's useful for creating command line interfaces.",
	"http-server" : "Installs a binary script called <strong>http-server</strong> which is linked to <strong>./bin/http-server</strong> in the local package. <br/><br/>If we have installed this package globally using <strong>npm install http-server -g</strong> we will be able to call this new command <strong>http-server</strong> from anywhere on our system.",

	"scripts": "A <a target='_blank' href='http://stackoverflow.com/questions/2364289/what-exactly-is-a-hash-in-regards-to-json'>hash</a> containing key/pair mappings of <a target='_blank' href='http://blog.nodejitsu.com/npm-cheatsheet'>npm commands</a> and node.js script paths. <br/> <br/> This is used to map specific entry points into your package that npm can use <a target='_blank' href='http://blog.nodejitsu.com/npm-cheatsheet'>in all sorts</a> of cool ways.",
	"start": "The start-up script for the package. <br/><br/>When running <strong>npm start</strong> this script will be called.",
	"test": "The test script for the package. <br/><br/>When running <strong>npm test</strong> this script will be called.",

	"main": "The main entry point of the package. <br/><br/>When calling <strong>require('http-server')</strong> in node.js this is the file that will actually be required.<br/><br/>It's <strong>highly advised</strong> that requiring the <strong>main</strong> file <strong>NOT</strong> generate any side-effects. <br/><br/>For instance, requiring the main file should <strong>NOT</strong> start up an HTTP server or connect to database. Instead, you should create something like <strong>exports.init</strong> in your <strong>main</strong> script.",

	"repository": "A <a target='_blank' href='http://stackoverflow.com/questions/2364289/what-exactly-is-a-hash-in-regards-to-json'>hash</a> containing key/pair mappings of source code repositories. <br/><br/> In our case, we will specify a <a target='_blank' href='http://git-scm.com/'>git</a> repository hosted on <a target='_blank' href='http://github.com/'>Github</a>",
	"type": "Type of source code repository. <br/><br/> In our case, <a target='_blank' href='http://git-scm.com/'>git</a>.",
	"url": "URL of source code repository. <br/><br/> In our case, <a target='_blank' href='http://github.com/'>Github</a>.",
	"keywords": "An array of keywords which describe your package. <br/><br/>This is useful for users who search for packages on <a target='_blank' href='http://search.npmjs.org/'>search.npmjs.org</a>",
	"dependencies": "A <a target='_blank' href='http://stackoverflow.com/questions/2364289/what-exactly-is-a-hash-in-regards-to-json'>hash</a> containing key/pair mappings of npm packages and versions. <br/> <br/> This is used to specify the <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>dependencies for your packages</a>.",
	"colors"   : "Require the <a target='_blank' href='http://github.com/marak/colors.js'>colors</a> module as a dependency with a wildcard version. <br/><br/> Using a <strong>wildcard</strong> version is usually <strong>NOT</strong> recommended. <br/><br/>Colors is unique, in that it's API is intended to always be backwards compatible. <br/><br/> Most packages will be too complex to ever work with a wildcard version.",
	"optimist" :  "Require the <a target='_blank' href='http://github.com/substack/node-optimist'>optimist</a> module as a dependency with a ranged version. <br/><br/>Using an <strong>x</strong> indicates that the package will attempt to use the highest value version for <strong>x</strong>. <br/><br/>In <strong>0.2.x</strong>, we have a wildcard <strong>ONLY</strong> for the <strong>patch</strong> version. <br/><br/>The hope here, is that the package author has followed <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>best-practices</a> and <strong>patch</strong> versions of the package will <strong>NOT</strong> be breaking.",
	"flatiron" :  "Require the <a target='_blank' href='http://github.com/flatiron/flatiron'>flatiron</a> module as a dependency with a ranged version. <br/><br/>Using an <strong>x</strong> indicates that the package will attempt to use the highest value version for <strong>x</strong>. <br/><br/>In <strong>0.1.x</strong>, we have a wildcard <strong>ONLY</strong> for the <strong>patch</strong> version. <br/><br/>The hope here, is that the package author has followed <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>best-practices</a> and <strong>patch</strong> versions of the package will <strong>NOT</strong> be breaking.",
	"ecstatic" :  "Require the <a target='_blank' href='https://github.com/jesusabdullah/node-ecstatic'>ecstatic</a> module as a dependency with a ranged version. <br/><br/>Using an <strong>x</strong> indicates that the package will attempt to use the highest value version for <strong>x</strong>. <br/><br/>In <strong>0.1.x</strong>, we have a wildcard <strong>ONLY</strong> for the <strong>patch</strong> version. <br/><br/>The hope here, is that the package author has followed <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>best-practices</a> and <strong>patch</strong> versions of the package will <strong>NOT</strong> be breaking.",
	"union" :  "Require the <a target='_blank' href='http://github.com/flatiron/union'>union</a> module as a dependency with a ranged version. <br/><br/>Using an <strong>x</strong> indicates that the package will attempt to use the highest value version for <strong>x</strong>. <br/><br/>In <strong>0.1.x</strong>, we have a wildcard <strong>ONLY</strong> for the <strong>patch</strong> version. <br/><br/>The hope here, is that the package author has followed <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>best-practices</a> and <strong>patch</strong> versions of the package will <strong>NOT</strong> be breaking.",
	"noAnalyze": "<a target='_blank' href='http://en.wikipedia.org/wiki/Flag_%28computing%29'>Flag</a> that indicates if the package should not have it's source code analyzed in anyway.<br/><br/> Usually, you can simply <strong>ignore</strong> this field. <br/><br/> At <a target='_blank' href='http://nodejitsu.com'>Nodejitsu</a>, we will automatically attempt to scan packages for missing dependencies, bugs, and syntax errors. <br/><br/>If you are confident your package is correct you can set <strong>noAnalyze</strong> to <strong>true</strong>.",

	"devDependencies":  "A <a target='_blank' href='http://stackoverflow.com/questions/2364289/what-exactly-is-a-hash-in-regards-to-json'>hash</a> containing key/pair mappings of npm packages and versions. <br/> <br/> This is used to specify <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>package dependencies</a> intended only for <strong>development</strong> purposes. <br/><br/> Usually, you will put <a target='_blank' href='http://en.wikipedia.org/wiki/Test_automation_framework'>testing framework dependencies</a> listed here. <br/><br/>Install these using: <strong>npm install --dev</strong>.",
	"vows" : "Require the <a target='_blank' href='http://github.com/cloudhead/vows'>vows</a> module as a development dependency with a ranged version. <br/><br/>Using an <strong>x</strong> indicates that the package will attempt to use the highest value version for <strong>x</strong>. <br/><br/>In <strong>0.5.x</strong>, we have a wildcard <strong>ONLY</strong> for the <strong>patch</strong> version. <br/><br/>The hope here, is that the package author has followed <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>best-practices</a> and <strong>patch</strong> versions of the package will <strong>NOT</strong> be breaking.",
	"request": "Require the <a target='_blank' href='http://github.com/mikeal/request'>request</a> module as a dependency with a ranged version. <br/><br/>Using an <strong>x</strong> indicates that the package will attempt to use the highest value version for <strong>x</strong>. <br/><br/>In <strong>2.1.x</strong>, we have a wildcard <strong>ONLY</strong> for the <strong>patch</strong> version. <br/><br/>The hope here, is that the package author has followed <a target='_blank' href='http://blog.nodejitsu.com/package-dependencies-done-right'>best-practices</a> and <strong>patch</strong> versions of the package will <strong>NOT</strong> be breaking.",
	"bundleDependencies": "An array containing a list of package names you have bundled in your package. <br/><br/>The convention here is to make sure your bundled dependencies exist in the <strong>node_modules/</strong> folder. <br/><br/>Packages listed in <strong>bundleDependencies</strong> will now remain locked into the version contained in the <strong>node_modules/</strong> folder.",
	"license": "The license which you prefer to release your project under. <br/><br/> <a target='_blank' href='http://en.wikipedia.org/wiki/MIT_License'>MIT</a> is a good choice.",
	"engine": "A <a target='_blank' href='http://stackoverflow.com/questions/2364289/what-exactly-is-a-hash-in-regards-to-json'>hash</a> containing key/pair mappings of <strong>engine</strong> versions. <br/> <br/> This is used to specify the versions of <a target='_blank' href='http://nodejs.org'>node.js</a> your package is <strong>known</strong> to work correctly with.",
	"node": "The version of <a target='_blank' href='http://nodejs.org'>node.js</a> this package is <strong>known</strong> to work with. <br/><br/> Like dependencies, this uses <a target='_blank' href='http://semver.org'>Semantic Versioning</a>."
};

function onSelectSetValue(event,fieldId)
{
	var selectInput = event.target;
	var selectedVal = $(selectInput).val();
	$("#" + fieldId).val(selectedVal);
}