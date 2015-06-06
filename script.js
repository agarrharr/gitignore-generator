var types = [];
var selectedTypes = [];

$(document).ready(function() {
  getTypes();

  $('#projectTypeInput').keyup(function() {
    var value = $(this).val();
    makeGitignoreSearch(value);
  });
});

function getTypes() {
  if (localStorage.getItem('types')) {
    types = localStorage.getItem('types').split(',');
  } else {
    $.get('https://api.github.com/repos/github/gitignore/contents/', function(d) {
      types = convertToArrayOfGitignoreFiles(d);
      localStorage.setItem('types', types);
    })
    .fail(function() {
      types = ['Meteor', 'Ada'];
      localStorage.setItem('types', types);
    });
  }
}

function convertToArrayOfGitignoreFiles(d) {
  var types = [];
  for(var i = 0; i < d.length; i += 1) {
    types.push(d[i].name.split('.')[0]);
  }
  return types;
}

function makeGitignoreSearch(searchTerm) {
  if (result = isValidType(searchTerm)) {
    showResults(result);
  }
}

function isValidType(type) {
  for(var i = 0; i < types.length; i += 1) {
    if (types[i].toLowerCase() === type.toLowerCase()) {
      return types[i];
    }
  }
  return false;
}

function showResults(type) {
  var checked = '';
  if (indexOfSelected(type) !== -1) {
    checked = 'checked';
  }
  var $input = $('<input type="checkbox" data-type="' + type + '" ' + checked + ' />');
  var $html = $('<li> ' + type + '</li>');
  $html.prepend($input);
  $input.on('click', addContentToTextArea);
  $('#searchResults').html($html);
}

function addContentToTextArea(type) {
  var checked = $(this).prop('checked');
  var type = $(this).data('type');
  if (checked) {
    $.get('https://api.github.com/repos/github/gitignore/contents/' + type + '.gitignore', function(d) {
      var content = atob(d.content);
      selectedTypes.push({type: type, content: content});
      updateTextArea();
    })
    .fail(function() {
      selectedTypes.push({type: type, content: '# Unable to retrieve data, please visit\n# https://raw.githubusercontent.com/github/gitignore/master/' + type + '.gitignore'});
      updateTextArea();
    });
  } else {
    selectedTypes.splice(indexOfSelected(type), 1);
    updateTextArea();
  }
}

function updateTextArea() {
  var totalContent = '';
  for(var i = 0; i < selectedTypes.length; i += 1) {
    if (i > 0) {
      totalContent += '\n\n';
    }
    totalContent += '# ' + selectedTypes[i].type + '\n';
    totalContent += selectedTypes[i].content;
  }

  $('#results').val(totalContent);
}

function indexOfSelected(type) {
  for(var i = 0; i < selectedTypes.length; i += 1) {
    if (type.toLowerCase() === selectedTypes[i].type.toLowerCase()) {
      return i;
      break;
    }
  }
  return -1;
}
