

(function()
{
	var FormBuilder = window.FormBuilder = {};

	FormBuilder.fieldGroups = [];
	FormBuilder.fieldGroupIndexLookup = {};

	FormBuilder.handleAddFieldClick = function(e,groupIndex)
	{
		FormBuilder.addFieldGroupEntry(groupIndex);
	};

	FormBuilder.handleDelRowClick = function(e,groupIndex,rowIndex)
	{
		var row = FormBuilder.getGroupRowDiv(groupIndex,rowIndex);
		var form = $(row).parents('form');
		$(row).remove();
		$(form).change();
	};

	FormBuilder.generateFieldGroup = function(fieldDesc,getRowFxn,numRowsFxn,getValueFxn)
	{
		var fieldGroupIndex = FormBuilder.fieldGroups.length;
		var fieldGroup = FormBuilder.fieldGroups[fieldGroupIndex] = {
			index: fieldGroupIndex,
			fieldDesc: fieldDesc,
			getRowFxn: getRowFxn,
			numRowsFxn: numRowsFxn,
			getValueFxn: getValueFxn
		};
		FormBuilder.fieldGroupIndexLookup[fieldDesc.id] = fieldGroupIndex;

		var output = '';
		output += '<div class="formRow" id="fieldGroup_' + fieldGroupIndex + '">';
		output += '<label class="formCell" for="' + fieldDesc.id + '">' + fieldDesc.label + '</label>';
		output += '<a href="javascript:void(\'0\');" onclick="FormBuilder.handleAddFieldClick(event,' + fieldGroupIndex + ');"> Add ' + fieldDesc.label + '</a>';
		output += '</div>';

		return output;
	};

	FormBuilder.addFieldGroupEntry = function(groupIndex,values)
	{
		var fieldGroup = FormBuilder.getFieldGroup(groupIndex);
		var fieldDesc = fieldGroup.fieldDesc;
		var fields = fieldDesc.fields;
		var getValueFxn = fieldGroup.getValueFxn;

		var rowIndex = FormBuilder.getGroupRows(groupIndex).length;
		var value;
		var output = '<div name="row_' + rowIndex + '">';

		for (var colIndex=0; colIndex < fields.length; colIndex++)
		{
			var field = fields[colIndex];

			output += '<input type="' + field.type + '" name="' + field.name + '" placeholder="' + field.name + '"';

			value = getValueFxn ? getValueFxn(rowIndex,colIndex,field,values) : undefined;

			if (value)
			{
				output += ' value="' + value + '"';
			}

			output +=  ' />';
		}

		output += '<button class="delRow" onclick="FormBuilder.handleDelRowClick(event,' + groupIndex + ',' + rowIndex + ');">Delete</button>';
		output += '</div>';

		var fieldGroupDiv = FormBuilder.getFieldGroupDiv(groupIndex);
		$(fieldGroupDiv).append(output);
	};

	FormBuilder.getValuesForGroupField = function(fieldDesc)
	{
		var values = undefined;

		var groupIndex = FormBuilder.getFieldGroupIndex(fieldDesc);
		var group = FormBuilder.getFieldGroup(groupIndex);
		var groupDiv = FormBuilder.getFieldGroupDiv(groupIndex);
		var groupRowFxn = group.getRowFxn;

		var rows = FormBuilder.getGroupRows(groupIndex);
		var rowCount = rows.length;

		for (var rowIndex=0; rowIndex<rowCount; rowIndex++)
		{
			var row = rows[rowIndex];
			var inputs = $("input",row);

			values = groupRowFxn(values,rowIndex,inputs);
		}

		return values;
	};

	FormBuilder.setValuesForGroupField = function(fieldDesc,values)
	{
		FormBuilder.resetGroupField(fieldDesc);

		var groupIndex = FormBuilder.getFieldGroupIndex(fieldDesc);
		var group = FormBuilder.getFieldGroup(groupIndex);
		var groupDiv = FormBuilder.getFieldGroupDiv(groupIndex);
		var groupRowsFxn = group.numRowsFxn;

		var rowCount = groupRowsFxn(values);

		for (var rowIndex=0; rowIndex<rowCount; rowIndex++)
		{
			FormBuilder.addFieldGroupEntry(groupIndex,values);
		}
	};

	FormBuilder.resetGroupField = function(fieldDesc)
	{
		var groupIndex = FormBuilder.getFieldGroupIndex(fieldDesc);
		var group = FormBuilder.getFieldGroup(groupIndex);
		var groupDiv = FormBuilder.getFieldGroupDiv(groupIndex);

		var rows = FormBuilder.getGroupRows(groupIndex);
		rows.remove();
	};

	FormBuilder.getFieldGroupIndex = function(fieldDesc)
	{
		return FormBuilder.fieldGroupIndexLookup[fieldDesc.id];
	};

	FormBuilder.getFieldGroup = function(groupIndex)
	{
		return FormBuilder.fieldGroups[groupIndex];
	};

	FormBuilder.getFieldGroupDiv = function(groupIndex)
	{
		return $("#fieldGroup_" + groupIndex);
	};

	FormBuilder.getGroupRows = function(groupIndex)
	{
		return $("#fieldGroup_" + groupIndex).find('div[name^="row_"]');
	};

	FormBuilder.getGroupRowDiv = function(groupIndex,rowIndex)
	{
		return $("#fieldGroup_" + groupIndex).find('[name^="row_' + rowIndex + '"]');
	};

	// Group Specific

	FormBuilder.generateMultiInputGroup = function(fieldDesc)
	{
		return FormBuilder.generateFieldGroup(fieldDesc,
			function(values,rowIndex,inputs)
			{
				if (!values)
				{
					values = [];
				}

				var inputCount = inputs.length;
				var value = {};

				for (var i=0; i<inputCount; i++)
				{
					var name = $(inputs[i]).attr('name');
					var val = $(inputs[i]).val();

					value[name] = val;
				}

				values.push(value);

				return values;
			},
			function(values)
			{
				if (!values)
					return 0;
				
				return values.length;
			},
			function(rowIndex,colIndex,field,values)
			{
				if (!values || values.length <= rowIndex)
					return null;

				return values[rowIndex][field.name];
			}
		);
	};

	FormBuilder.generateKeyValueGroup = function(fieldDesc)
	{
		return FormBuilder.generateFieldGroup(fieldDesc,
			function (values,rowIndex,inputs)
			{
				if (!values)
				{
					values = {};
				}

				if (inputs.length != 2)
				{
					throw new Error("unexpected col count in key value group");
				}

				var key = $(inputs[0]).val().trim();
				var val = $(inputs[1]).val().trim();

				values[key] = val;

				return values;
			},
			function(values)
			{
				if (!values)
					return 0;

				return _.keys(values).sort().length;
			},
			function(rowIndex,colIndex,field,values)
			{
				if (!values)
					return null;

				var keys = _.keys(values).sort();

				if (keys.length <= rowIndex)
					return null;

				var key = keys[rowIndex];

				if (colIndex == 0)
					return key;
				else
					return values[key];
			}
		);
	};

	FormBuilder.generateValueArrayGroup = function(fieldDesc)
	{
		return FormBuilder.generateFieldGroup(fieldDesc,

			function(values,rowIndex,inputs)
			{
				if (!values)
				{
					values = [];
				}

				if (inputs.length != 1)
				{
					throw new Error("unexpected col count in value array group");
				}

				var val = $(inputs[0]).val().trim();

				if (val && val.length > 0)
				{
					values.push(val);
				}

				return values;
			},
			function(values)
			{
				if (!values)
					return 0;

				return values.length;
			},
			function(rowIndex,colIndex,field,values)
			{
				if (!values || values.length <= rowIndex)
					return null;

				return values[rowIndex];
			}
		);
	};
})();