/* agents.js — Agent Management page */
(function () {
  const main = document.getElementById('main-content');
  const sb = window.supabaseClient;
  const STYLE_ID = 'gm-agents-styles';

  /* ── INJECT STYLES ──────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
.agent-header-row {
  display: flex; align-items: center;
  justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  margin-bottom: 1.5rem;
}
.agent-stats {
  display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
}
.agent-stat-card {
  flex: 1; min-width: 150px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 0.25rem;
}
.agent-stat-card .stat-num {
  font-size: 1.8rem; font-weight: 700; color: var(--gold-bright, #D4A853);
}
.agent-stat-card .stat-label {
  font-size: 0.72rem; color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.agent-table-wrap {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; overflow: hidden;
}
.agent-table-head {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1.5fr 1fr;
  padding: 0.75rem 1.25rem;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 0.7rem; font-weight: 600;
  color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.08em;
  gap: 0.5rem;
}
.agent-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 2fr 1.5fr 1fr;
  padding: 1rem 1.25rem; gap: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  transition: background 0.15s;
}
.agent-row:last-child { border-bottom: none; }
.agent-row:hover { background: rgba(255,255,255,0.025); }

.agent-name { font-weight: 600; color: #fff; font-size: 0.87rem; }
.agent-info { font-size: 0.82rem; color: rgba(255,255,255,0.45); }
.agent-comm { font-weight: 700; color: var(--gold-bright); }

.agent-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px); z-index: 9000;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.agent-modal {
  background: #1a1d2b; border: 1px solid rgba(212,168,83,0.3);
  border-radius: 16px; width: 100%; max-width: 500px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}
.agent-modal-header { padding: 1.5rem 1.5rem 0; display: flex; align-items: center; gap: 1rem; }
.agent-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.agent-modal-footer { padding: 0 1.5rem 1.5rem; display: flex; gap: 0.75rem; }

.form-field { display: flex; flex-direction: column; gap: 0.4rem; }
.form-field label { font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; }
.form-field input, .form-field textarea {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9px; padding: 0.7rem 1rem; color: #fff; font-size: 0.9rem;
}

@media (max-width: 767px) {
  .agent-table-head { display: none; }
  .agent-row { grid-template-columns: 1fr; gap: 0.25rem; }
}
    `;
    document.head.appendChild(s);
  }

  async function render() {
    injectStyles();
    const agents = MockData.agents || [];
    const totalComm = agents.reduce((sum, a) => sum + (a.totalComm || 0), 0);

    main.innerHTML = `
      <div class="page-header animate-in">
        <h1>Agent Partners</h1>
        <p>Manage commission-based booking agents and their details</p>
      </div>
      <div class="page-content">
        <div class="agent-header-row animate-in">
          <div class="agent-stats">
            <div class="agent-stat-card">
              <div class="stat-num">${agents.length}</div>
              <div class="stat-label">Total Agents</div>
            </div>
            <div class="agent-stat-card">
              <div class="stat-num">${GM.fmt.currency(totalComm)}</div>
              <div class="stat-label">Total Commissions Paid</div>
            </div>
          </div>
          <button class="btn btn--primary" id="add-agent-btn">＋ Add New Agent</button>
        </div>

        <div class="agent-table-wrap animate-in">
          <div class="agent-table-head">
            <div>Agent Name</div>
            <div>Phone</div>
            <div>Aadhaar / Address</div>
            <div>Total Commission</div>
            <div style="text-align:right;">Actions</div>
          </div>
          <div id="agent-list-body">
            ${agents.length === 0 ? '<div style="padding:3rem;text-align:center;color:rgba(255,255,255,0.2);">No agents registered yet.</div>' : ''}
          </div>
        </div>
      </div>
    `;

    const listBody = document.getElementById('agent-list-body');
    agents.forEach(agent => {
      const row = document.createElement('div');
      row.className = 'agent-row animate-in';
      row.innerHTML = `
        <div class="agent-name">${agent.name}</div>
        <div class="agent-info">${agent.phone}</div>
        <div class="agent-info">
          <div style="color:var(--gold-bright);font-size:0.75rem;">🪪 ${agent.aadhaar || 'No Aadhaar'}</div>
          <div style="font-size:0.75rem;opacity:0.6;">📍 ${agent.address || 'No Address'}</div>
        </div>
        <div class="agent-comm">${GM.fmt.currency(agent.totalComm || 0)}</div>
        <div style="text-align:right;">
          <button class="btn btn--ghost btn--sm edit-agent" data-id="${agent.id}">Edit</button>
        </div>
      `;
      listBody.appendChild(row);
    });

    document.getElementById('add-agent-btn').addEventListener('click', () => openAgentModal());
    listBody.querySelectorAll('.edit-agent').forEach(btn => {
      btn.addEventListener('click', () => openAgentModal(btn.dataset.id));
    });
  }

  function openAgentModal(agentId = null) {
    const agent = agentId ? MockData.getAgentById(agentId) : null;
    const backdrop = document.createElement('div');
    backdrop.className = 'agent-modal-backdrop animate-in';
    backdrop.innerHTML = `
      <div class="agent-modal">
        <div class="agent-modal-header">
          <div style="width:44px;height:44px;background:rgba(212,168,83,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🤝</div>
          <div>
            <div style="font-weight:700;font-size:1.1rem;">${agentId ? 'Edit Agent' : 'Register New Agent'}</div>
            <div style="font-size:0.8rem;color:rgba(255,255,255,0.4);">Enter agent details for commission tracking</div>
          </div>
        </div>
        <div class="agent-modal-body">
          <div class="form-field">
            <label>Full Name *</label>
            <input type="text" id="ag-name" value="${agent?.name || ''}" placeholder="e.g. Rajesh Kumar">
          </div>
          <div class="form-field">
            <label>Phone Number *</label>
            <input type="tel" id="ag-phone" value="${agent?.phone || ''}" placeholder="10-digit mobile">
          </div>
          <div class="form-field">
            <label>Aadhaar Number *</label>
            <input type="text" id="ag-aadhaar" value="${agent?.aadhaar || ''}" placeholder="XXXX XXXX XXXX">
          </div>
          <div class="form-field">
            <label>Office / Home Address</label>
            <textarea id="ag-address" rows="2" placeholder="Full address details...">${agent?.address || ''}</textarea>
          </div>

          <div style="margin-top:0.5rem;">
            <label style="font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase;">📎 Documents</label>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
              <div class="form-group">
                  <label class="form-label" style="font-size:0.7rem;">Aadhaar Front</label>
                  <div class="upload-zone" id="ag-aadhaar-front-zone" style="height:80px; padding:0.5rem;">
                    <input type="file" id="agAadhaarFrontImage" accept="image/*">
                    <div class="upload-zone__icon" style="font-size:1.2rem; margin-bottom:2px;">🪪</div>
                    <div class="upload-zone__label" style="font-size:0.65rem">Click to upload</div>
                  </div>
                  <div class="upload-preview" id="ag-aadhaar-front-preview" style="${agent?.aadhaarUrl?.split(',')[0] ? 'display:block;' : 'display:none;'} margin-top:0.5rem;">
                    ${agent?.aadhaarUrl?.split(',')[0] ? `<img src="${agent.aadhaarUrl.split(',')[0]}" style="width:100%; height:60px; object-fit:cover; border-radius:6px; border:1px solid var(--border);">` : ''}
                  </div>
              </div>
              <div class="form-group">
                  <label class="form-label" style="font-size:0.7rem;">Aadhaar Back</label>
                  <div class="upload-zone" id="ag-aadhaar-back-zone" style="height:80px; padding:0.5rem;">
                    <input type="file" id="agAadhaarBackImage" accept="image/*">
                    <div class="upload-zone__icon" style="font-size:1.2rem; margin-bottom:2px;">🪪</div>
                    <div class="upload-zone__label" style="font-size:0.65rem">Click to upload</div>
                  </div>
                  <div class="upload-preview" id="ag-aadhaar-back-preview" style="${agent?.aadhaarUrl?.split(',')[1] ? 'display:block;' : 'display:none;'} margin-top:0.5rem;">
                    ${agent?.aadhaarUrl?.split(',')[1] ? `<img src="${agent.aadhaarUrl.split(',')[1]}" style="width:100%; height:60px; object-fit:cover; border-radius:6px; border:1px solid var(--border);">` : ''}
                  </div>
              </div>
            </div>
          </div>
        </div>
        <div class="agent-modal-footer">
          <button class="btn btn--ghost" id="ag-cancel" style="flex:1;">Cancel</button>
          <button class="btn btn--primary" id="ag-save" style="flex:2;">${agentId ? 'Update Agent' : 'Register Agent'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    let uploadedAadhaarFrontUrl = agent?.aadhaarUrl?.split(',')[0] || '';
    let uploadedAadhaarBackUrl = agent?.aadhaarUrl?.split(',')[1] || '';

    // Image previews + Compression + Upload
    function setupPreview(inputId, previewId, zoneId, onUploadSuccess) {
      const input = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      const zone = document.getElementById(zoneId);
      const label = zone.querySelector('.upload-zone__label');

      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;

        const originalText = label.textContent;
        try {
          preview.innerHTML = ''; 
          label.innerHTML = `<span class="btn-spinner"></span> Compressing...`;
          
          const compressedFile = await GM.compressImage(file, 200);
          const kbSize = Math.round(compressedFile.size / 1024);

          const reader = new FileReader();
          reader.onload = e => {
             const imgEl = document.createElement('img');
             imgEl.src = e.target.result;
             imgEl.style.width = '100%';
             imgEl.style.height = '60px';
             imgEl.style.objectFit = 'cover';
             imgEl.style.borderRadius = '6px';
             imgEl.style.border = '1px solid var(--border)';
             preview.appendChild(imgEl);
          };
          reader.readAsDataURL(compressedFile);

          label.innerHTML = `<span class="btn-spinner"></span> Uploading...`;
          const url = await MockData.uploadGuestDocument(compressedFile, file.name);
          onUploadSuccess(url);
          
          preview.style.display = 'block';
          label.innerHTML = `✅ OK (${kbSize} KB)`;
          GM.toast(`Document uploaded (${kbSize} KB)!`, 'success');
        } catch (err) {
          console.error('Upload error:', err);
          label.textContent = originalText;
          GM.toast('Upload failed.', 'error');
        } finally {
          zone.style.opacity = '1';
          zone.style.pointerEvents = 'auto';
        }
      });
    }

    setupPreview('agAadhaarFrontImage', 'ag-aadhaar-front-preview', 'ag-aadhaar-front-zone', url => uploadedAadhaarFrontUrl = url);
    setupPreview('agAadhaarBackImage', 'ag-aadhaar-back-preview', 'ag-aadhaar-back-zone', url => uploadedAadhaarBackUrl = url);

    const close = () => backdrop.remove();
    document.getElementById('ag-cancel').addEventListener('click', close);
    document.getElementById('ag-save').addEventListener('click', async () => {
      const name = document.getElementById('ag-name').value.trim();
      const phone = document.getElementById('ag-phone').value.trim();
      const aadhaar = document.getElementById('ag-aadhaar').value.trim();
      const address = document.getElementById('ag-address').value.trim();

      if (!name || !phone || !aadhaar) { GM.toast('Please fill all required fields', 'error'); return; }

      try {
        const finalUrl = [uploadedAadhaarFrontUrl, uploadedAadhaarBackUrl].filter(Boolean).join(',');
        if (agentId) {
          await MockData.updateAgent(agentId, { name, phone, aadhaar, address, aadhaarUrl: finalUrl });
        } else {
          await MockData.addAgent({ name, phone, aadhaar, address, aadhaarUrl: finalUrl });
        }
        close();
        render();
      } catch (e) {
        console.error(e);
      }
    });
  }

  render();

  // Listen for data changes to keep list fresh
  const handleDataChange = (e) => {
    if (e.detail.table === 'agents') render();
  };
  window.addEventListener('gm:data-change', handleDataChange);
  window.__gmPageCleanup = () => window.removeEventListener('gm:data-change', handleDataChange);

})();
