/* export.js — Export & Import — fully localStorage-backed */
(function () {
  const main = document.getElementById('main-content');

  async function getRooms() {
    try { return await window.RoomCache.getRooms(); } catch { return []; }
  }

  main.innerHTML = `
    <div class="page-header animate-in">
      <h1>Export &amp; Import</h1>
      <p>Back up, restore, and share your resort data</p>
    </div>
    <div class="page-content">

      <div class="section-heading animate-in"><h3>Current Data Snapshot</h3></div>
      <div class="data-chips animate-in" id="data-chips"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;" id="export-grid">

        <!-- JSON Export -->
        <div class="export-card animate-in">
          <div class="export-card__accent"></div>
          <span class="export-card__icon">⬇</span>
          <h2 class="export-card__title">JSON Export</h2>
          <p class="export-card__desc">Download all data as a single structured <code>.json</code> file — guests, bookings, rooms, menu, orders, events, and history.</p>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn btn--primary" id="export-all-btn">⬇ Export All Data</button>
            <button class="btn btn--gold" id="sync-supabase-btn">☁ Sync Local to Cloud</button>
            <button class="btn btn--ghost btn--sm" id="export-bookings-btn">Bookings only</button>
            <button class="btn btn--ghost btn--sm" id="export-guests-btn">Guests only</button>
          </div>
          <div id="export-success" style="margin-top:0.75rem;font-size:0.82rem;color:var(--green);display:none;">✓ File downloaded successfully.</div>
        </div>

        <!-- Google Docs -->
        <div class="export-card animate-in animate-in-delay-1">
          <div class="export-card__accent" style="background:var(--teal-dim);"></div>
          <span class="export-card__icon">📄</span>
          <h2 class="export-card__title">Google Docs Export</h2>
          <p class="export-card__desc">Generate a formatted stay-history report and share via Google Docs. Select a date range to include.</p>
          <div class="form-grid form-grid--2" style="margin-bottom:1rem;">
            <div class="form-group">
              <label class="form-label" for="gdocs-from">From Date</label>
              <input class="form-input" type="date" id="gdocs-from">
            </div>
            <div class="form-group">
              <label class="form-label" for="gdocs-to">To Date</label>
              <input class="form-input" type="date" id="gdocs-to">
            </div>
          </div>
          <button class="btn btn--teal" id="gdocs-export-btn">📄 Export to Google Docs</button>
          <div class="fake-link-field" id="fake-gdocs-link">
            <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.3rem;">Shareable report link (demo):</div>
            https://docs.google.com/document/d/1fGrAnde-Mist-Report-DEMO-2026/edit?usp=sharing
            <button class="btn btn--sm btn--ghost" style="margin-left:0.5rem;"
              onclick="navigator.clipboard.writeText('https://docs.google.com/document/d/1fGrAnde-Mist-Report-DEMO-2026').then(()=>GM.toast('Link copied!','success'))">Copy</button>
          </div>
        </div>

        <!-- JSON Import -->
        <div class="export-card animate-in animate-in-delay-2" style="grid-column:1/-1;">
          <span class="export-card__icon">⬆</span>
          <h2 class="export-card__title">JSON Import</h2>
          <p class="export-card__desc">Upload a previously exported <code>.json</code> file. The system will validate its structure, show a preview, and restore all data to localStorage.</p>

          <div class="upload-zone" id="import-zone" style="max-width:480px;">
            <input type="file" id="import-file" accept=".json,application/json">
            <div class="upload-zone__icon">📂</div>
            <div class="upload-zone__label">Click to select a JSON file</div>
            <div class="upload-zone__sub">Only .json files are accepted</div>
          </div>

          <div id="import-error" style="color:var(--red);font-size:0.82rem;margin-top:0.5rem;display:none;"></div>

          <div class="json-preview-wrap" id="json-preview-wrap">
            <div class="json-preview-header">
              <span id="json-preview-label">Preview</span>
              <span id="json-preview-count"></span>
            </div>
            <div class="json-preview-table">
              <table id="json-preview-table">
                <thead><tr id="json-preview-thead"></tr></thead>
                <tbody id="json-preview-tbody"></tbody>
              </table>
            </div>
          </div>

          <div id="import-actions" style="display:none;margin-top:1rem;">
            <button class="btn btn--primary" id="import-confirm-btn">✓ Confirm Import</button>
            <button class="btn btn--ghost btn--sm" id="import-cancel-btn" style="margin-left:0.5rem;">Cancel</button>
          </div>
        </div>

      </div>
    </div>
  `;

  // Populate data chips
  async function populateChips() {
    const rooms = await getRooms();
    const chips = [
      { label: 'Guests', count: MockData.guests.length, icon: '👤' },
      { label: 'Bookings', count: MockData.bookings.length, icon: '📋' },
      { label: 'Rooms', count: rooms.length, icon: '🏠' },
      { label: 'Menu Items', count: MockData.menu.length, icon: '🍽' },
      { label: 'Events', count: MockData.events.length, icon: '🎉' },
      { label: 'History', count: MockData.history.length, icon: '🕐' },
      { label: 'Orders', count: MockData.orders.length, icon: '🧾' },
    ];
    document.getElementById('data-chips').innerHTML = chips.map(c =>
      `<div class="data-chip">${c.icon} ${c.label}: <strong>${c.count}</strong></div>`).join('');
  }
  populateChips();

  // Export helpers
  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    const s = document.getElementById('export-success'); s.style.display = 'block';
    setTimeout(() => s.style.display = 'none', 3000);
  }

  document.getElementById('export-all-btn').addEventListener('click', async () => {
    const btn = document.getElementById('export-all-btn');
    GM.btnLoading(btn, true);
    const rooms = await getRooms();
    setTimeout(() => {
      GM.btnLoading(btn, false);
      downloadJSON({
        exportedAt: new Date().toISOString(), resort: 'The Grande Mist', version: '2.0',
        data: {
          rooms,
          guests: MockData.guests,
          bookings: MockData.bookings,
          menu: MockData.menu,
          orders: MockData.orders,
          events: MockData.events,
          history: MockData.history,
        }
      }, `grande-mist-export-${new Date().toISOString().slice(0, 10)}.json`);
      GM.toast('Full data exported as JSON!', 'success');
    }, 800);
  });

  document.getElementById('sync-supabase-btn').addEventListener('click', async () => {
    const btn = document.getElementById('sync-supabase-btn');
    GM.confirm('Sync All Data to Cloud',
      'This will take all data from this browser\'s local storage (guests, bookings, menu, etc.) and save it to the Supabase cloud. Are you sure?',
      async () => {
        GM.btnLoading(btn, true);
        try {
          const snapshot = {
            guests: MockData.guests,
            bookings: MockData.bookings,
            menu: MockData.menu,
            events: MockData.events,
            history: MockData.history,
          };
          MockData.importData(snapshot);
          GM.toast('Cloud sync initiated!', 'info');
          setTimeout(() => {
            GM.btnLoading(btn, false);
            GM.toast('✓ All data successfully synced to cloud.', 'success');
          }, 3000);
        } catch (err) {
          GM.btnLoading(btn, false);
          GM.toast('❌ Cloud sync failed: ' + err.message, 'error');
        }
      }, 'Sync to Cloud');
  });

  document.getElementById('export-bookings-btn').addEventListener('click', () => {
    downloadJSON({ exportedAt: new Date().toISOString(), bookings: MockData.bookings }, `grande-mist-bookings-${new Date().toISOString().slice(0, 10)}.json`);
    GM.toast('Bookings exported.', 'success');
  });

  document.getElementById('export-guests-btn').addEventListener('click', () => {
    downloadJSON({ exportedAt: new Date().toISOString(), guests: MockData.guests }, `grande-mist-guests-${new Date().toISOString().slice(0, 10)}.json`);
    GM.toast('Guests exported.', 'success');
  });

  // Google Docs (mock)
  document.getElementById('gdocs-export-btn').addEventListener('click', () => {
    const btn = document.getElementById('gdocs-export-btn');
    const from = document.getElementById('gdocs-from').value;
    const to = document.getElementById('gdocs-to').value;
    if (!from || !to) { GM.toast('Please select a date range.', 'error'); return; }
    GM.btnLoading(btn, true);
    setTimeout(() => {
      GM.btnLoading(btn, false);
      document.getElementById('fake-gdocs-link').classList.add('show');
      GM.toast('Report exported to Google Docs! (demo link generated)', 'success');
    }, 1500);
  });

  // JSON Import
  const importFile = document.getElementById('import-file');
  const previewWrap = document.getElementById('json-preview-wrap');
  const previewLabel = document.getElementById('json-preview-label');
  const previewCount = document.getElementById('json-preview-count');
  const previewThead = document.getElementById('json-preview-thead');
  const previewTbody = document.getElementById('json-preview-tbody');
  const importActions = document.getElementById('import-actions');
  const importError = document.getElementById('import-error');

  let parsedImport = null;

  importFile.addEventListener('change', () => {
    const file = importFile.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      importError.textContent = 'Only .json files are accepted.'; importError.style.display = 'block'; return;
    }
    importError.style.display = 'none';
    const reader = new FileReader();
    reader.onload = e => {
      let parsed;
      try { parsed = JSON.parse(e.target.result); }
      catch (err) {
        importError.textContent = '❌ Invalid JSON: ' + err.message; importError.style.display = 'block';
        previewWrap.classList.remove('show'); importActions.style.display = 'none'; return;
      }
      parsedImport = parsed.data || parsed;
      const arrays = Object.entries(parsedImport).filter(([, v]) => Array.isArray(v) && v.length > 0);
      if (!arrays.length) {
        importError.textContent = '❌ No recognisable data arrays found in this JSON.';
        importError.style.display = 'block'; previewWrap.classList.remove('show'); importActions.style.display = 'none'; return;
      }
      const [key, rows] = arrays[0];
      const cols = Object.keys(rows[0]).slice(0, 6);
      previewLabel.textContent = `Preview — detected: ${arrays.map(([k, v]) => `${k}: ${v.length}`).join(', ')}`;
      previewCount.textContent = `First 8 rows of "${key}"`;
      previewThead.innerHTML = cols.map(c => `<th>${c}</th>`).join('');
      previewTbody.innerHTML = rows.slice(0, 8).map(row =>
        `<tr>${cols.map(c => `<td style="font-size:0.8rem;">${String(row[c] ?? '—').slice(0, 40)}</td>`).join('')}</tr>`).join('');
      previewWrap.classList.add('show'); importActions.style.display = 'flex';
    };
    reader.readAsText(file);
  });

  document.getElementById('import-confirm-btn').addEventListener('click', async () => {
    if (!parsedImport) return;
    const btn = document.getElementById('import-confirm-btn');
    GM.btnLoading(btn, true);
    setTimeout(async () => {
      // Import non-room data via MockData
      MockData.importData(parsedImport);
      // Import rooms via RoomCache if present
      if (parsedImport.rooms && Array.isArray(parsedImport.rooms)) {
        await window.RoomCache.saveRooms(parsedImport.rooms);
      }
      GM.btnLoading(btn, false);
      GM.toast('Data imported successfully! All pages now reflect the restored data.', 'success');
      importActions.style.display = 'none'; previewWrap.classList.remove('show'); importFile.value = '';
      parsedImport = null;
      await populateChips();
    }, 1200);
  });

  document.getElementById('import-cancel-btn').addEventListener('click', () => {
    previewWrap.classList.remove('show'); importActions.style.display = 'none'; importFile.value = '';
    parsedImport = null;
  });

  // Responsive grid
  const exportGrid = document.getElementById('export-grid');
  function handleResize() {
    if (exportGrid) exportGrid.style.gridTemplateColumns = window.innerWidth < 768 ? '1fr' : '1fr 1fr';
  }
  window.addEventListener('resize', handleResize);
  handleResize();
  window.__gmPageCleanup = () => window.removeEventListener('resize', handleResize);
})();
