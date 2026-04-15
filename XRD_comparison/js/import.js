(function() {
  'use strict';
  var X = window.XRD;
  var dom = X.dom;

  function handleFiles(files) {
    X.pendingImport = [];
    var loaded = 0;
    var total = files.length;
    for (var i = 0; i < total; i++) {
      (function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var parsed = X.parseFile(e.target.result);
          if (parsed) {
            parsed.fileName = file.name;
            X.pendingImport.push(parsed);
          }
          loaded++;
          if (loaded === total) showImportModal();
        };
        reader.readAsText(file);
      })(files[i]);
    }
  }

  function showImportModal() {
    if (X.pendingImport.length === 0) return;
    var html = '';
    X.pendingImport.forEach(function(file, fi) {
      var delimLabel = file.delim === 'tab' ? 'Tab' : (file.delim === 'comma' ? '\u9017\u53F7' : '\u7A7A\u683C');
      var headerInfo = file.skippedRows > 0
        ? ', \u5DF2\u8DF3\u8FC7 ' + file.skippedRows + ' \u884C\u8868\u5934'
        : '';
      html += '<div class="import-file-section">' +
        '<div class="import-file-header">' + X.esc(file.fileName) +
        ' <span class="text-dim">(' + file.totalRows + ' \u884C, ' +
        file.numCols + ' \u5217, ' + delimLabel + '\u5206\u9694' +
        headerInfo + ')</span></div>' +
        '<div class="preview-table-wrap"><table class="preview-table"><thead><tr>';

      file.columns.forEach(function(col, ci) {
        html += '<th><label><input type="checkbox" data-fi="' + fi +
                '" data-ci="' + ci + '" checked> ' + X.esc(col.name) + '</label></th>';
      });
      html += '</tr></thead><tbody>';
      file.previewRows.forEach(function(row) {
        html += '<tr>';
        for (var c = 0; c < file.numCols; c++) {
          var v = c < row.length ? row[c] : '';
          html += '<td>' + (typeof v === 'number' && isNaN(v) ? '-' : v) + '</td>';
        }
        html += '</tr>';
      });
      html += '</tbody></table></div></div>';
    });
    dom.modalBody.innerHTML = html;
    dom.importModal.classList.remove('hidden');
  }

  function confirmImport() {
    var checkboxes = dom.modalBody.querySelectorAll('input[type="checkbox"]');
    var selected = {};
    checkboxes.forEach(function(cb) {
      if (cb.checked) {
        var fi = parseInt(cb.dataset.fi);
        if (!selected[fi]) selected[fi] = [];
        selected[fi].push(parseInt(cb.dataset.ci));
      }
    });
    for (var fi in selected) {
      var file = X.pendingImport[parseInt(fi)];
      var cols = selected[fi].map(function(ci) {
        return { name: file.columns[ci].name, data: file.columns[ci].data.slice() };
      });
      X.dataStore[file.fileName] = { fileName: file.fileName, columns: cols };
    }
    closeModal();
    X.renderGlobalX();
    X.renderVarTree();
    X.renderLineControls();
    X.renderPeakControls();
    X.updateChart();
  }

  function closeModal() {
    dom.importModal.classList.add('hidden');
    X.pendingImport = [];
    dom.fileInput.value = '';
  }

  X.handleFiles = handleFiles;
  X.confirmImport = confirmImport;
  X.closeModal = closeModal;
})();
