/* settings.js — Resort Settings page module */
(function () {
  const main = document.getElementById('main-content');
  const STYLE_ID = 'gm-settings-styles';

  /* ── STORAGE HELPERS ─────────────────────────────────────── */
  const STORAGE_KEY = 'gm_settings';

  const DEFAULTS = {
    resortName: 'The Grande Mist',
    resortAddress: 'Kodaikanal, Dindigul, Tamil Nadu',
    resortPhone: '+91 98765 43210',
    resortEmail: 'info@grandemist.com',
    resortGSTIN: '',
    resortStars: 4,
    showPaymentMethod: true,
    billPrefix: 'GM-2026',
    billFooter: 'Thank you for staying at The Grande Mist!',
  };

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  }

  function getSetting(key) {
    return loadAll()[key] ?? DEFAULTS[key];
  }

  /* ── GLOBAL ACCESSOR (used by checkout.js / history.js) ──── */
  window.GMSettings = { get: getSetting, getAll: loadAll };

  /* ── INJECT STYLES (once, idempotent) ────────────────────── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ══ SETTINGS PAGE ══════════════════════════════════════════ */

/* Room Management */
.room-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.room-list-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.04); padding: 1rem; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08); }
.room-list-info { display: flex; flex-direction: column; gap: 0.25rem; }
.room-list-title { font-weight: 600; font-size: 1rem; color: #fff; }
.room-list-meta { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
.room-list-actions { display: flex; gap: 0.5rem; }
#room-form-container { display: none; background: rgba(255,255,255,0.02); border: 1px solid rgba(91,143,232,0.3); padding: 1.25rem; border-radius: 9px; margin-bottom: 1.5rem; }
#room-form-container.active { display: block; }

.settings-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.settings-card-header {
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba(255,255,255,0.02);
}
.settings-card-header-icon {
  width: 38px; height: 38px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; flex-shrink: 0;
}
.icon-room   { background: rgba(91,143,232,0.15); }
.icon-resort { background: rgba(42,191,176,0.15); }
.icon-bill   { background: rgba(155,114,216,0.15); }

.settings-card-header-text h3 {
  margin: 0 0 0.15rem;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: var(--font-display, 'Playfair Display', serif);
  color: #fff;
  letter-spacing: 0.01em;
}
.settings-card-header-text p {
  margin: 0;
  font-size: 0.775rem;
  color: rgba(255,255,255,0.35);
}

.settings-body {
  padding: 1.75rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.4rem 2rem;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.settings-field.full-width { grid-column: 1 / -1; }

.settings-field > label {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.settings-hint {
  font-size: 0.73rem;
  color: rgba(255,255,255,0.25);
  margin: 0 0 0.2rem;
  line-height: 1.4;
}

/* Plain inputs inside .settings-field */
.settings-field input[type="text"],
.settings-field input[type="number"],
.settings-field input[type="email"],
.settings-field select {
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9px;
  padding: 0.68rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  font-family: inherit;
  box-sizing: border-box;
  transition: border 0.2s, background 0.2s;
  appearance: none;
  -webkit-appearance: none;
}
.settings-field input[type="text"]:focus,
.settings-field input[type="number"]:focus,
.settings-field input[type="email"]:focus,
.settings-field select:focus {
  outline: none;
  border-color: var(--gold-mid, #D4A853);
  background: rgba(255,255,255,0.08);
}
.settings-field input::placeholder { color: rgba(255,255,255,0.2); }
.settings-field select {
  cursor: pointer;
  padding-right: 2.2rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238B90A7' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
}
.settings-field select option { background: #1a1d2b; }

/* ₹ prefix input */
.input-with-prefix {
  display: flex;
  align-items: stretch;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9px;
  overflow: hidden;
  transition: border 0.2s;
}
.input-with-prefix:focus-within {
  border-color: var(--gold-mid, #D4A853);
}
.input-prefix-symbol {
  padding: 0.68rem 0.9rem;
  color: rgba(255,255,255,0.35);
  font-size: 0.9rem;
  border-right: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  display: flex; align-items: center;
  flex-shrink: 0;
  user-select: none;
}
.input-with-prefix input {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  flex: 1;
  min-width: 0;
}
.input-with-prefix input:focus { outline: none; }

/* Toggle switch */
.settings-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.68rem 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px;
}
.settings-toggle {
  position: relative;
  width: 42px; height: 22px;
  flex-shrink: 0;
}
.settings-toggle input {
  opacity: 0; width: 0; height: 0;
  position: absolute;
}
.settings-toggle-track {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.1);
  border-radius: 22px;
  cursor: pointer;
  transition: background 0.25s;
}
.settings-toggle input:checked + .settings-toggle-track {
  background: var(--gold-bright, #D4A853);
}
.settings-toggle-track::before {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  left: 3px; top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
.settings-toggle input:checked + .settings-toggle-track::before {
  transform: translateX(20px);
}
.settings-toggle-label {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.6);
  line-height: 1.4;
}

/* Save / Reset bar */
.settings-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0 2.5rem;
  flex-wrap: wrap;
}
.btn-save-settings {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, var(--gold-mid,#B8923E), var(--gold-bright,#D4A853));
  color: #1a1209;
  border: none;
  border-radius: 9px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  letter-spacing: 0.02em;
}
.btn-save-settings:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-reset-settings {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.btn-reset-settings:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

@media (max-width: 767px) {
  .settings-grid { grid-template-columns: 1fr; }
  .settings-field.full-width { grid-column: 1; }
  .settings-body { padding: 1.25rem; }
  .settings-card-header { padding: 1rem 1.25rem; }
  .settings-actions { flex-direction: column; }
  .settings-actions > button { width: 100%; }
}
        `;
    document.head.appendChild(style);
  }

  /* ── RENDER ──────────────────────────────────────────────── */
  async function render() {
    injectStyles();
    const s = loadAll();
    const initialRooms = await window.RoomCache.getRooms();

    main.innerHTML = `
    <div class="page-header animate-in">
      <h1>Settings</h1>
      <p>Configure resort charges and system preferences</p>
    </div>
    <div class="page-content">


      <!-- SECTION 0: ROOM MANAGEMENT -->
      <div class="settings-card animate-in">
        <div class="settings-card-header" style="justify-content: space-between;">
          <div style="display:flex;align-items:center;gap:0.85rem;">
            <div class="settings-card-header-icon icon-room">🏨</div>
            <div class="settings-card-header-text">
              <h3>Room Management</h3>
              <p>Add, edit or remove rooms available in the resort</p>
            </div>
          </div>
          <button class="btn btn--primary btn--sm" id="btn-add-room">+ Add New Room</button>
        </div>
        <div class="settings-body">
          <div id="room-form-container">
            <h4 id="room-form-title" style="margin-bottom:1rem;">Add New Room</h4>
            <div class="settings-grid">
              <input type="hidden" id="edit-room-id">
              <div class="settings-field">
                <label>Room Number</label>
                <input type="text" id="rm-number" placeholder="e.g. 101, A1">
              </div>
              <div class="settings-field">
                <label>Room Type</label>
                <select id="rm-type">
                  <option value="Deluxe Valley View">Deluxe Valley View</option>
                  <option value="Premium Mist Suite">Premium Mist Suite</option>
                  <option value="Grand Kodai Suite">Grand Kodai Suite</option>
                  <option value="Honeymoon Cottage">Honeymoon Cottage</option>
                  <option value="Standard Room">Standard Room</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div class="settings-field" id="rm-custom-type-field" style="display:none;">
                <label>Custom Room Type</label>
                <input type="text" id="rm-custom-type" placeholder="Enter custom type">
              </div>
              <div class="settings-field">
                <label>Floor</label>
                <input type="text" id="rm-floor" placeholder="e.g. Floor 1">
              </div>
              <div class="settings-field">
                <label>Capacity (max guests)</label>
                <input type="number" id="rm-capacity" value="2" min="1">
              </div>
              <div class="settings-field">
                <label>Price Per Night</label>
                <div class="input-with-prefix">
                  <span class="input-prefix-symbol">₹</span>
                  <input type="number" id="rm-price" value="0" min="0">
                </div>
              </div>
              <div class="settings-field">
                <label>Description</label>
                <input type="text" id="rm-desc" placeholder="Optional description">
              </div>
            </div>
            <div style="display:flex;gap:1rem;margin-top:1.5rem;">
              <button class="btn btn--primary" id="btn-save-room">Save Room</button>
              <button class="btn btn--ghost" id="btn-cancel-room">Cancel</button>
            </div>
          </div>
          <div class="room-list" id="settings-room-list"></div>
        </div>
      </div>

      <!-- SECTION 3: RESORT INFO -->
      <div class="settings-card animate-in animate-in-delay-2">
        <div class="settings-card-header">
          <div class="settings-card-header-icon icon-resort">🏔</div>
          <div class="settings-card-header-text">
            <h3>Resort Information</h3>
            <p>Appears on bills and receipts</p>
          </div>
        </div>
        <div class="settings-body">
          <div class="settings-grid">

            <div class="settings-field full-width">
              <label for="resortName">Resort Name</label>
              <input type="text" id="resortName" value="${s.resortName}">
            </div>

            <div class="settings-field full-width">
              <label for="resortAddress">Address</label>
              <input type="text" id="resortAddress" value="${s.resortAddress}">
            </div>

            <div class="settings-field">
              <label for="resortPhone">Phone</label>
              <input type="text" id="resortPhone" value="${s.resortPhone}">
            </div>

            <div class="settings-field">
              <label for="resortEmail">Email</label>
              <input type="text" id="resortEmail" value="${s.resortEmail}">
            </div>

            <div class="settings-field">
              <label for="resortGSTIN">GSTIN Number</label>
              <input type="text" id="resortGSTIN" value="${s.resortGSTIN}" placeholder="e.g. 33XXXXX1234X1ZX">
            </div>

            <div class="settings-field">
              <label for="resortStars">Star Rating</label>
              <select id="resortStars">
                <option value="3" ${s.resortStars == 3 ? 'selected' : ''}>⭐⭐⭐ 3 Star</option>
                <option value="4" ${s.resortStars == 4 ? 'selected' : ''}>⭐⭐⭐⭐ 4 Star</option>
                <option value="5" ${s.resortStars == 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ 5 Star</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      <!-- SECTION 4: BILL SETTINGS -->
      <div class="settings-card animate-in animate-in-delay-3">
        <div class="settings-card-header">
          <div class="settings-card-header-icon icon-bill">🧾</div>
          <div class="settings-card-header-text">
            <h3>Bill &amp; Receipt Settings</h3>
            <p>Configure how bills are generated and printed</p>
          </div>
        </div>
        <div class="settings-body">
          <div class="settings-grid">

            <div class="settings-field">
              <label>Show Payment Method on Bill</label>
              <div class="settings-toggle-row">
                <label class="settings-toggle">
                  <input type="checkbox" id="showPaymentMethod" ${s.showPaymentMethod ? 'checked' : ''}>
                  <span class="settings-toggle-track"></span>
                </label>
                <span class="settings-toggle-label">Show Cash / Card / UPI on bill rows</span>
              </div>
            </div>

            <div class="settings-field">
              <label for="billPrefix">Bill Number Prefix</label>
              <input type="text" id="billPrefix" value="${s.billPrefix}">
            </div>

            <div class="settings-field">
              <label for="billFooter">Bill Footer Note</label>
              <input type="text" id="billFooter" value="${s.billFooter}">
            </div>

          </div>
        </div>
      </div>

      <!-- SAVE / RESET -->
      <div class="settings-actions animate-in">
        <button class="btn-save-settings" id="save-settings-btn">💾 Save All Settings</button>
        <button class="btn-reset-settings" id="reset-settings-btn">↺ Reset to Defaults</button>
      </div>



    </div>
  `;


    const renderRoomsList = async () => {
      const rList = document.getElementById('settings-room-list');
      const rooms = await window.RoomCache.getRooms();
      if (!rooms || rooms.length === 0) {
        rList.innerHTML = '<div class="empty-state">No rooms added yet. Click "Add New Room" to create one.</div>';
        return;
      }
      rList.innerHTML = rooms.map(r => `
            <div class="room-list-item animate-in">
                <div class="room-list-info">
                    <div class="room-list-title">Room ${r.room_number} — ${r.room_type}</div>
                    <div class="room-list-meta">₹${r.base_price_per_night} / night · ${r.floor} · Capacity: ${r.capacity}</div>
                </div>
                <div class="room-list-actions">
                    <button class="btn btn--secondary btn--sm edit-rm-btn" data-id="${r.id}">Edit</button>
                    <button class="btn btn--ghost btn--sm del-rm-btn" data-id="${r.id}">Delete</button>
                </div>
            </div>
        `).join('');

      rList.querySelectorAll('.edit-rm-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          const room = await window.RoomCache.getRoomById(id);
          if (room) {
            document.getElementById('edit-room-id').value = room.id;
            document.getElementById('rm-number').value = room.room_number;
            const typeSel = document.getElementById('rm-type');
            let foundType = Array.from(typeSel.options).some(o => o.value === room.room_type);
            if (foundType) {
              typeSel.value = room.room_type;
              document.getElementById('rm-custom-type-field').style.display = 'none';
            } else {
              typeSel.value = 'Custom';
              document.getElementById('rm-custom-type-field').style.display = 'block';
              document.getElementById('rm-custom-type').value = room.room_type;
            }
            document.getElementById('rm-floor').value = room.floor || '';
            document.getElementById('rm-capacity').value = room.capacity || 2;
            document.getElementById('rm-price').value = room.base_price_per_night || 0;
            document.getElementById('rm-desc').value = room.description || '';
            document.getElementById('room-form-title').textContent = 'Edit Room';
            document.getElementById('room-form-container').classList.add('active');
            document.getElementById('rm-number').focus();
          }
        });
      });

      rList.querySelectorAll('.del-rm-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          GM.confirm('Delete Room', 'Are you sure you want to delete this room?', async () => {
            await window.RoomCache.deleteRoom(id);
            GM.toast('Room deleted', 'success');
            renderRoomsList();
          }, 'Delete', true);
        });
      });
    };

    renderRoomsList();

    document.getElementById('btn-add-room').addEventListener('click', () => {
      document.getElementById('edit-room-id').value = '';
      document.getElementById('rm-number').value = '';
      document.getElementById('rm-type').value = 'Deluxe Valley View';
      document.getElementById('rm-custom-type-field').style.display = 'none';
      document.getElementById('rm-custom-type').value = '';
      document.getElementById('rm-floor').value = '';
      document.getElementById('rm-capacity').value = 2;
      document.getElementById('rm-price').value = 0;
      document.getElementById('rm-desc').value = '';
      document.getElementById('room-form-title').textContent = 'Add New Room';
      document.getElementById('room-form-container').classList.add('active');
    });

    document.getElementById('btn-cancel-room').addEventListener('click', () => {
      document.getElementById('room-form-container').classList.remove('active');
    });

    document.getElementById('rm-type').addEventListener('change', (e) => {
      document.getElementById('rm-custom-type-field').style.display = e.target.value === 'Custom' ? 'block' : 'none';
    });

    document.getElementById('btn-save-room').addEventListener('click', async () => {
      const id = document.getElementById('edit-room-id').value;
      const num = document.getElementById('rm-number').value.trim();
      const typeSel = document.getElementById('rm-type').value;
      const type = typeSel === 'Custom' ? document.getElementById('rm-custom-type').value.trim() : typeSel;
      const floor = document.getElementById('rm-floor').value.trim();
      const cap = parseInt(document.getElementById('rm-capacity').value) || 2;
      const price = parseFloat(document.getElementById('rm-price').value) || 0;
      const desc = document.getElementById('rm-desc').value.trim();

      if (!num || !type) {
        GM.toast('Room Number and Type are required', 'error');
        return;
      }

      const roomObj = {
        room_number: num,
        room_type: type,
        floor: floor,
        capacity: cap,
        base_price_per_night: price,
        description: desc,
        status: 'available'
      };

      if (id) {
        await window.RoomCache.updateRoom(id, roomObj);
        GM.toast('Room updated successfully', 'success');
      } else {
        roomObj.id = crypto.randomUUID();
        roomObj.created_at = new Date().toISOString();
        await window.RoomCache.addRoom(roomObj);
        GM.toast('Room added successfully', 'success');
      }

      document.getElementById('room-form-container').classList.remove('active');
      renderRoomsList();
    });

    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);


  }

  /* ── SAVE ────────────────────────────────────────────────── */
  function saveSettings() {
    const settings = {
      resortName: document.getElementById('resortName').value.trim(),
      resortAddress: document.getElementById('resortAddress').value.trim(),
      resortPhone: document.getElementById('resortPhone').value.trim(),
      resortEmail: document.getElementById('resortEmail').value.trim(),
      resortGSTIN: document.getElementById('resortGSTIN').value.trim(),
      resortStars: parseInt(document.getElementById('resortStars').value) || 4,
      showPaymentMethod: document.getElementById('showPaymentMethod').checked,
      billPrefix: document.getElementById('billPrefix').value.trim(),
      billFooter: document.getElementById('billFooter').value.trim(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.GMSettings = { get: getSetting, getAll: loadAll };
      GM.toast('Settings saved successfully!', 'success');

      const btn = document.getElementById('save-settings-btn');
      if (btn) {
        btn.textContent = '✓ Saved!';
        setTimeout(() => { if (btn) btn.textContent = '💾 Save All Settings'; }, 2000);
      }
    } catch (e) {
      GM.toast('Failed to save settings: ' + e.message, 'error');
    }
  }

  /* ── RESET ───────────────────────────────────────────────── */
  function resetSettings() {
    GM.confirm(
      'Reset Settings',
      'Reset all settings to factory defaults? This cannot be undone.',
      () => {
        localStorage.removeItem(STORAGE_KEY);
        window.GMSettings = { get: getSetting, getAll: loadAll };
        render();
        GM.toast('Settings reset to defaults.', 'info');
      },
      'Reset', true
    );
  }

  /* ── INIT ────────────────────────────────────────────────── */
  render();
})();
