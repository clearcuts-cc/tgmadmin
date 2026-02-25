/* history.js — Stay History with full bill viewer — localStorage-backed */
(function () {
  const main = document.getElementById('main-content');

  function render() {
    main.innerHTML = `
    <div class="page-header animate-in">
      <h1>Stay History</h1>
      <p>Complete record of all past guest stays — click any row to view full bill</p>
    </div>
    <div class="page-content">
      <div class="filter-bar animate-in">
        <div class="search-wrap" style="flex:1;max-width:360px;">
          <input class="form-input" type="search" id="history-search" placeholder="Search guest, phone, room…" aria-label="Search stay history">
        </div>
        <select class="form-select" id="month-filter" style="max-width:150px;">
          <option value="">All Months</option>
          <option value="01">January</option><option value="02">February</option>
          <option value="03">March</option><option value="04">April</option>
          <option value="05">May</option><option value="06">June</option>
          <option value="07">July</option><option value="08">August</option>
          <option value="09">September</option><option value="10">October</option>
          <option value="11">November</option><option value="12">December</option>
        </select>
        <select class="form-select" id="year-filter" style="max-width:120px;">
          <option value="">All Years</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
        </select>
        <button class="btn btn--ghost btn--sm" id="clear-history-filters">Clear</button>
      </div>

      <!-- Summary stats -->
      <div style="display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;" class="animate-in">
        ${[
        { id: 'total-stays-count', icon: '📊', label: 'Records Shown' },
        { id: 'total-nights-count', icon: '🌙', label: 'Total Nights' },
        { id: 'total-revenue-count', icon: '💰', label: 'Total Revenue', gold: true },
      ].map(s => `
          <div class="card" style="flex:1;min-width:160px;padding:0.85rem 1rem;display:flex;align-items:center;gap:0.75rem;">
            <span style="font-size:1.5rem;">${s.icon}</span>
            <div>
              <div style="font-family:var(--font-display);font-size:1.4rem;font-weight:600;${s.gold ? 'color:var(--gold-bright);' : ''}" id="${s.id}">—</div>
              <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">${s.label}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="table-wrap animate-in">
        <table>
          <thead><tr><th>#</th><th>Guest Name</th><th>Phone</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Grand Total</th><th>Bill No</th></tr></thead>
          <tbody id="history-tbody"></tbody>
        </table>
      </div>
      <div id="history-empty" class="empty-state hidden"><span>🕐</span>No completed stays yet.</div>
    </div>

    <!-- Bill Viewer Modal -->
    <div class="modal-overlay" id="bill-modal">
      <div class="modal" style="max-width:680px;width:95vw;">
        <div class="modal__header">
          <h2 class="modal__title">🧾 Full Bill</h2>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn--ghost btn--sm" id="modal-print-btn">🖨 Print</button>
            <button class="btn btn--ghost btn--sm" id="modal-pdf-btn">💾 PDF</button>
            <button class="modal__close" id="bill-modal-close">✕</button>
          </div>
        </div>
        <div class="modal__body" id="bill-modal-body" style="max-height:70vh;overflow-y:auto;"></div>
      </div>
    </div>
  `;

    const searchInput = document.getElementById('history-search');
    const monthFilter = document.getElementById('month-filter');
    const yearFilter = document.getElementById('year-filter');
    const tbody = document.getElementById('history-tbody');
    const emptyState = document.getElementById('history-empty');
    const totalStaysEl = document.getElementById('total-stays-count');
    const totalNightsEl = document.getElementById('total-nights-count');
    const totalRevEl = document.getElementById('total-revenue-count');

    let activeBill = null;

    function fmtPaidAt(iso) {
      try { return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
      catch { return iso; }
    }

    function buildBillHTML(rec) {
      const pays = rec.payments || [];
      const roomPays = pays.filter(p => p.type === 'room');
      const foodPays = pays.filter(p => p.type === 'food');
      const eventPays = pays.filter(p => p.type === 'event');

      function lineRow(p) {
        return `
          <div class="bill-line-row">
            <div class="bill-line-left">
              <div class="bill-line-title">${p.description}</div>
              <div class="bill-line-meta">${fmtPaidAt(p.paidAt)} · ${p.method}${p.ref ? ' · ' + p.ref : ''}</div>
            </div>
            <div class="bill-line-right">
              <span class="bill-amount">${GM.fmt.currency(p.amount)}</span>
              <span class="bill-paid-badge">✓ PAID</span>
            </div>
          </div>`;
      }

      return `
        <div id="bill-print-area">
          <div class="bill-card">
            <div class="bill-header">
              <div class="bill-resort-name">The Grande Mist</div>
              <div class="bill-resort-sub">KODAIKANAL, DINDIGUL &nbsp;·&nbsp; ★★★★</div>
            </div>

            <div class="bill-guest-info">
              <div class="bill-guest-info-item">
                <div class="bill-info-label">Guest</div>
                <div class="bill-info-value">${rec.guestName}</div>
              </div>
              <div class="bill-guest-info-item">
                <div class="bill-info-label">Room</div>
                <div class="bill-info-value">${rec.room}${rec.roomType ? ' — ' + rec.roomType : ''}</div>
              </div>
              <div class="bill-guest-info-item">
                <div class="bill-info-label">Check-in</div>
                <div class="bill-info-value">${GM.fmt.date(rec.checkIn)}</div>
              </div>
              <div class="bill-guest-info-item">
                <div class="bill-info-label">Check-out · Nights</div>
                <div class="bill-info-value">${GM.fmt.date(rec.checkOut)} &nbsp;·&nbsp; ${rec.nights} nights</div>
              </div>
            </div>

            <div class="bill-section-header">🏠 &nbsp;Room Charges</div>
            ${roomPays.length ? roomPays.map(lineRow).join('') : '<div class="bill-empty-row">None recorded</div>'}

            <div class="bill-section-header">🍽 &nbsp;Food Orders</div>
            ${foodPays.length ? foodPays.map(lineRow).join('') : '<div class="bill-empty-row">None recorded</div>'}

            <div class="bill-section-header">🎉 &nbsp;Events</div>
            ${eventPays.length ? eventPays.map(lineRow).join('') : '<div class="bill-empty-row">None recorded</div>'}

            <div class="bill-total-section">
              <div class="bill-grand-total">
                <span>Grand Total Paid</span>
                <span>${GM.fmt.currency(rec.grandTotal)}</span>
              </div>
              <div class="bill-balance">
                <span>Balance Due</span>
                <span>₹0 (Fully Paid)</span>
              </div>
            </div>

            <div class="bill-footer-bar">
              <span>Bill No: <strong>${rec.billNo || rec.id || '—'}</strong></span>
              <span>Balance: ₹0</span>
            </div>
          </div>
        </div>`;
    }

    function openBill(rec) {
      activeBill = rec;
      document.getElementById('bill-modal-body').innerHTML = buildBillHTML(rec);
      document.getElementById('bill-modal').classList.add('open');
    }

    function closeBillModal() {
      document.getElementById('bill-modal').classList.remove('open');
    }

    document.getElementById('bill-modal-close').addEventListener('click', closeBillModal);
    document.getElementById('bill-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('bill-modal')) closeBillModal();
    });

    document.getElementById('modal-print-btn').addEventListener('click', () => window.print());

    document.getElementById('modal-pdf-btn').addEventListener('click', async () => {
      if (!activeBill) return;
      const btn = document.getElementById('modal-pdf-btn');
      GM.btnLoading(btn, true);

      if (!window.jspdf) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a5' });
        const pays = activeBill.payments || [];
        let y = 15; const lm = 15, rw = 130;

        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('THE GRANDE MIST', 73, y, { align: 'center' }); y += 6;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text('Kodaikanal, Dindigul | ★★★★', 73, y, { align: 'center' }); y += 8;
        doc.setDrawColor(180); doc.line(lm, y, lm + rw, y); y += 5;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(`Guest: ${activeBill.guestName}   Room: ${activeBill.room}`, lm, y); y += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Check-in: ${GM.fmt.date(activeBill.checkIn)}   Check-out: ${GM.fmt.date(activeBill.checkOut)} (${activeBill.nights} nights)`, lm, y); y += 7;
        doc.line(lm, y, lm + rw, y); y += 5;

        ['room', 'food', 'event'].forEach(type => {
          const items = pays.filter(p => p.type === type);
          if (!items.length) return;
          const titles = { room: 'ROOM CHARGES', food: 'FOOD ORDERS', event: 'EVENTS' };
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
          doc.text(titles[type], lm, y); y += 5;
          items.forEach(p => {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
            doc.text(`  ${p.description}`, lm, y);
            doc.text(`${GM.fmt.currency(p.amount)}  ✓`, lm + rw, y, { align: 'right' }); y += 5;
            doc.setFontSize(7); doc.setTextColor(120);
            doc.text(`  ${fmtPaidAt(p.paidAt)} · ${p.method}`, lm, y); doc.setTextColor(0); y += 5;
          });
          y += 2;
        });
        doc.line(lm, y, lm + rw, y); y += 5;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        doc.text(`Grand Total Paid: ${GM.fmt.currency(activeBill.grandTotal)}`, lm, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120);
        doc.text(`Bill No: ${activeBill.billNo || activeBill.id || '—'}   Balance: ₹0 (Fully Paid)`, lm, y);

        const fname = `GrandeMist-Bill-${activeBill.guestName.replace(/\s+/g, '_')}-${activeBill.checkOut}.pdf`;
        doc.save(fname);
      } catch (err) {
        GM.toast('PDF failed: ' + err.message, 'error');
      }
      GM.btnLoading(btn, false);
    });

    function renderHistory() {
      const q = searchInput.value.toLowerCase();
      const month = monthFilter.value;
      const year = yearFilter.value;

      // Combine History + Active Stays for "Real Data"
      const historyData = MockData.history;
      const activeStays = Object.values(MockData.activeStays).map(s => ({
        guestName: s.guestName,
        phone: MockData.getBookingById(s.bookingId)?.phone || '',
        room: s.room,
        checkIn: s.checkinDate,
        checkOut: s.checkoutDate,
        nights: s.nights,
        grandTotal: s.payments.reduce((sum, p) => sum + p.amount, 0),
        billNo: 'ACTV',
        status: 'active',
        payments: s.payments
      }));

      const allData = [...activeStays, ...historyData];

      const filtered = allData.filter(rec => {
        const matchQ = (rec.guestName + (rec.phone || '') + rec.room).toLowerCase().includes(q);
        const dt = new Date(rec.checkIn);
        const matchM = !month || String(dt.getMonth() + 1).padStart(2, '0') === month;
        const matchY = !year || String(dt.getFullYear()) === year;
        return matchQ && matchM && matchY;
      });

      const totalNightsCount = filtered.reduce((s, r) => s + (r.nights || 0), 0);
      const totalRevenueCount = filtered.reduce((s, r) => s + (r.grandTotal || 0), 0);
      totalStaysEl.textContent = filtered.length;
      totalNightsEl.textContent = totalNightsCount;
      totalRevEl.textContent = GM.fmt.currency(totalRevenueCount);
      emptyState.classList.toggle('hidden', filtered.length > 0);

      tbody.innerHTML = filtered.map((rec, i) => `
          <tr style="cursor:pointer;" onclick="window.GMViewBill(${i})" title="Click to view full bill">
            <td style="font-size:0.75rem;color:var(--text-muted);">${String(i + 1).padStart(2, '0')}</td>
            <td style="font-weight:500;">
              ${rec.guestName}
              ${rec.status === 'active' ? ' <span class="badge badge--success" style="font-size:0.55rem;vertical-align:middle;padding:1px 4px;">ACTIVE</span>' : ''}
            </td>
            <td style="font-size:0.85rem;color:var(--text-secondary);">${rec.phone || '—'}</td>
            <td><span style="background:var(--bg-raised);border-radius:4px;padding:2px 8px;font-size:0.8rem;">Room ${rec.room}</span></td>
            <td>${GM.fmt.date(rec.checkIn)}</td>
            <td>${GM.fmt.date(rec.checkOut)}</td>
            <td style="text-align:center;"><span style="font-family:var(--font-display);font-size:1rem;">${rec.nights}</span></td>
            <td style="color:var(--gold-bright);font-weight:600;">${GM.fmt.currency(rec.grandTotal)}</td>
            <td style="font-size:0.78rem;color:var(--text-muted);">${rec.billNo || rec.id || '—'}</td>
          </tr>`).join('');

      window.GMViewBill = (i) => openBill(filtered[i]);
    }

    searchInput.addEventListener('input', renderHistory);
    monthFilter.addEventListener('change', renderHistory);
    yearFilter.addEventListener('change', renderHistory);
    document.getElementById('clear-history-filters').addEventListener('click', () => {
      searchInput.value = ''; monthFilter.value = ''; yearFilter.value = '';
      renderHistory();
    });

    // REALTIME UPDATES
    window.addEventListener('gm:data-change', (e) => {
      const table = e.detail.table;
      if (table === 'history' || table === 'active_stays') renderHistory();
    });

    renderHistory();
  }

  window.__gmPageCleanup = () => { delete window.GMViewBill; };

  render();
})();
