(function() {
  'use strict';
  var X = window.XRD;
  var dom = X.dom;

  function calcRawRange(axisKey) {
    var min = Infinity, max = -Infinity, found = false;
    X.traces.forEach(function(t) {
      if (t.yAxis !== axisKey) return;
      var yRaw = X.getVarData(t.yVar);
      if (!yRaw) return;
      for (var i = 0; i < yRaw.length; i++) {
        if (isNaN(yRaw[i])) continue;
        if (yRaw[i] < min) min = yRaw[i];
        if (yRaw[i] > max) max = yRaw[i];
        found = true;
      }
    });
    if (!found) return null;
    var span = max - min || 1;
    return [min - span * 0.05, max + span * 0.05];
  }

  function getAxisTitle(axisKey) {
    var custom = axisKey === 'y' ? dom.yLeftTitleInput.value.trim() : dom.yRightTitleInput.value.trim();
    if (custom) return custom;
    var names = [];
    X.traces.forEach(function(t) {
      if (t.yAxis !== axisKey || !t.yVar) return;
      var sep = t.yVar.lastIndexOf('::');
      var fn = t.yVar.substring(0, sep);
      var ci = parseInt(t.yVar.substring(sep + 2));
      var f = X.dataStore[fn];
      var name = (f && f.columns[ci]) ? f.columns[ci].name : t.yVar;
      if (names.indexOf(name) === -1) names.push(name);
    });
    if (names.length === 0) return axisKey === 'y' ? 'Y\u5DE6' : 'Y\u53F3';
    return names.join(', ');
  }

  function getLayout() {
    var yRange = calcRawRange('y');
    var y2Range = calcRawRange('y2');

    var xTitle = '';
    if (X.globalXVar) {
      var sep = X.globalXVar.lastIndexOf('::');
      var fn = X.globalXVar.substring(0, sep);
      var ci = parseInt(X.globalXVar.substring(sep + 2));
      var f = X.dataStore[fn];
      xTitle = (f && f.columns[ci]) ? f.columns[ci].name : X.globalXVar;
    }

    var layout = {
      paper_bgcolor: '#fff',
      plot_bgcolor: '#fff',
      margin: { l: 55, r: 55, t: 15, b: 45 },
      font: { family: '-apple-system, Segoe UI, sans-serif', color: '#333', size: 12 },
      xaxis: {
        gridcolor: '#e8e8e8', zerolinecolor: '#ccc', linecolor: '#ccc',
        title: { text: xTitle || '2\u03B8 (\u00B0)', font: { size: 12 } }
      },
      yaxis: {
        gridcolor: '#e8e8e8', zerolinecolor: '#ccc', linecolor: '#ccc',
        title: { text: getAxisTitle('y'), font: { size: 12, color: '#1a73e8' } },
        autorange: !yRange,
        range: yRange
      },
      yaxis2: {
        overlaying: 'y', side: 'right', showgrid: false,
        linecolor: '#ccc', zerolinecolor: '#ccc',
        title: { text: getAxisTitle('y2'), font: { size: 12, color: '#ea4335' } },
        autorange: !y2Range,
        range: y2Range
      },
      legend: {
        bgcolor: 'rgba(255,255,255,0.9)', bordercolor: '#d8dce3', borderwidth: 1,
        font: { size: 11 }
      },
      hovermode: 'x unified',
      shapes: [],
      annotations: []
    };

    var ps = X.peakState;
    if (ps.peaks.length > 0) {
      layout.shapes = ps.peaks.map(function(p) {
        return {
          type: 'line', x0: p.x, x1: p.x, y0: 0, y1: 1, yref: 'paper',
          line: { color: ps.lineColor, width: ps.lineWidth, dash: ps.lineDash }
        };
      });
      if (ps.showLabel) {
        layout.annotations = ps.peaks.map(function(p) {
          return {
            x: p.x, xref: 'x',
            y: 0.96, yref: 'paper',
            text: p.x.toFixed(2),
            showarrow: false,
            font: { size: ps.labelSize, color: ps.labelColor },
            textangle: ps.labelAngle,
            xanchor: 'center',
            yanchor: 'middle',
            yshift: 0
          };
        });
      }
    }

    X.userAnnotations.forEach(function(a) {
      if (a.type === 'text') {
        layout.annotations.push({
          x: a.x, y: a.y, xref: 'paper', yref: 'paper',
          text: a.text || '\u6587\u5B57',
          showarrow: false,
          font: { size: a.fontSize || 14, color: a.color || '#333' },
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: X.selectedAnnoId === a.id ? '#1a73e8' : '#ccc',
          borderwidth: X.selectedAnnoId === a.id ? 2 : 1,
          borderpad: 3,
          captureevents: true
        });
      } else if (a.type === 'arrow') {
        layout.annotations.push({
          x: a.x, y: a.y, xref: 'paper', yref: 'paper',
          ax: a.ax, ay: a.ay, axref: 'paper', ayref: 'paper',
          text: a.text || '',
          showarrow: true,
          arrowhead: 2, arrowsize: 1.3, arrowwidth: 2,
          arrowcolor: a.color || '#333',
          font: { size: a.fontSize || 12, color: a.color || '#333' },
          bgcolor: a.text ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0)',
          bordercolor: X.selectedAnnoId === a.id ? '#1a73e8' : (a.text ? '#ccc' : 'rgba(0,0,0,0)'),
          borderwidth: X.selectedAnnoId === a.id ? 2 : (a.text ? 1 : 0),
          borderpad: 2,
          captureevents: true
        });
      } else if (a.type === 'line') {
        layout.shapes.push({
          type: 'line',
          x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1,
          xref: 'paper', yref: 'paper',
          line: {
            color: X.selectedAnnoId === a.id ? '#1a73e8' : (a.color || '#333'),
            width: a.lineWidth || 2
          }
        });
      }
    });

    return layout;
  }

  function updateChart() {
    var chartDiv = dom.chartDiv;
    var xData = X.getVarData(X.globalXVar);
    var data = [];
    X.traces.forEach(function(t, i) {
      var yRaw = X.getVarData(t.yVar);
      if (!xData || !yRaw) return;
      var sc = t.yScale, off = t.yOffset;
      var yData = (sc !== 1 || off !== 0)
        ? yRaw.map(function(v){ return v * sc + off; })
        : yRaw;
      var autoLabel = t.yVar ? X.getVarLabel(t.yVar) : ('\u7EBF\u6761 ' + (i + 1));
      data.push({
        x: xData, y: yData,
        type: 'scatter', mode: 'lines',
        name: t.customName || autoLabel, yaxis: t.yAxis,
        line: { color: t.color, width: t.lineWidth }
      });
    });
    Plotly.react(chartDiv, data, getLayout(), {
      responsive: true,
      displaylogo: false,
      doubleClick: false,
      edits: {
        legendPosition: true,
        annotationPosition: true,
        annotationTail: true,
        shapePosition: true
      }
    });
  }

  X.updateChart = updateChart;
})();
