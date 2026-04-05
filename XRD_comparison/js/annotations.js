(function() {
  'use strict';
  var X = window.XRD;
  var chartDiv = X.dom.chartDiv;
  var toolbar = X.dom.toolbar;
  var drawState = { active: false, startX: 0, startY: 0 };

  function pixelToPaper(px, py) {
    var fl = chartDiv._fullLayout;
    if (!fl) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (px - fl._size.l) / fl._size.w)),
      y: Math.max(0, Math.min(1, 1 - (py - fl._size.t) / fl._size.h))
    };
  }

  function getChartRelPos(e) {
    var rect = chartDiv.getBoundingClientRect();
    return { px: e.clientX - rect.left, py: e.clientY - rect.top };
  }

  function isInsidePlotArea(px, py) {
    var fl = chartDiv._fullLayout;
    if (!fl) return false;
    return px >= fl._size.l && px <= fl._size.l + fl._size.w &&
           py >= fl._size.t && py <= fl._size.t + fl._size.h;
  }

  function pointToSegmentDist(px, py, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x0) * (px - x0) + (py - y0) * (py - y0));
    var t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / lenSq));
    var projX = x0 + t * dx, projY = y0 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  function annoIdFromIndex(plotlyIndex) {
    var peakCount = X.peakState.showLabel ? X.peakState.peaks.length : 0;
    var userIdx = plotlyIndex - peakCount;
    if (userIdx < 0) return -1;
    var count = 0;
    for (var i = 0; i < X.userAnnotations.length; i++) {
      var a = X.userAnnotations[i];
      if (a.type === 'text' || a.type === 'arrow') {
        if (count === userIdx) return a.id;
        count++;
      }
    }
    return -1;
  }

  function shapeIdFromIndex(plotlyIndex) {
    var peakCount = X.peakState.peaks.length;
    var userIdx = plotlyIndex - peakCount;
    if (userIdx < 0) return -1;
    var count = 0;
    for (var i = 0; i < X.userAnnotations.length; i++) {
      if (X.userAnnotations[i].type === 'line') {
        if (count === userIdx) return X.userAnnotations[i].id;
        count++;
      }
    }
    return -1;
  }

  toolbar.addEventListener('click', function(e) {
    var btn = e.target.closest('.tool-btn');
    if (!btn) return;
    var tool = btn.dataset.tool;
    if (tool) {
      X.currentTool = tool;
      toolbar.querySelectorAll('.tool-btn[data-tool]').forEach(function(b) {
        b.classList.toggle('active', b.dataset.tool === tool);
      });
      var dl = chartDiv.querySelector('.nsewdrag');
      if (dl) dl.style.cursor = tool === 'pointer' ? '' : 'crosshair';
    }
    if (btn.id === 'deleteAnnoBtn') {
      if (X.selectedAnnoId >= 0) {
        X.userAnnotations = X.userAnnotations.filter(function(a) { return a.id !== X.selectedAnnoId; });
        X.selectedAnnoId = -1;
        X.updateChart();
      }
    }
    if (btn.id === 'clearAnnoBtn') {
      X.userAnnotations = [];
      X.selectedAnnoId = -1;
      X.updateChart();
    }
  });

  chartDiv.addEventListener('mousedown', function(e) {
    if (X.currentTool === 'pointer') return;
    var pos = getChartRelPos(e);
    if (!isInsidePlotArea(pos.px, pos.py)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    if (X.currentTool === 'text') {
      var paper = pixelToPaper(pos.px, pos.py);
      var anno = { id: X.nextAnnoId++, type: 'text', x: paper.x, y: paper.y, text: '\u6587\u5B57', fontSize: 14, color: '#333' };
      X.userAnnotations.push(anno);
      X.selectedAnnoId = anno.id;
      X.updateChart();
      setTimeout(function() { startInlineEdit(anno); }, 50);
      return;
    }

    if (X.currentTool === 'arrow' || X.currentTool === 'line') {
      drawState.active = true;
      drawState.startX = pos.px;
      drawState.startY = pos.py;
    }
  }, true);

  document.addEventListener('mousemove', function(e) {
    if (!drawState.active) return;
    e.preventDefault();
  });

  document.addEventListener('mouseup', function(e) {
    if (!drawState.active) return;
    drawState.active = false;

    var pos = getChartRelPos(e);
    var s = pixelToPaper(drawState.startX, drawState.startY);
    var end = pixelToPaper(pos.px, pos.py);

    var dx = pos.px - drawState.startX;
    var dy = pos.py - drawState.startY;
    if (Math.sqrt(dx * dx + dy * dy) < 8) return;

    if (X.currentTool === 'arrow') {
      var anno = {
        id: X.nextAnnoId++, type: 'arrow',
        x: end.x, y: end.y, ax: s.x, ay: s.y,
        text: '', fontSize: 12, color: '#333'
      };
      X.userAnnotations.push(anno);
      X.selectedAnnoId = anno.id;
      X.updateChart();
    } else if (X.currentTool === 'line') {
      var shape = {
        id: X.nextAnnoId++, type: 'line',
        x0: s.x, y0: s.y, x1: end.x, y1: end.y,
        color: '#333', lineWidth: 2
      };
      X.userAnnotations.push(shape);
      X.selectedAnnoId = shape.id;
      X.updateChart();
    }
  });

  var lastAnnoClickTime = 0;
  var lastAnnoClickId = -1;

  function setupAnnoEvents() {
    chartDiv.on('plotly_clickannotation', function(evData) {
      var id = annoIdFromIndex(evData.index);
      if (id < 0) return;
      var now = Date.now();

      if (id === lastAnnoClickId && now - lastAnnoClickTime < 500) {
        lastAnnoClickTime = 0;
        lastAnnoClickId = -1;
        var ua = X.userAnnotations.find(function(u) { return u.id === id; });
        if (ua) {
          X.selectedAnnoId = id;
          X.updateChart();
          setTimeout(function() { startInlineEdit(ua); }, 80);
        }
      } else {
        lastAnnoClickId = id;
        lastAnnoClickTime = now;
        X.selectedAnnoId = id;
        X.updateChart();
      }
    });

    chartDiv.on('plotly_relayout', function(relayoutData) {
      if (!relayoutData) return;
      Object.keys(relayoutData).forEach(function(k) {
        var m;
        m = k.match(/^annotations\[(\d+)\]\.(.+)$/);
        if (m) {
          var id = annoIdFromIndex(parseInt(m[1]));
          if (id < 0) return;
          var ua = X.userAnnotations.find(function(u) { return u.id === id; });
          if (ua) {
            var prop = m[2], val = relayoutData[k];
            if (prop === 'x') ua.x = val;
            if (prop === 'y') ua.y = val;
            if (prop === 'ax') ua.ax = val;
            if (prop === 'ay') ua.ay = val;
          }
        }
        m = k.match(/^shapes\[(\d+)\]\.(.+)$/);
        if (m) {
          var id = shapeIdFromIndex(parseInt(m[1]));
          if (id < 0) return;
          var ua = X.userAnnotations.find(function(u) { return u.id === id; });
          if (ua && ua.type === 'line') {
            var prop = m[2], val = relayoutData[k];
            if (prop === 'x0') ua.x0 = val;
            if (prop === 'y0') ua.y0 = val;
            if (prop === 'x1') ua.x1 = val;
            if (prop === 'y1') ua.y1 = val;
          }
        }
      });
    });
  }

  function startInlineEdit(anno) {
    var fl = chartDiv._fullLayout;
    if (!fl) return;
    var rect = chartDiv.getBoundingClientRect();
    var cx = fl._size.l + anno.x * fl._size.w;
    var cy = fl._size.t + (1 - anno.y) * fl._size.h;

    var existing = document.querySelector('.anno-editor');
    if (existing) existing.remove();

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'anno-editor';
    input.value = anno.text || '';
    input.style.left = (rect.left + cx - 30) + 'px';
    input.style.top = (rect.top + cy - 14 + window.scrollY) + 'px';
    document.body.appendChild(input);
    input.focus();
    input.select();

    function finish() {
      anno.text = input.value || '\u6587\u5B57';
      input.remove();
      X.updateChart();
    }
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.blur(); }
    });
  }

  chartDiv.addEventListener('click', function(e) {
    if (X.currentTool !== 'pointer') return;
    var pos = getChartRelPos(e);
    if (!isInsidePlotArea(pos.px, pos.py)) return;
    var paper = pixelToPaper(pos.px, pos.py);

    var clickedLine = false;
    X.userAnnotations.forEach(function(a) {
      if (a.type !== 'line') return;
      var dist = pointToSegmentDist(paper.x, paper.y, a.x0, a.y0, a.x1, a.y1);
      if (dist < 0.02) {
        X.selectedAnnoId = a.id;
        clickedLine = true;
      }
    });
    if (clickedLine) X.updateChart();
  }, false);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' && X.selectedAnnoId >= 0 && document.activeElement === document.body) {
      X.userAnnotations = X.userAnnotations.filter(function(a) { return a.id !== X.selectedAnnoId; });
      X.selectedAnnoId = -1;
      X.updateChart();
    }
  });

  X.setupAnnoEvents = setupAnnoEvents;
})();
