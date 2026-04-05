(function() {
  'use strict';
  var X = window.XRD;
  var dom = X.dom;

  function toggleLeft() {
    dom.leftPanel.classList.toggle('collapsed');
    dom.leftToggle.innerHTML = dom.leftPanel.classList.contains('collapsed') ? '&#9654;' : '&#9664;';
    setTimeout(function(){ Plotly.Plots.resize(dom.chartDiv); }, 350);
  }

  function toggleRight() {
    dom.rightPanel.classList.toggle('collapsed');
    dom.rightToggle.innerHTML = dom.rightPanel.classList.contains('collapsed') ? '&#9664;' : '&#9654;';
    setTimeout(function(){ Plotly.Plots.resize(dom.chartDiv); }, 350);
  }

  dom.leftToggle.addEventListener('click', toggleLeft);
  dom.rightToggle.addEventListener('click', toggleRight);

  dom.importBtn.addEventListener('click', function() { dom.fileInput.click(); });
  dom.fileInput.addEventListener('change', function(e) {
    if (e.target.files.length) X.handleFiles(e.target.files);
  });

  var dropOverlay = X.$('dropOverlay');

  document.addEventListener('dragenter', function(e) {
    e.preventDefault();
    if (e.dataTransfer.types.indexOf('Files') !== -1) {
      dropOverlay.classList.add('visible');
    }
  });
  dropOverlay.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  dropOverlay.addEventListener('dragleave', function(e) {
    if (e.target === dropOverlay) dropOverlay.classList.remove('visible');
  });
  dropOverlay.addEventListener('drop', function(e) {
    e.preventDefault();
    dropOverlay.classList.remove('visible');
    var files = e.dataTransfer.files;
    if (files.length) X.handleFiles(files);
  });

  dom.globalXSelect.addEventListener('change', function(e) {
    X.globalXVar = e.target.value;
    X.updateChart();
  });

  dom.yLeftTitleInput.addEventListener('input', function() { X.updateChart(); });
  dom.yRightTitleInput.addEventListener('input', function() { X.updateChart(); });

  dom.confirmImportBtn.addEventListener('click', X.confirmImport);
  dom.cancelImportBtn.addEventListener('click', X.closeModal);
  dom.closeModalBtn.addEventListener('click', X.closeModal);
  dom.importModal.querySelector('.modal-overlay').addEventListener('click', X.closeModal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !dom.importModal.classList.contains('hidden')) X.closeModal();
  });

  window.addEventListener('resize', function() {
    Plotly.Plots.resize(dom.chartDiv);
  });

  document.querySelector('.tab-bar').addEventListener('click', function(e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-pane').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    X.$(btn.dataset.tab).classList.add('active');
  });

  X.renderGlobalX();
  X.renderVarTree();
  X.renderLineControls();
  X.renderPeakControls();
  X.updateChart();
  X.setupDragEvents();
  X.setupAnnoEvents();
})();
