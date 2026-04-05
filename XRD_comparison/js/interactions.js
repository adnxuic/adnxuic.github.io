(function() {
  'use strict';
  var X = window.XRD;
  var chartDiv = X.dom.chartDiv;

  var dragState = { active: false, traceIndex: -1, curveNumber: -1, startY: 0, startOffset: 0, axisKey: '' };
  var hoveredCurve = -1;
  var rafId = null;
  var scaleDebounce = null;

  function curveToTraceIndex(curveNumber) {
    var cn = 0;
    for (var i = 0; i < X.traces.length; i++) {
      if (X.getVarData(X.globalXVar) && X.getVarData(X.traces[i].yVar)) {
        if (cn === curveNumber) return i;
        cn++;
      }
    }
    return -1;
  }

  function setupDragEvents() {
    chartDiv.on('plotly_hover', function(data) {
      if (dragState.active || X.currentTool !== 'pointer') return;
      hoveredCurve = data.points[0].curveNumber;
      var dl = chartDiv.querySelector('.nsewdrag');
      if (dl) dl.style.cursor = 'ns-resize';
    });

    chartDiv.on('plotly_unhover', function() {
      if (dragState.active || X.currentTool !== 'pointer') return;
      hoveredCurve = -1;
      var dl = chartDiv.querySelector('.nsewdrag');
      if (dl) dl.style.cursor = '';
    });
  }

  chartDiv.addEventListener('wheel', function(e) {
    if (X.currentTool !== 'pointer' || hoveredCurve < 0) return;
    var ti = curveToTraceIndex(hoveredCurve);
    if (ti < 0) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    var factor = e.deltaY > 0 ? 0.9 : 1.1;
    var t = X.traces[ti];
    t.yScale = Math.max(0.001, t.yScale * factor);

    var yRaw = X.getVarData(t.yVar);
    if (yRaw) {
      var newY = yRaw.map(function(v) { return v * t.yScale + t.yOffset; });
      Plotly.restyle(chartDiv, { y: [newY] }, [hoveredCurve]);
    }
    clearTimeout(scaleDebounce);
    scaleDebounce = setTimeout(function() { X.renderLineControls(); }, 300);
  }, { passive: false, capture: true });

  chartDiv.addEventListener('mousedown', function(e) {
    if (X.currentTool !== 'pointer' || hoveredCurve < 0) return;
    var ti = curveToTraceIndex(hoveredCurve);
    if (ti < 0) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    dragState.active = true;
    dragState.traceIndex = ti;
    dragState.curveNumber = hoveredCurve;
    dragState.startY = e.clientY;
    dragState.startOffset = X.traces[ti].yOffset;
    dragState.axisKey = X.traces[ti].yAxis;
    document.body.style.cursor = 'ns-resize';
  }, true);

  document.addEventListener('mousemove', function(e) {
    if (!dragState.active) return;
    e.preventDefault();
    var clientY = e.clientY;
    if (rafId) return;
    rafId = requestAnimationFrame(function() {
      rafId = null;
      var fl = chartDiv._fullLayout;
      if (!fl) return;
      var ax = dragState.axisKey === 'y2' ? fl.yaxis2 : fl.yaxis;
      var plotH = fl._size.h;
      var dataPerPx = (ax.range[1] - ax.range[0]) / plotH;
      var deltaPx = dragState.startY - clientY;
      X.traces[dragState.traceIndex].yOffset = dragState.startOffset + deltaPx * dataPerPx;

      var tDrag = X.traces[dragState.traceIndex];
      var yRaw = X.getVarData(tDrag.yVar);
      if (yRaw) {
        var newY = yRaw.map(function(v) { return v * tDrag.yScale + tDrag.yOffset; });
        Plotly.restyle(chartDiv, { y: [newY] }, [dragState.curveNumber]);
      }
    });
  });

  document.addEventListener('mouseup', function() {
    if (!dragState.active) return;
    dragState.active = false;
    document.body.style.cursor = '';
    var dl = chartDiv.querySelector('.nsewdrag');
    if (dl) dl.style.cursor = '';
    hoveredCurve = -1;
    X.renderLineControls();
  });

  X.setupDragEvents = setupDragEvents;
})();
