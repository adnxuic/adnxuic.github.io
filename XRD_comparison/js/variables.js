(function() {
  'use strict';
  var X = window.XRD;
  var dom = X.dom;

  function renderVarTree() {
    var keys = Object.keys(X.dataStore);
    if (keys.length === 0) {
      dom.variableTree.innerHTML = '<div class="empty-msg">\u6682\u65E0\u6570\u636E<br>\u8BF7\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u5BFC\u5165</div>';
      return;
    }
    var html = '';
    keys.forEach(function(fn) {
      var fd = X.dataStore[fn];
      var safeId = fn.replace(/[^a-zA-Z0-9]/g, '_');
      html += '<div class="var-file">' +
        '<div class="var-file-header" data-toggle="' + safeId + '">' +
        '<span class="var-file-toggle" id="tog_' + safeId + '">&#9660;</span>' +
        '<span class="var-file-name" title="' + X.esc(fn) + '">' + X.esc(fn) + '</span>' +
        '<button class="btn-icon var-delete-btn" data-fn="' + X.esc(fn) + '" title="\u5220\u9664">&#10005;</button>' +
        '</div>' +
        '<div class="var-file-cols" id="cols_' + safeId + '">';
      fd.columns.forEach(function(col) {
        html += '<div class="var-col-item">' + X.esc(col.name) +
                ' <span class="text-dim">(' + col.data.length + ')</span></div>';
      });
      html += '</div></div>';
    });
    dom.variableTree.innerHTML = html;
  }

  dom.variableTree.addEventListener('click', function(e) {
    var delBtn = e.target.closest('.var-delete-btn');
    if (delBtn) {
      e.stopPropagation();
      var fn = delBtn.dataset.fn;
      delete X.dataStore[fn];
      if (X.globalXVar && X.globalXVar.lastIndexOf(fn + '::', 0) === 0) X.globalXVar = '';
      X.traces.forEach(function(t) {
        if (t.yVar && t.yVar.lastIndexOf(fn + '::', 0) === 0) t.yVar = '';
      });
      X.renderGlobalX();
      X.renderVarTree();
      X.renderLineControls();
      X.renderPeakControls();
      X.updateChart();
      return;
    }
    var header = e.target.closest('.var-file-header');
    if (header) {
      var id = header.dataset.toggle;
      var colsDiv = X.$('cols_' + id);
      var togSpan = X.$('tog_' + id);
      if (colsDiv) {
        colsDiv.classList.toggle('hidden');
        togSpan.innerHTML = colsDiv.classList.contains('hidden') ? '&#9654;' : '&#9660;';
      }
    }
  });

  X.renderVarTree = renderVarTree;
})();
