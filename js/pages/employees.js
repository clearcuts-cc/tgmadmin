/* employees.js — Employee Management page (Admin only) */
(function () {
  const main = document.getElementById('main-content');
  const sb = window.supabaseClient;
  const STYLE_ID = 'gm-employees-styles';

  /* ── GUARD: redirect employees away ────────────────────────── */
  if (window.GMRole === 'employee') {
    window.location.hash = '#dashboard';
    return;
  }

  /* ── INJECT STYLES ──────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
/* ══ EMPLOYEES PAGE ═══════════════════════════════════════════ */
.emp-header-row {
  display: flex; align-items: center;
  justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  margin-bottom: 1.5rem;
}
.emp-stats {
  display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
}
.emp-stat-card {
  flex: 1; min-width: 120px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.25rem;
}
.emp-stat-card .stat-num {
  font-size: 1.8rem; font-weight: 700; color: var(--gold-bright, #D4A853);
  line-height: 1;
}
.emp-stat-card .stat-label {
  font-size: 0.72rem; color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 0.08em;
}

/* Add employee modal */
.emp-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px); z-index: 9000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  animation: emp-fade-in 0.18s ease;
}
@keyframes emp-fade-in { from { opacity: 0 } to { opacity: 1 } }
.emp-modal {
  background: #1a1d2b; border: 1px solid rgba(212,168,83,0.3);
  border-radius: 16px; width: 100%; max-width: 440px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  animation: emp-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes emp-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.emp-modal-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 1.5rem 1.5rem 0;
}
.emp-modal-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(212,168,83,0.15); display: flex;
  align-items: center; justify-content: center; font-size: 1.3rem;
  flex-shrink: 0;
}
.emp-modal-title { font-size: 1.05rem; font-weight: 700; color: #fff; }
.emp-modal-sub { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin-top: 0.15rem; }
.emp-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.emp-form-field { display: flex; flex-direction: column; gap: 0.4rem; }
.emp-form-field label {
  font-size: 0.72rem; font-weight: 600;
  color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em;
}
.emp-form-field input {
  width: 100%; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 9px;
  padding: 0.7rem 1rem; color: #fff; font-size: 0.9rem;
  box-sizing: border-box; font-family: inherit;
  transition: border 0.2s, background 0.2s;
}
.emp-form-field input:focus {
  outline: none; border-color: var(--gold-mid, #D4A853);
  background: rgba(255,255,255,0.08);
}
.emp-form-field input::placeholder { color: rgba(255,255,255,0.2); }
.emp-modal-footer {
  padding: 0 1.5rem 1.5rem;
  display: flex; gap: 0.75rem;
}
.btn-give-access {
  flex: 1; padding: 0.8rem; border: none; border-radius: 9px; cursor: pointer;
  background: linear-gradient(135deg, var(--gold-mid,#B8923E), var(--gold-bright,#D4A853));
  color: #1a1209; font-weight: 700; font-size: 0.9rem;
  letter-spacing: 0.02em; display: flex; align-items: center;
  justify-content: center; gap: 0.5rem;
  transition: opacity 0.2s, transform 0.15s;
}
.btn-give-access:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-give-access:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel-emp {
  padding: 0.8rem 1.25rem; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9px; background: transparent;
  color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.9rem;
  transition: color 0.2s, border-color 0.2s;
}
.btn-cancel-emp:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

/* employees table */
.emp-table-wrap {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; overflow: hidden;
}
.emp-table-head {
  display: grid;
  grid-template-columns: 2fr 2fr 1.2fr 1.2fr 1fr;
  padding: 0.75rem 1.25rem;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 0.7rem; font-weight: 600;
  color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em;
  gap: 0.5rem;
}
.emp-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1.2fr 1.2fr 1fr;
  padding: 1rem 1.25rem; gap: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  transition: background 0.15s;
}
.emp-row:last-child { border-bottom: none; }
.emp-row:hover { background: rgba(255,255,255,0.025); }
.emp-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(212,168,83,0.3), rgba(155,114,216,0.3));
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: var(--gold-bright,#D4A853);
  margin-right: 0.6rem; flex-shrink: 0;
}
.emp-name-cell { display: flex; align-items: center; }
.emp-name { font-weight: 600; color: #fff; font-size: 0.87rem; }
.emp-email-cell { font-size: 0.82rem; color: rgba(255,255,255,0.45); }
.emp-badge {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600;
}
.emp-badge--active { background: rgba(42,191,176,0.15); color: #2abfb0; }
.emp-badge--invited { background: rgba(212,168,83,0.12); color: #D4A853; }
.emp-date { font-size: 0.78rem; color: rgba(255,255,255,0.35); }
.emp-actions { display: flex; justify-content: flex-end; }
.btn-revoke {
  padding: 0.3rem 0.7rem; border-radius: 7px; border: 1px solid rgba(255,80,80,0.25);
  background: rgba(255,80,80,0.06); color: rgba(255,120,120,0.8);
  font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
}
.btn-revoke:hover { background: rgba(255,80,80,0.15); color: #ff6b6b; }

.emp-empty {
  padding: 3rem 1.25rem; text-align: center;
  color: rgba(255,255,255,0.3);
}
.emp-empty span { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }

@media (max-width: 767px) {
  .emp-table-head { display: none; }
  .emp-row {
    grid-template-columns: 1fr;
    gap: 0.25rem; padding: 1rem;
  }
  .emp-date, .emp-actions { margin-top: 0.25rem; }
  .emp-actions { justify-content: flex-start; }
}
    `;
    document.head.appendChild(s);
  }

  /* ── HELPERS ────────────────────────────────────────────────── */
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  /* ── LOAD EMPLOYEES ─────────────────────────────────────────── */
  async function loadEmployees() {
    const { data, error } = await sb.from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('created_at', { ascending: false });
    if (error) { console.error('profiles fetch error:', error); return []; }
    return data || [];
  }

  /* ── RENDER EMPLOYEE LIST ───────────────────────────────────── */
  async function renderList() {
    const tbody = document.getElementById('emp-tbody');
    const statsTotal = document.getElementById('emp-stat-total');
    if (!tbody) return;
    tbody.innerHTML = `<div class="emp-empty"><span>⏳</span>Loading employees…</div>`;
    const employees = await loadEmployees();
    if (statsTotal) statsTotal.textContent = employees.length;
    if (!employees.length) {
      tbody.innerHTML = `<div class="emp-empty"><span>👥</span>No employees yet. Click <b>+ Add Employee</b> to give someone access.</div>`;
      return;
    }
    tbody.innerHTML = employees.map(emp => `
      <div class="emp-row animate-in">
        <div class="emp-name-cell">
          <span class="emp-avatar">${initials(emp.name || emp.email)}</span>
          <span class="emp-name">${emp.name || '—'}</span>
        </div>
        <div class="emp-email-cell">${emp.email || '—'}</div>
        <div>
          <span class="emp-badge emp-badge--active">● Active</span>
        </div>
        <div class="emp-date">${fmtDate(emp.created_at)}</div>
        <div class="emp-actions">
          <button class="btn-revoke" data-id="${emp.id}" data-name="${emp.name || emp.email}">Revoke</button>
        </div>
      </div>
    `).join('');

    tbody.querySelectorAll('.btn-revoke').forEach(btn => {
      btn.addEventListener('click', () => {
        const { id, name } = btn.dataset;
        GM.confirm(
          'Revoke Access',
          `Remove access for <b>${name}</b>? They will no longer be able to log in.`,
          async () => {
            const { error } = await sb.from('profiles').delete().eq('id', id);
            if (error) { GM.toast('Failed to revoke: ' + error.message, 'error'); return; }
            GM.toast(`Access revoked for ${name}`, 'info');
            renderList();
          },
          'Revoke', true
        );
      });
    });
  }

  /* ── OPEN MODAL ─────────────────────────────────────────────── */
  function openModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'emp-modal-backdrop';
    backdrop.id = 'emp-modal-backdrop';
    backdrop.innerHTML = `
      <div class="emp-modal" role="dialog" aria-modal="true" aria-label="Add Employee">
        <div class="emp-modal-header">
          <div class="emp-modal-icon">👤</div>
          <div>
            <div class="emp-modal-title">Add New Employee</div>
            <div class="emp-modal-sub">Grant access to the resort management system</div>
          </div>
        </div>
        <div class="emp-modal-body">
          <div class="emp-form-field">
            <label for="emp-name-inp">Full Name</label>
            <input type="text" id="emp-name-inp" placeholder="e.g. Arjun Kumar" autocomplete="off">
          </div>
          <div class="emp-form-field">
            <label for="emp-email-inp">Email Address</label>
            <input type="email" id="emp-email-inp" placeholder="employee@grandemist.in" autocomplete="off">
          </div>
          <div class="emp-form-field">
            <label for="emp-pass-inp">Temporary Password</label>
            <input type="password" id="emp-pass-inp" placeholder="Min 6 characters" autocomplete="new-password">
          </div>
          <div style="background:rgba(212,168,83,0.08);border:1px solid rgba(212,168,83,0.2);border-radius:8px;padding:0.75rem 1rem;font-size:0.78rem;color:rgba(255,255,255,0.5);line-height:1.5;">
            ℹ️ The employee will receive a <b style="color:rgba(255,255,255,0.7);">confirmation email</b> and can log in with the credentials you set.
            They can <b style="color:#2abfb0;">add records</b> but cannot <b style="color:#ff8080;">edit or delete</b> anything.
          </div>
        </div>
        <div class="emp-modal-footer">
          <button class="btn-cancel-emp" id="emp-cancel-btn">Cancel</button>
          <button class="btn-give-access" id="emp-submit-btn">
            🔑 Give Access
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    document.getElementById('emp-cancel-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    document.getElementById('emp-submit-btn').addEventListener('click', submitEmployee);
    setTimeout(() => document.getElementById('emp-name-inp')?.focus(), 100);
  }

  function closeModal() {
    document.getElementById('emp-modal-backdrop')?.remove();
  }

  /* ── SUBMIT EMPLOYEE ─────────────────────────────────────────── */
  async function submitEmployee() {
    const name = document.getElementById('emp-name-inp').value.trim();
    const email = document.getElementById('emp-email-inp').value.trim();
    const pass = document.getElementById('emp-pass-inp').value;
    const btn = document.getElementById('emp-submit-btn');

    if (!name) { GM.toast('Please enter the employee name', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { GM.toast('Please enter a valid email', 'error'); return; }
    if (pass.length < 6) { GM.toast('Password must be at least 6 characters', 'error'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(0,0,0,0.3);border-top-color:#1a1209;border-radius:50%;animation:spin 0.6s linear infinite"></span> Creating…';

    try {
      /* Get current session token to authenticate the edge function call */
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error('You must be logged in as admin to add employees.');

      /* Call the secure Edge Function (uses Admin API — no rate limits, no email confirmation wait) */
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/create-employee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ name, email, password: pass })
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create employee');

      closeModal();
      GM.toast(`✓ Employee added! A verification email has been sent to ${email}. They must click the link before logging in.`, 'success');
      renderList();
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = '🔑 Give Access';
      GM.toast(err.message || 'Failed to create employee', 'error');
    }
  }

  /* ── RENDER PAGE ────────────────────────────────────────────── */
  function render() {
    injectStyles();
    main.innerHTML = `
      <div class="page-header animate-in">
        <h1>Employees</h1>
        <p>Manage staff who have access to the resort management system</p>
      </div>
      <div class="page-content">

        <div class="emp-header-row animate-in">
          <div class="emp-stats">
            <div class="emp-stat-card">
              <div class="stat-num" id="emp-stat-total">—</div>
              <div class="stat-label">Total Employees</div>
            </div>
            <div class="emp-stat-card">
              <div class="stat-num" style="color:#2abfb0;">Add Only</div>
              <div class="stat-label">Employee Permission</div>
            </div>
          </div>
          <button class="btn btn--primary" id="emp-add-btn">＋ Add Employee</button>
        </div>

        <div class="emp-table-wrap animate-in">
          <div class="emp-table-head">
            <div>Name</div>
            <div>Email</div>
            <div>Status</div>
            <div>Added On</div>
            <div style="text-align:right;">Action</div>
          </div>
          <div id="emp-tbody"></div>
        </div>

      </div>

      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;

    document.getElementById('emp-add-btn').addEventListener('click', openModal);
    renderList();
  }

  render();
})();
