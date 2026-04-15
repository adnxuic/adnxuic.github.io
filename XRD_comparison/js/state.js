(function() {
  'use strict';

  var COLORS = ['#1a73e8','#ea4335','#34a853','#9334e6','#fa7b17',
                '#00acc1','#e91e63','#7c4dff','#795548','#607d8b'];

  var $ = function(id) { return document.getElementById(id); };

  window.XRD = {
    COLORS: COLORS,
    $: $,

    dataStore: {},
    traces: [],
    nextId: 0,
    globalXVar: '',
    peakState: {
      traceId: -1, windowSize: 20, threshold: 20, yMin: '', yMax: '', peaks: [],
      lineColor: '#ea4335', lineWidth: 1, lineDash: 'dash',
      labelSize: 9, labelColor: '#c62828', labelAngle: -55, showLabel: true
    },
    pendingImport: [],
    userAnnotations: [],
    nextAnnoId: 0,
    currentTool: 'pointer',
    selectedAnnoId: -1,

    dom: {
      leftPanel:      $('leftPanel'),
      rightPanel:     $('rightPanel'),
      leftToggle:     $('leftToggle'),
      rightToggle:    $('rightToggle'),
      chartDiv:       $('chart'),
      importBtn:      $('importBtn'),
      fileInput:      $('fileInput'),
      importModal:    $('importModal'),
      modalBody:      $('modalBody'),
      confirmImportBtn: $('confirmImportBtn'),
      cancelImportBtn:  $('cancelImportBtn'),
      closeModalBtn:    $('closeModalBtn'),
      variableTree:   $('variableTree'),
      lineControls:   $('lineControls'),
      addTraceBtn:    $('addTraceBtn'),
      peakControlsDiv: $('peakControls'),
      globalXSelect:  $('globalXSelect'),
      yLeftTitleInput:  $('yLeftTitle'),
      yRightTitleInput: $('yRightTitle'),
      toolbar:        $('toolbar')
    },

    esc: function(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },

    detectDelimiter: function(lines) {
      var sample = lines.slice(0, 10).join('\n');
      if (sample.indexOf('\t') !== -1) return 'tab';
      if (sample.indexOf(',') !== -1) return 'comma';
      return 'space';
    },

    splitLine: function(line, delim) {
      if (delim === 'tab') return line.split('\t').filter(function(s){ return s !== ''; });
      if (delim === 'comma') return line.split(',').filter(function(s){ return s !== ''; });
      return line.trim().split(/\s+/);
    },

    isDataLine: function(parts) {
      return parts.length > 0 && parts.every(function(p) {
        return p.trim() !== '' && !isNaN(Number(p));
      });
    },

    parseFile: function(text) {
      var self = this;
      var rawLines = text.split(/\r?\n/).filter(function(l){ return l.trim() !== ''; });
      if (rawLines.length === 0) return null;

      var delim = self.detectDelimiter(rawLines);

      // 找到第一行全为数值的行，自动跳过之前所有表头行
      var dataStartIdx = 0;
      for (var i = 0; i < rawLines.length; i++) {
        var parts = self.splitLine(rawLines[i], delim);
        if (self.isDataLine(parts)) {
          dataStartIdx = i;
          break;
        }
      }

      var skippedRows = dataStartIdx;
      var hasHeader = skippedRows > 0;
      var headerNames = null;

      // 仅当只有一行表头时，将其作为列名
      if (skippedRows === 1) {
        headerNames = self.splitLine(rawLines[0], delim);
      }

      var dataLines = rawLines.slice(dataStartIdx);
      var rows = dataLines.map(function(l){ return self.splitLine(l, delim).map(Number); });
      rows = rows.filter(function(row){
        return row.length > 0 && row.every(function(v){ return !isNaN(v); });
      });

      var numCols = 0;
      for (var r = 0; r < rows.length; r++) {
        if (rows[r].length > numCols) numCols = rows[r].length;
      }

      var columns = [];
      for (var c = 0; c < numCols; c++) {
        columns.push({
          name: (headerNames && headerNames[c]) ? headerNames[c] : 'Col_' + (c + 1),
          data: rows.map(function(row){ return c < row.length ? row[c] : NaN; })
        });
      }
      return {
        columns: columns,
        totalRows: rows.length,
        previewRows: rows.slice(0, 10),
        numCols: numCols,
        delim: delim,
        hasHeader: hasHeader,
        skippedRows: skippedRows
      };
    },

    getVarData: function(key) {
      if (!key) return null;
      var sep = key.lastIndexOf('::');
      if (sep === -1) return null;
      var fn = key.substring(0, sep);
      var ci = parseInt(key.substring(sep + 2));
      var f = this.dataStore[fn];
      if (f && f.columns[ci]) return f.columns[ci].data;
      return null;
    },

    getVarLabel: function(key) {
      if (!key) return '';
      var sep = key.lastIndexOf('::');
      var fn = key.substring(0, sep);
      var ci = parseInt(key.substring(sep + 2));
      var f = this.dataStore[fn];
      if (f && f.columns[ci]) return fn + ' > ' + f.columns[ci].name;
      return key;
    },

    buildOptions: function(selected) {
      var html = '<option value="">-- \u9009\u62E9\u53D8\u91CF --</option>';
      for (var fn in this.dataStore) {
        var fd = this.dataStore[fn];
        for (var i = 0; i < fd.columns.length; i++) {
          var val = fn + '::' + i;
          html += '<option value="' + this.esc(val) + '"' +
                  (val === selected ? ' selected' : '') + '>' +
                  this.esc(fn + ' > ' + fd.columns[i].name) + '</option>';
        }
      }
      return html;
    }
  };
})();
