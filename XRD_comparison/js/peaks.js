(function() {
  'use strict';
  var X = window.XRD;
  var dom = X.dom;

  function findPeaks(yData, xData, windowSize, thresholdPct, customMin, customMax) {
    var autoMax = -Infinity, autoMin = Infinity;
    for (var i = 0; i < yData.length; i++) {
      if (!isNaN(yData[i])) {
        if (yData[i] > autoMax) autoMax = yData[i];
        if (yData[i] < autoMin) autoMin = yData[i];
      }
    }
    var minY = (customMin !== '' && !isNaN(customMin)) ? Number(customMin) : autoMin;
    var maxY = (customMax !== '' && !isNaN(customMax)) ? Number(customMax) : autoMax;
    var threshold = minY + (maxY - minY) * (thresholdPct / 100);
    var peaks = [];
    var halfW = Math.floor(windowSize / 2);

    for (var i = halfW; i < yData.length - halfW; i++) {
      if (isNaN(yData[i]) || yData[i] < threshold) continue;
      var isMax = true;
      for (var j = i - halfW; j <= i + halfW; j++) {
        if (j !== i && yData[j] >= yData[i]) { isMax = false; break; }
      }
      if (isMax) peaks.push({ x: xData[i], y: yData[i] });
    }
    return peaks;
  }

  function renderPeakControls() {
    var ps = X.peakState;
    var traceOpts = '<option value="-1">-- \u9009\u62E9\u7EBF\u6761 --</option>';
    X.traces.forEach(function(t, i) {
      var label = t.yVar ? X.getVarLabel(t.yVar) : ('\u7EBF\u6761 ' + (i + 1));
      traceOpts += '<option value="' + t.id + '"' +
                   (ps.traceId === t.id ? ' selected' : '') + '>' +
                   X.esc(label) + '</option>';
    });

    dom.peakControlsDiv.innerHTML =
      '<div class="peak-info">' +
      '<div class="peak-info-title">\u7B97\u6CD5\u8BF4\u660E</div>' +
      '<p>\u5C40\u90E8\u6781\u5927\u503C\u5BFB\u5CF0\uFF1A\u5728\u6307\u5B9A\u7A97\u53E3\u8303\u56F4\u5185\uFF0C\u627E\u5230 Y \u503C\u5927\u4E8E\u6240\u6709\u76F8\u90BB\u70B9\u7684\u4F4D\u7F6E\uFF0C\u5E76\u8FC7\u6EE4\u4F4E\u4E8E\u9608\u503C\u7684\u5C0F\u5CF0\u3002</p>' +
      '</div>' +
      '<div class="ctrl-row"><label>\u5206\u6790\u7EBF\u6761</label>' +
      '<select id="peakTraceSelect" class="ctrl-select">' + traceOpts + '</select></div>' +
      '<div class="peak-param-hint">\u9009\u62E9\u8981\u5BFB\u5CF0\u7684\u66F2\u7EBF\uFF08\u4F7F\u7528\u539F\u59CB\u6570\u636E\uFF09</div>' +
      '<div class="ctrl-row"><label>\u7A97\u53E3\u5927\u5C0F</label>' +
      '<input type="number" id="peakWS" class="ctrl-num" value="' + ps.windowSize +
      '" min="3" max="500" step="1"></div>' +
      '<div class="peak-param-hint">\u5DE6\u53F3\u5404\u53D6 \u7A97\u53E3/2 \u4E2A\u70B9\u4F5C\u4E3A\u90BB\u57DF\uFF0C\u503C\u8D8A\u5927\u5BFB\u5230\u7684\u5CF0\u8D8A\u5BBD\u3001\u8D8A\u5C11</div>' +
      '<div class="ctrl-row"><label>Ymin</label>' +
      '<input type="number" id="peakYMin" class="ctrl-num" value="' + ps.yMin +
      '" step="any" placeholder="\u81EA\u52A8"></div>' +
      '<div class="peak-param-hint">\u9608\u503C\u8D77\u7B97\u70B9\uFF0C\u7A7A=\u81EA\u52A8\u53D6\u6570\u636E\u6700\u5C0F\u503C</div>' +
      '<div class="ctrl-row"><label>Ymax</label>' +
      '<input type="number" id="peakYMax" class="ctrl-num" value="' + ps.yMax +
      '" step="any" placeholder="\u81EA\u52A8"></div>' +
      '<div class="peak-param-hint">\u9608\u503C\u7EC8\u70B9\uFF0C\u7A7A=\u81EA\u52A8\u53D6\u6570\u636E\u6700\u5927\u503C\uFF0C\u8303\u56F4=Ymax\u2212Ymin</div>' +
      '<div class="ctrl-row"><label>\u9608\u503C %</label>' +
      '<div class="peak-threshold-wrap">' +
      '<input type="range" id="peakTH" class="ctrl-range" min="0" max="100" value="' +
      ps.threshold + '">' +
      '<span id="thVal">' + ps.threshold + '%</span>' +
      '</div></div>' +
      '<div class="peak-param-hint">\u53EA\u4FDD\u7559 Y \u2265 Ymin + (Ymax\u2212Ymin)\u00D7\u9608\u503C% \u7684\u5CF0</div>' +
      '<div class="section-header" style="margin-top:12px">\u6807\u6CE8\u6837\u5F0F</div>' +
      '<div class="ctrl-row"><label>\u7EBF\u989C\u8272</label>' +
      '<input type="color" id="peakLineColor" class="ctrl-color" value="' + ps.lineColor + '"></div>' +
      '<div class="ctrl-row"><label>\u7EBF\u5BBD</label>' +
      '<input type="number" id="peakLineWidth" class="ctrl-num" value="' + ps.lineWidth +
      '" min="0.5" max="6" step="0.5"></div>' +
      '<div class="ctrl-row"><label>\u7EBF\u578B</label>' +
      '<select id="peakLineDash" class="ctrl-select">' +
      '<option value="dash"' + (ps.lineDash === 'dash' ? ' selected' : '') + '>\u865A\u7EBF</option>' +
      '<option value="solid"' + (ps.lineDash === 'solid' ? ' selected' : '') + '>\u5B9E\u7EBF</option>' +
      '<option value="dot"' + (ps.lineDash === 'dot' ? ' selected' : '') + '>\u70B9\u7EBF</option>' +
      '<option value="dashdot"' + (ps.lineDash === 'dashdot' ? ' selected' : '') + '>\u70B9\u5212\u7EBF</option>' +
      '</select></div>' +
      '<div class="ctrl-row"><label>\u6807\u7B7E</label>' +
      '<select id="peakShowLabel" class="ctrl-select">' +
      '<option value="1"' + (ps.showLabel ? ' selected' : '') + '>\u663E\u793A</option>' +
      '<option value="0"' + (!ps.showLabel ? ' selected' : '') + '>\u9690\u85CF</option>' +
      '</select></div>' +
      '<div class="ctrl-row"><label>\u5B57\u53F7</label>' +
      '<input type="number" id="peakLabelSize" class="ctrl-num" value="' + ps.labelSize +
      '" min="6" max="24" step="1"></div>' +
      '<div class="ctrl-row"><label>\u5B57\u8272</label>' +
      '<input type="color" id="peakLabelColor" class="ctrl-color" value="' + ps.labelColor + '"></div>' +
      '<div class="ctrl-row"><label>\u89D2\u5EA6</label>' +
      '<input type="number" id="peakLabelAngle" class="ctrl-num" value="' + ps.labelAngle +
      '" min="-90" max="90" step="5"></div>' +
      '<div class="ctrl-row btn-row">' +
      '<button class="btn btn-accent" id="findPeaksBtn">\u6267\u884C\u5BFB\u5CF0</button>' +
      '<button class="btn" id="clearPeaksBtn">\u6E05\u9664\u6807\u6CE8</button></div>' +
      '<div id="peakResults" class="peak-results"></div>';

    X.$('peakTraceSelect').addEventListener('change', function(e) {
      ps.traceId = parseInt(e.target.value);
    });
    X.$('peakWS').addEventListener('change', function(e) {
      ps.windowSize = Math.max(3, parseInt(e.target.value) || 20);
    });
    X.$('peakYMin').addEventListener('change', function(e) {
      ps.yMin = e.target.value === '' ? '' : e.target.value;
    });
    X.$('peakYMax').addEventListener('change', function(e) {
      ps.yMax = e.target.value === '' ? '' : e.target.value;
    });
    X.$('peakTH').addEventListener('input', function(e) {
      ps.threshold = parseInt(e.target.value);
      X.$('thVal').textContent = ps.threshold + '%';
    });
    var styleTimer = null;
    function deferUpdate() {
      clearTimeout(styleTimer);
      styleTimer = setTimeout(function() {
        if (!ps.peaks.length) return;
        if (ps.showLabel) {
          ps.showLabel = false;
          X.updateChart();
          ps.showLabel = true;
        }
        X.updateChart();
      }, 0);
    }
    X.$('peakLineColor').addEventListener('input', function(e) { ps.lineColor = e.target.value; deferUpdate(); });
    X.$('peakLineWidth').addEventListener('change', function(e) { ps.lineWidth = parseFloat(e.target.value) || 1; deferUpdate(); });
    X.$('peakLineDash').addEventListener('change', function(e) { ps.lineDash = e.target.value; deferUpdate(); });
    X.$('peakShowLabel').addEventListener('change', function(e) { ps.showLabel = e.target.value === '1'; deferUpdate(); });
    X.$('peakLabelSize').addEventListener('change', function(e) { var v = parseInt(e.target.value); if (v >= 1) { ps.labelSize = v; deferUpdate(); } });
    X.$('peakLabelColor').addEventListener('input', function(e) { ps.labelColor = e.target.value; deferUpdate(); });
    X.$('peakLabelAngle').addEventListener('change', function(e) { ps.labelAngle = parseInt(e.target.value) || 0; deferUpdate(); });
    X.$('findPeaksBtn').addEventListener('click', doPeakFind);
    X.$('clearPeaksBtn').addEventListener('click', function() {
      ps.peaks = [];
      X.$('peakResults').innerHTML = '';
      X.updateChart();
    });
  }

  function doPeakFind() {
    var ps = X.peakState;
    var t = X.traces.find(function(tr){ return tr.id === ps.traceId; });
    if (!t || !t.yVar || !X.globalXVar) {
      X.$('peakResults').innerHTML = '<div class="text-dim">\u8BF7\u5148\u9009\u62E9 X \u8F74\u6570\u636E\u548C\u6709\u6548\u7684\u7EBF\u6761</div>';
      return;
    }
    var xData = X.getVarData(X.globalXVar);
    var yData = X.getVarData(t.yVar);
    if (!xData || !yData) return;

    ps.peaks = findPeaks(yData, xData, ps.windowSize, ps.threshold, ps.yMin, ps.yMax);

    var resHtml = '<div class="text-dim">\u627E\u5230 ' + ps.peaks.length + ' \u4E2A\u5CF0</div>';
    ps.peaks.forEach(function(p) {
      resHtml += '<div class="peak-item">2\u03B8 = ' + p.x.toFixed(4) + '</div>';
    });
    X.$('peakResults').innerHTML = resHtml;
    X.updateChart();
  }

  X.renderPeakControls = renderPeakControls;
})();
