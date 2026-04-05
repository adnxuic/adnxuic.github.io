(function() {
  'use strict';
  var X = window.XRD;
  var dom = X.dom;

  function renderGlobalX() {
    dom.globalXSelect.innerHTML = X.buildOptions(X.globalXVar);
  }

  function renderLineControls() {
    var html = '';
    X.traces.forEach(function(t, idx) {
      var autoLabel = t.yVar ? X.getVarLabel(t.yVar) : ('\u7EBF\u6761 ' + (idx + 1));
      html += '<div class="trace-card" data-trace-id="' + t.id + '">' +
        '<div class="trace-card-header" style="border-left:3px solid ' + t.color + '">' +
        '<span>\u7EBF\u6761 ' + (idx + 1) + '</span>' +
        '<button class="btn-icon delete-trace" title="\u5220\u9664">&#10005;</button></div>' +
        '<div class="trace-card-body">' +
        '<div class="ctrl-row"><label>\u540D\u79F0</label>' +
        '<input type="text" class="name-input ctrl-text" value="' + X.esc(t.customName) +
        '" placeholder="' + X.esc(autoLabel) + '"></div>' +
        '<div class="ctrl-row"><label>Y \u6570\u636E</label>' +
        '<select class="y-select ctrl-select">' + X.buildOptions(t.yVar) + '</select></div>' +
        '<div class="ctrl-row"><label>Y \u8F74</label>' +
        '<select class="yaxis-select ctrl-select">' +
        '<option value="y"' + (t.yAxis === 'y' ? ' selected' : '') + '>\u5DE6\u4FA7</option>' +
        '<option value="y2"' + (t.yAxis === 'y2' ? ' selected' : '') + '>\u53F3\u4FA7</option>' +
        '</select></div>' +
        '<div class="ctrl-row"><label>\u989C\u8272</label>' +
        '<input type="color" class="color-input ctrl-color" value="' + t.color + '"></div>' +
        '<div class="ctrl-row"><label>\u7EBF\u5BBD</label>' +
        '<input type="number" class="width-input ctrl-num" value="' + t.lineWidth +
        '" min="0.5" max="10" step="0.5"></div>' +
        '<div class="ctrl-row"><label>Y \u504F\u79FB</label>' +
        '<input type="number" class="offset-input ctrl-num" value="' + t.yOffset +
        '" step="any"></div>' +
        '<div class="ctrl-row"><label>Y \u7F29\u653E</label>' +
        '<input type="number" class="scale-input ctrl-num" value="' + t.yScale.toFixed(3) +
        '" min="0.001" step="0.1"></div>' +
        '</div></div>';
    });
    dom.lineControls.innerHTML = html;
  }

  dom.lineControls.addEventListener('change', function(e) {
    var card = e.target.closest('.trace-card');
    if (!card) return;
    var tid = parseInt(card.dataset.traceId);
    var t = X.traces.find(function(tr){ return tr.id === tid; });
    if (!t) return;

    if (e.target.matches('.name-input')) { t.customName = e.target.value; }
    else if (e.target.matches('.y-select')) t.yVar = e.target.value;
    else if (e.target.matches('.yaxis-select')) t.yAxis = e.target.value;
    else if (e.target.matches('.width-input')) t.lineWidth = parseFloat(e.target.value) || 1.5;
    else if (e.target.matches('.offset-input')) t.yOffset = parseFloat(e.target.value) || 0;
    else if (e.target.matches('.scale-input')) t.yScale = Math.max(0.001, parseFloat(e.target.value) || 1);

    X.updateChart();
    X.renderPeakControls();
  });

  dom.lineControls.addEventListener('input', function(e) {
    var card = e.target.closest('.trace-card');
    if (!card) return;
    var tid = parseInt(card.dataset.traceId);
    var t = X.traces.find(function(tr){ return tr.id === tid; });
    if (!t) return;
    if (e.target.matches('.color-input')) {
      t.color = e.target.value;
      card.querySelector('.trace-card-header').style.borderLeftColor = t.color;
      X.updateChart();
    } else if (e.target.matches('.name-input')) {
      t.customName = e.target.value;
      X.updateChart();
    }
  });

  dom.lineControls.addEventListener('click', function(e) {
    if (!e.target.matches('.delete-trace')) return;
    var card = e.target.closest('.trace-card');
    var tid = parseInt(card.dataset.traceId);
    var idx = X.traces.findIndex(function(tr){ return tr.id === tid; });
    if (idx !== -1) X.traces.splice(idx, 1);
    X.renderLineControls();
    X.renderPeakControls();
    X.updateChart();
  });

  dom.addTraceBtn.addEventListener('click', function() {
    var id = X.nextId++;
    X.traces.push({
      id: id, yVar: '', yAxis: X.traces.length >= 1 ? 'y2' : 'y',
      color: X.COLORS[id % X.COLORS.length], lineWidth: 1.5, yOffset: 0, yScale: 1,
      customName: ''
    });
    X.renderLineControls();
    X.renderPeakControls();
  });

  X.renderGlobalX = renderGlobalX;
  X.renderLineControls = renderLineControls;
})();
