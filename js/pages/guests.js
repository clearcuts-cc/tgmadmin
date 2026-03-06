/* guests.js — Guest Directory + inline Guest Profile — localStorage-backed */
(function () {
  const main = document.getElementById('main-content');

  /* ── GUEST DIRECTORY ─────────────────────────────────────── */
  function renderGuestDirectory() {
    main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1>Guest Directory</h1>
          <p>All registered guests — search by name, phone, or Aadhaar</p>
        </div>
        ${window.GMIsAdmin ? `<button class="btn btn--primary" id="add-guest-btn">+ Add Guest</button>` : ''}
      </div>
    </div>
    <div class="page-content">
      <div class="filter-bar animate-in">
        <div class="search-wrap" style="flex:1;max-width:400px;">
          <input class="form-input" type="search" id="guest-search" placeholder="Search name, phone, Aadhaar…" aria-label="Search guests">
        </div>
      </div>
      <div class="table-wrap animate-in">
        <table>
          <thead>
            <tr>
              <th>Guest ID</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Last Stay</th>
              <th>Total Stays</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="guests-body"></tbody>
        </table>
      </div>
      <div id="guests-empty" class="empty-state hidden">
        <span>👤</span>No guests found. Add your first guest!
      </div>
    </div>

    <!-- Add Guest Modal -->
    <div class="modal-overlay" id="guest-modal">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title" id="guest-modal-title">Add Guest</h2>
          <button class="modal__close" id="guest-modal-close">✕</button>
        </div>
        <div class="modal__body">
          <form id="guest-form" novalidate>
            <div class="form-grid form-grid--2">
              <div class="form-group" style="grid-column:1/-1;">
                <label class="form-label" for="g-name">Full Name <span class="req">*</span></label>
                <input class="form-input" type="text" id="g-name" placeholder="e.g. Arjun Mehta" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="g-phone">Phone <span class="req">*</span></label>
                <input class="form-input" type="tel" id="g-phone" placeholder="10-digit mobile">
              </div>
              <div class="form-group">
                <label class="form-label" for="g-email">Email</label>
                <input class="form-input" type="email" id="g-email" placeholder="email@example.com">
              </div>
              <div class="form-group" style="grid-column:1/-1;">
                <label class="form-label" for="g-address">Address</label>
                <input class="form-input" type="text" id="g-address" placeholder="City, State">
              </div>
              <div class="form-group">
                <label class="form-label" for="g-aadhaar">Aadhaar No.</label>
                <input class="form-input" type="text" id="g-aadhaar" placeholder="XXXX XXXX XXXX" maxlength="14">
              </div>
            </div>
          </form>
        </div>
        <div class="modal__footer">
          <button class="btn btn--ghost" id="guest-modal-cancel">Cancel</button>
          <button class="btn btn--primary" id="guest-modal-save">Save Guest</button>
        </div>
      </div>
    </div>
  `;

    const tbody = document.getElementById('guests-body');
    const search = document.getElementById('guest-search');
    const empty = document.getElementById('guests-empty');
    const modal = document.getElementById('guest-modal');
    let editingGuestId = null;

    function render() {
      const q = search.value.toLowerCase();
      const guests = MockData.guests;
      const filtered = guests.filter(g =>
        (g.name + g.phone + (g.aadhaar || '')).toLowerCase().includes(q)
      );
      empty.classList.toggle('hidden', filtered.length > 0 || q.length > 0);
      if (filtered.length === 0 && q.length === 0) {
        empty.classList.remove('hidden');
      }
      tbody.innerHTML = filtered.map(g => `
      <tr>
        <td style="font-size:0.78rem;color:var(--text-muted);">${g.id}</td>
        <td style="font-weight:500;">
          ${g.name}
          ${g.added_by ? `<br><span style="font-size:0.68rem;color:rgba(255,255,255,0.3);">Added by ${g.added_by}</span>` : ''}
        </td>
        <td>${g.phone}</td>
        <td>${g.lastStay ? GM.fmt.date(g.lastStay) : '—'}</td>
        <td>
          <span style="font-family:var(--font-display);font-size:1.1rem;">${g.totalStays || 0}</span>
          <span style="font-size:0.75rem;color:var(--text-muted);"> stay${(g.totalStays || 0) !== 1 ? 's' : ''}</span>
        </td>
        <td style="display:flex;gap:0.4rem;">
          <button onclick="window.__gmViewGuest('${g.id}')" class="btn btn--sm btn--ghost">View →</button>
          ${window.GMIsAdmin ? `<button onclick="window.__gmEditGuest('${g.id}')" class="btn btn--sm btn--ghost btn--icon" title="Edit">✏</button>` : ''}
          ${window.GMIsAdmin ? `<button onclick="window.__gmDeleteGuest('${g.id}')" class="btn btn--sm btn--danger btn--icon" title="Delete">🗑</button>` : ''}
        </td>
      </tr>`).join('');
    }

    // Modal open/close
    function openModal(title) {
      document.getElementById('guest-modal-title').textContent = title;
      modal.classList.add('open');
    }
    function closeModal() { modal.classList.remove('open'); editingGuestId = null; }
    document.getElementById('guest-modal-close').addEventListener('click', closeModal);
    document.getElementById('guest-modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    const addGuestBtn = document.getElementById('add-guest-btn');
    if (addGuestBtn) {
      addGuestBtn.addEventListener('click', () => {
        editingGuestId = null;
        document.getElementById('guest-form').reset();
        openModal('Add Guest');
      });
    }

    window.__gmEditGuest = (id) => {
      const g = MockData.getGuestById(id);
      if (!g) return;
      editingGuestId = id;
      document.getElementById('g-name').value = g.name;
      document.getElementById('g-phone').value = g.phone;
      document.getElementById('g-email').value = g.email || '';
      document.getElementById('g-address').value = g.address || '';
      document.getElementById('g-aadhaar').value = g.aadhaar || '';
      openModal('Edit Guest');
    };

    window.__gmDeleteGuest = (id) => {
      const g = MockData.getGuestById(id);
      GM.confirm('Delete Guest', `Remove ${g?.name || 'this guest'} from directory?`, () => {
        MockData.deleteGuest(id);
        render();
        GM.toast('Guest removed.', 'info');
      }, 'Delete', true);
    };

    document.getElementById('guest-modal-save').addEventListener('click', () => {
      const name = document.getElementById('g-name').value.trim();
      const phone = document.getElementById('g-phone').value.trim();
      if (!name || !phone) { GM.toast('Name and phone are required.', 'error'); return; }
      const btn = document.getElementById('guest-modal-save');
      GM.btnLoading(btn, true);
      setTimeout(() => {
        GM.btnLoading(btn, false);
        const session = JSON.parse(localStorage.getItem('gm_session') || '{}');
        if (editingGuestId) {
          MockData.updateGuest(editingGuestId, {
            name, phone,
            email: document.getElementById('g-email').value.trim(),
            address: document.getElementById('g-address').value.trim(),
            aadhaar: document.getElementById('g-aadhaar').value.trim(),
          });
          GM.toast('Guest updated.', 'success');
        } else {
          MockData.addGuest({
            name, phone,
            email: document.getElementById('g-email').value.trim(),
            address: document.getElementById('g-address').value.trim(),
            aadhaar: document.getElementById('g-aadhaar').value.trim(),
            totalStays: 0,
            lastStay: null,
            added_by: session.name || null,
          });
          GM.toast('Guest added!', 'success');
        }
        closeModal();
        render();
      }, 700);
    });

    search.addEventListener('input', render);
    render();
  }

  /* ── GUEST PROFILE (inline) ──────────────────────────────── */
  window.__gmViewGuest = function (guestId) {
    const guest = MockData.getGuestById(guestId);
    const stayHistory = MockData.guestStayHistory;
    const stays = stayHistory[guestId] || [];

    if (!guest) {
      main.innerHTML = `
      <div class="page-header animate-in">
        <div style="display:flex;align-items:center;gap:1rem;">
          <button onclick="renderGuestDirectory()" class="btn btn--ghost btn--sm">← Back to Directory</button>
          <div><h1>Guest Profile</h1></div>
        </div>
      </div>
      <div class="page-content"><div class="empty-state"><span>👤</span>Guest not found.</div></div>`;
      return;
    }

    const totalRevenue = stays.reduce((s, st) => s + st.total, 0);

    main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;gap:1rem;">
        <button onclick="renderGuestDirectory()" class="btn btn--ghost btn--sm">← Back to Directory</button>
        <div>
          <h1>${guest.name}</h1>
          <p>${guest.totalStays || 0} stay${(guest.totalStays || 0) !== 1 ? 's' : ''} · ${guest.lastStay ? 'Last visit ' + GM.fmt.date(guest.lastStay) : 'No stays yet'}</p>
        </div>
      </div>
    </div>
    <div class="page-content">
      <div style="display:grid;grid-template-columns:340px 1fr;gap:1.5rem;" id="profile-grid">

        <!-- Left -->
        <div>
          <div class="card mb-md animate-in" style="text-align:center;padding:2rem 1.5rem;">
            <div class="guest-photo" style="margin:0 auto 1rem;width:88px;height:88px;font-size:2.5rem;">👤</div>
            <h2 style="font-size:1.3rem;margin-bottom:0.25rem;">${guest.name}</h2>
            <p style="font-size:0.85rem;color:var(--text-muted);">${guest.id}</p>
            <div style="display:flex;justify-content:center;gap:1.5rem;margin-top:1rem;">
              <div style="text-align:center;">
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:600;">${guest.totalStays || 0}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Stays</div>
              </div>
              <div style="text-align:center;">
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:600;color:var(--gold-bright);">${GM.fmt.currency(totalRevenue)}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Total Spend</div>
              </div>
            </div>
          </div>

          <div class="card mb-md animate-in animate-in-delay-1">
            <h4 style="margin-bottom:0.75rem;">Contact</h4>
            <div class="detail-rows">
              <div class="detail-row"><span class="detail-row__label">Phone</span><span class="detail-row__value">${guest.phone}</span></div>
              <div class="detail-row"><span class="detail-row__label">Email</span><span class="detail-row__value">${guest.email || '—'}</span></div>
              <div class="detail-row"><span class="detail-row__label">Address</span><span class="detail-row__value">${guest.address || '—'}</span></div>
              <div class="detail-row"><span class="detail-row__label">Aadhaar</span><span class="detail-row__value" style="font-family:monospace;">${guest.aadhaar || '—'}</span></div>
            </div>
          </div>

          <div class="card animate-in animate-in-delay-2">
            <h4 style="margin-bottom:0.75rem;">Documents</h4>
            <div class="doc-img mb-sm"><span>🪪</span><span>Aadhaar — placeholder</span></div>
            <div class="doc-img"><span>📷</span><span>Guest photo — placeholder</span></div>
          </div>
        </div>

        <!-- Right -->
        <div>
          <div class="card animate-in">
            <h3 style="margin-bottom:1rem;">🕐 Stay History</h3>
            ${stays.length === 0
        ? `<div class="empty-state" style="padding:1.5rem 0;"><span>🏠</span>No stays on record.</div>`
        : `<div class="table-wrap" style="border:none;">
                  <table>
                    <thead><tr><th>Room</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Status</th><th>Total Bill</th></tr></thead>
                    <tbody>
                      ${stays.map(st => `
                        <tr>
                          <td>Room ${st.room}</td>
                          <td>${GM.fmt.date(st.checkIn)}</td>
                          <td>${GM.fmt.date(st.checkOut)}</td>
                          <td>${st.nights}</td>
                          <td>
                            ${st.status === 'active'
            ? `<span class="badge badge--success" style="font-size:0.65rem;">Currently In</span>`
            : st.status === 'cancelled'
              ? `<span class="badge badge--gray" style="font-size:0.65rem;" title="Reason: ${st.cancelledReason || 'None'}">Cancelled</span>`
              : `<span class="badge" style="font-size:0.65rem;background:rgba(255,255,255,0.05);">Completed</span>`}
                          </td>
                          <td style="color:var(--gold-bright);font-weight:500;">${st.status === 'cancelled' ? '—' : GM.fmt.currency(st.total)}</td>
                        </tr>`).join('')}
                    </tbody>
                  </table>
                </div>`}
          </div>
        </div>

      </div>
    </div>
  `;

    const profileGrid = document.getElementById('profile-grid');
    function handleResize() {
      if (profileGrid) profileGrid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '340px 1fr';
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    const dataListener = (e) => {
      const t = e.detail.table;
      if (t === 'history' || t === 'active_stays' || t === 'guests') {
        window.__gmViewGuest(guestId);
      }
    };
    window.addEventListener('gm:data-change', dataListener);

    window.__gmPageCleanup = () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('gm:data-change', dataListener);
      delete window.__gmViewGuest;
      delete window.__gmPageCleanup;
    };
  };

  /* Expose globally */
  window.renderGuestDirectory = renderGuestDirectory;

  /* ── INITIAL RENDER ────────────────────────────────────────── */
  renderGuestDirectory();

  window.__gmPageCleanup = () => {
    delete window.__gmViewGuest;
    delete window.__gmEditGuest;
    delete window.__gmDeleteGuest;
    delete window.renderGuestDirectory;
  };
})();
