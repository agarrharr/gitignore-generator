var types = [];
var selectedTypes = [];

$(document).ready(function() {
  showOptions();

  $('#projectTypeInput').keyup(function() {
    var value = $(this).val();
    makeGitignoreSearch(value);
  });
});

function showOptions() {
  getTypes(function() {
    showResults(types);
  });
}

function getTypes(callback) {
  if (localStorage.getItem('gitignore-types')) {
    types = localStorage.getItem('gitignore-types').split(',');
    callback();
  } else {
    $.get('https://api.github.com/repos/github/gitignore/contents/', function(d) {
      types = convertToArrayOfGitignoreFiles(d);
      $.get('https://api.github.com/repos/github/gitignore/contents/Global/', function(d) {
        types = types.concat(convertToArrayOfGitignoreFiles(d));
        types.sort();
        localStorage.setItem('gitignore-types', types);
        callback();
      })
      .fail(function() {
        localStorage.setItem('gitignore-types', types);
        callback();
      });
    })
    .fail(function() {
      types = ['Meteor', 'Ada'];
      localStorage.setItem('gitignore-types', types);
      callback();
    });
  }
}

function convertToArrayOfGitignoreFiles(d) {
  var types = [];
  var currentFile;
  for(var i = 0; i < d.length; i += 1) {
    currentFile = d[i].name.split('.');
    if (currentFile[1] === 'gitignore') {
      types.push(currentFile[0]);
    }
  }
  return types;
}

function makeGitignoreSearch(searchTerm) {
  var result = isValidType(searchTerm);
  if (searchTerm.length === 0) {
    showResults(types);
  } else {
    showResults(result);
  }
}

function isValidType(type) {
  var results = [];
  if (type.length > 0) {
    for(var i = 0; i < types.length; i += 1) {
      if (types[i].toLowerCase().slice(0, type.length) === type.toLowerCase()) {
        results.push(types[i]);
      }
    }
  }
  return results;
}

function showResults(typesToShow) {
  var checked;
  if (typesToShow.length === 0) {
    $('#searchResults').html('<p>No results found.</p>');
  } else {
    $('#searchResults').html('');
  }
  for(var i = 0; i < typesToShow.length; i += 1) {
    checked = '';
    if (indexOfSelected(typesToShow[i]) !== -1) {
      checked = 'checked';
    }
    var $input = $('<input type="checkbox" data-type="' + typesToShow[i] + '" ' + checked + ' />');
    var $html = $('<li> ' + typesToShow[i] + '</li>');
    $html.prepend($input);
    $input.on('click', addContentToTextArea);
    $('#searchResults').append($html);
  }
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
