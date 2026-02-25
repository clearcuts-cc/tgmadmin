/* checkout.js — Check-out flow:
 *   #checkout             → Room selector board (occupied / due_checkout only)
 *   #checkout?roomId=X   → Final bill + checkout for that room's booking
 *   #checkout?booking=Y  → (legacy) Final bill by bookingId
 */
(async function () {
  const main = document.getElementById('main-content');

  const roomIdParam = GMRouteParam('roomId');
  const bookingParam = GMRouteParam('booking');

  if (roomIdParam || bookingParam) {
    renderCheckoutBill(roomIdParam, bookingParam);
  } else {
    renderRoomSelector();
  }

  async function renderRoomSelector() {
    const cRooms = await window.RoomCache.getRooms();
    const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status }));
    const STATUS_META = {
      available: { icon: '🌿', label: 'Available' },
      confirmed: { icon: '🔵', label: 'Confirmed' },
      occupied: { icon: '🔴', label: 'Occupied' },
      due_checkout: { icon: '⏰', label: 'Due Checkout' },
      maintenance: { icon: '🔧', label: 'Maintenance' },
    };
    const ACTIVE = new Set(['occupied', 'due_checkout']);

    main.innerHTML = `
        <div class="page-header animate-in">
          <h1>Check-out — Select Room</h1>
          <p>Click an <strong style="color:var(--red)">occupied</strong> or <strong style="color:var(--orange)">due checkout</strong> room to view the final bill</p>
        </div>
        <div class="page-content">
          <div class="status-legend animate-in" style="margin-bottom:1.25rem;">
            <div class="legend-item"><div class="legend-dot" style="background:var(--red)"></div> Occupied — click to check out</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--orange)"></div> Due Checkout — click to check out</div>
            <div class="legend-item" style="opacity:0.5;"><div class="legend-dot" style="background:var(--blue)"></div> Confirmed</div>
            <div class="legend-item" style="opacity:0.5;"><div class="legend-dot" style="background:var(--green)"></div> Available</div>
            <div class="legend-item" style="opacity:0.5;"><div class="legend-dot" style="background:var(--purple)"></div> Maintenance</div>
          </div>
          <div class="room-grid animate-in" id="checkout-room-grid"></div>
        </div>`;

    const grid = document.getElementById('checkout-room-grid');
    grid.innerHTML = rooms.map(room => {
      const st = MockData.getRoomStatus(room.id);
      const meta = STATUS_META[st] || STATUS_META.available;
      const booking = MockData.getActiveBookingForRoom(room.id);
      const isActive = ACTIVE.has(st);
      const accentColor = st === 'due_checkout' ? 'var(--orange)' : 'var(--red)';
      const guestLine = (isActive && booking) ? `
              <div style="margin-top:0.5rem;font-size:0.78rem;color:${accentColor};font-weight:500;">${booking.guestName}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Out: ${GM.fmt.date(booking.checkOut)}</div>` : '';
      return `
          <div class="room-card room-card--${st} ${isActive ? 'room-card--checkout-active' : 'room-card--dimmed'}"
               data-room-id="${room.id}"
               ${isActive ? `role="button" tabindex="0"` : 'aria-disabled="true"'}>
            <div class="room-card__icon">${meta.icon}</div>
            <div class="room-card__number">${room.number}</div>
            <div class="room-card__type">${room.type}</div>
            <div class="room-card__badge">${GM.statusBadge(st)}</div>
            <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-muted);">
              ${GM.fmt.currency(room.rate)}<span style="opacity:0.6"> / night</span>
            </div>
            ${guestLine}
            ${isActive ? `<div style="margin-top:0.6rem;font-size:0.72rem;color:${accentColor};font-weight:600;letter-spacing:0.06em;">TAP TO CHECK OUT ›</div>` : ''}
          </div>`;
    }).join('');

    grid.querySelectorAll('.room-card--checkout-active').forEach(card => {
      card.addEventListener('click', () => { window.location.hash = `#checkout?roomId=${card.dataset.roomId}`; });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') window.location.hash = `#checkout?roomId=${card.dataset.roomId}`; });
    });
  }

  /* ══════════════════════════════════════════════════════════
   * VIEW 2 — Final Consolidated Bill + Checkout
   * ═════════════════════════════════════════════════════════ */
  async function renderCheckoutBill(roomId, bookingId) {
    const cRooms = await window.RoomCache.getRooms();
    const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status }));
    let booking = null, room = null;
    if (roomId) {
      room = rooms.find(r => r.id === roomId);
      if (room) booking = MockData.getActiveBookingForRoom(room.id);
    }
    if (!booking && bookingId) {
      booking = MockData.getBookingById(bookingId);
      if (booking) room = rooms.find(r => r.id === booking.roomId);
    }
    if (!booking || !room) {
      main.innerHTML = `
          <div class="page-header animate-in">
            <div style="display:flex;align-items:center;gap:1rem;">
              <a href="#checkout" class="btn btn--ghost btn--sm">← Back</a>
              <div><h1>Guest Check-out</h1></div>
            </div>
          </div>
          <div class="page-content">
            <div class="empty-state"><span>↩</span>No active booking found for this room.</div>
            <div style="text-align:center;margin-top:1rem;"><a href="#checkout" class="btn btn--primary">← Select a Room</a></div>
          </div>`;
      return;
    }

    const stay = MockData.getStayByBookingId(booking.id);
    const nights = GM.nights(booking.checkIn, booking.checkOut);
    const rate = room.rate;

    // Build payments
    let payments = [];
    if (stay) {
      payments = stay.payments;
    } else {
      // No stay recorded (e.g. booking was checked-in without using the check-in flow)
      payments = [{ type: 'room', description: `Room charges — ${nights} night${nights > 1 ? 's' : ''} × ${GM.fmt.currency(rate)}`, amount: nights * rate, paidAt: booking.checkIn || new Date().toISOString(), method: 'Cash', ref: '' }];
    }

    const roomPays = payments.filter(p => p.type === 'room');
    const foodPays = payments.filter(p => p.type === 'food');
    const eventPays = payments.filter(p => p.type === 'event');
    const grandTotal = payments.reduce((s, p) => s + p.amount, 0);

    function fmtPaidAt(iso) {
      try { return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
      catch { return iso; }
    }

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

    function emptySection() {
      return `<div class="bill-empty-row">None recorded</div>`;
    }

    const billNo = `GM-${new Date().getFullYear()}-${String(MockData.completedBills.length + 1).padStart(4, '0')}`;
    const generatedAt = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    main.innerHTML = `
        <style>
          .extra-charges-section { 
            background: rgba(255,255,255,0.03); 
            padding: 1.5rem; 
            border-radius: 12px; 
            border: 1px solid rgba(255,255,255,0.08); 
            margin: 1.5rem 0; 
          }
          .ec-entry-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
          .ec-field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 140px; }
          .ec-field label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
          
          .ec-list { display: flex; flex-direction: column; gap: 8px; margin-top: 1.5rem; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 1.5rem; }
          .ec-item { 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 10px 16px; background: rgba(255,255,255,0.04); border-radius: 8px; 
            border-left: 3px solid var(--gold-bright);
            animation: slideIn 0.3s ease-out;
          }
          @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
          
          .bill-balance--due { background: rgba(153, 27, 27, 0.15); border-radius: 6px; padding: 6px 12px; border: 1px solid rgba(248, 113, 113, 0.2); }
          .bill-balance--due span:last-child { color: #f87171 !important; font-weight: 600; }
          
          /* Line items for the card reflection */
          .bill-extra-item { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.9rem; }
          .badge--tiny { font-size: 0.55rem; padding: 1px 4px; vertical-align: middle; margin-left: 4px; }
        </style>
        <div class="page-header animate-in">
          <div style="display:flex;align-items:center;gap:1rem;">
            <a href="#checkout" class="btn btn--ghost btn--sm">← Room Board</a>
            <div><h1>Guest Check-out</h1><p>Final consolidated bill for ${booking.guestName}</p></div>
          </div>
        </div>
        <div class="page-content" style="padding-top:0;">

          <div id="bill-print-area">
            <div class="bill-card animate-in">

              <!-- Header -->
              <div class="bill-header">
                <div class="bill-resort-name">The Grande Mist</div>
                <div class="bill-resort-sub">KODAIKANAL, DINDIGUL &nbsp;·&nbsp; ★★★★</div>
              </div>

              <!-- Guest info grid -->
              <div class="bill-guest-info" id="bill-guest-grid">
                <div class="bill-guest-info-item">
                  <div class="bill-info-label">Guest</div>
                  <div class="bill-info-value">${booking.guestName}</div>
                </div>
                <div class="bill-guest-info-item">
                  <div class="bill-info-label">Room</div>
                  <div class="bill-info-value">${booking.roomNumber} — ${room.type}</div>
                </div>
                <div class="bill-guest-info-item">
                  <div class="bill-info-label">Check-in</div>
                  <div class="bill-info-value">${GM.fmt.date(booking.checkIn)}</div>
                </div>
                <div class="bill-guest-info-item">
                  <div class="bill-info-label">Check-out · Nights</div>
                  <div class="bill-info-value">${GM.fmt.date(booking.checkOut)} &nbsp;·&nbsp; ${nights} nights</div>
                </div>
              </div>

              <!-- Room Charges -->
              <div class="bill-section-header">🏠 &nbsp;Room Charges</div>
              ${roomPays.length ? roomPays.map(lineRow).join('') : emptySection()}

              <!-- Food Orders -->
              <div class="bill-section-header">🍽 &nbsp;Food Orders</div>
              ${foodPays.length ? foodPays.map(lineRow).join('') : emptySection()}

              <!-- Events -->
              <div class="bill-section-header">🎉 &nbsp;Events</div>
              ${eventPays.length ? eventPays.map(lineRow).join('') : emptySection()}

              <!-- Adjustments Container (reflected on card) -->
              <div id="bill-adjustments-card">
                <div class="bill-section-header">⚖ &nbsp;Adjustments</div>
                <div id="bill-extra-lines" style="border-bottom: 1px dashed rgba(255,255,255,0.1); margin-bottom: 0.5rem; padding-bottom: 0.5rem;">
                  <div class="bill-empty-row">No manual adjustments</div>
                </div>
              </div>
              
              <div class="extra-charges-section animate-in" style="margin-top:2rem;">
                <h4 style="margin-bottom:1rem;color:var(--gold-bright);">Add Service / Correction</h4>
                <div class="ec-entry-row mb-md">
                  <div class="ec-field">
                    <label>Service Name</label>
                    <input type="text" id="ec-name" placeholder="e.g. Laundry, Bar, Pet Fee" class="form-input">
                  </div>
                  <div class="ec-field" style="flex:0;min-width:120px;">
                    <label>Amount</label>
                    <input type="number" id="ec-amount" placeholder="0" class="form-input">
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn--secondary" id="ec-add-paid" title="Add as Paid (Adds to total bill)" style="padding-left:1.5rem;padding-right:1.5rem;">+ Add Paid</button>
                    <button class="btn btn--ghost" id="ec-add-due" title="Add as Due (Increases balance)">Add Due</button>
                  </div>
                </div>
                
                <h5 style="font-size:0.75rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.75rem;">Recently Added</h5>
                <div id="ec-list" class="ec-list" style="margin-top:0;padding-top:0;border:none;"></div>
                <input type="hidden" id="extra-charges" value="0">
              </div>

              <div class="bill-adjustment-row" style="padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.05);">
                <span style="font-size:1rem;font-weight:500;">Apply Overall Discount</span>
                <div>
                  <input type="number" id="discount" value="0" min="0" placeholder="0" class="form-input" style="width:120px;text-align:right;">
                  <span class="bill-print-value">₹<span id="discount-val">0</span></span>
                </div>
              </div>

              <!-- Totals -->
              <div class="bill-total-section">
                <div class="bill-total-row">
                  <span>Total Collected (all payments)</span>
                  <span>${GM.fmt.currency(grandTotal)}</span>
                </div>
                <div class="bill-grand-total">
                  <span>Grand Total</span>
                  <span id="grand-total-display">${GM.fmt.currency(grandTotal)}</span>
                </div>
                <div class="bill-balance" id="balance-row">
                  <span>Balance Due</span>
                  <span id="balance-due-display">₹0</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="bill-footer-bar">
                <span>Bill No: <strong>${billNo}</strong></span>
                <span>Generated: ${generatedAt}</span>
              </div>

            </div><!-- end bill-card -->
          </div><!-- end bill-print-area -->

          <!-- Action buttons -->
          <div id="bill-actions" class="bill-actions" style="max-width:720px;margin:1.25rem auto 0;display:flex;gap:1rem;flex-wrap:wrap;">
            <button class="btn btn--ghost" id="print-bill-btn">🖨 Print Bill</button>
            <button class="btn btn--ghost" id="save-pdf-btn">💾 Save as PDF</button>
            <button class="btn btn--primary btn--lg" id="confirm-checkout-btn" style="margin-left:auto;">↩ Confirm Check-out</button>
          </div>

          <!-- Success -->
          <div id="checkout-success" class="card mt-md hidden animate-in" style="max-width:720px;margin:1.25rem auto 0;text-align:center;border-color:var(--teal);background:var(--teal-dim);">
            <div style="font-size:2.5rem;margin-bottom:0.5rem;">✅</div>
            <h3 style="color:var(--teal);">Check-out Complete</h3>
            <p id="checkout-success-msg" style="font-size:0.85rem;margin-top:0.4rem;"></p>
            <div style="display:flex;gap:0.75rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
              <a href="#checkout" class="btn btn--teal">↩ Next Check-out</a>
              <a href="#history" class="btn btn--ghost">📋 View History</a>
              <a href="#dashboard" class="btn btn--ghost">← Dashboard</a>
            </div>
          </div>

        </div>`;

    // Responsive guest-info grid
    const guestGrid = document.getElementById('bill-guest-grid');
    function handleResize() {
      if (guestGrid) guestGrid.style.gridTemplateColumns = window.innerWidth < 540 ? '1fr' : '1fr 1fr';
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    window.__gmPageCleanup = () => window.removeEventListener('resize', handleResize);

    // Dynamic Extra Charges Logic
    let addedCharges = [];
    const discountInput = document.getElementById('discount');
    const grandDisplay = document.getElementById('grand-total-display');
    const balanceEl = document.getElementById('balance-due-display');
    const balanceRow = document.getElementById('balance-row');
    const discValEl = document.getElementById('discount-val');
    const billLinesEl = document.getElementById('bill-extra-lines');
    const ecList = document.getElementById('ec-list');
    const ecName = document.getElementById('ec-name');
    const ecAmount = document.getElementById('ec-amount');

    function renderEC() {
      ecList.innerHTML = addedCharges.length === 0
        ? '<div style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:1rem;">No services added yet.</div>'
        : addedCharges.map((c, i) => `
        <div class="ec-item">
          <span style="font-size:0.9rem;font-weight:500;">${c.name}</span>
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-display);font-size:1rem;color:var(--gold-bright);">${GM.fmt.currency(c.amount)}</span>
            <span class="badge ${c.isPaid ? 'badge--success' : 'badge--warning'}" style="font-size:0.6rem;padding:2px 6px;">${c.isPaid ? 'PAID' : 'DUE'}</span>
            <button onclick="window.__gmRemoveEC(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px;">✕</button>
          </div>
        </div>
      `).join('');

      if (addedCharges.length === 0) {
        billLinesEl.innerHTML = '<div class="bill-empty-row">No manual adjustments</div>';
      } else {
        billLinesEl.innerHTML = addedCharges.map(c => `
          <div class="bill-extra-item">
            <span>
              ${c.name}
              <span class="badge badge--tiny ${c.isPaid ? 'badge--success' : 'badge--warning'}">${c.isPaid ? 'PAID' : 'DUE'}</span>
            </span>
            <span style="font-weight:500;">${GM.fmt.currency(c.amount)}</span>
          </div>
        `).join('');
      }
      calcBalance();
    }

    window.__gmRemoveEC = (i) => {
      addedCharges.splice(i, 1);
      renderEC();
    };

    function addEC(isPaid) {
      const name = ecName.value.trim() || 'Service Charge';
      const amount = parseFloat(ecAmount.value) || 0;
      if (amount <= 0) {
        GM.toast('Enter a valid amount', 'warning');
        ecAmount.focus();
        return;
      }
      addedCharges.push({ name, amount, isPaid });
      ecName.value = ''; ecAmount.value = '';
      renderEC();
      GM.toast(`Added ${name}: ${GM.fmt.currency(amount)}`, 'success');
    }

    document.getElementById('ec-add-paid').addEventListener('click', () => addEC(true));
    document.getElementById('ec-add-due').addEventListener('click', () => addEC(false));

    function calcBalance() {
      const disc = parseFloat(discountInput.value) || 0;
      if (discValEl) discValEl.textContent = disc;
      const totalExtra = addedCharges.reduce((s, c) => s + c.amount, 0);
      const totalDue = addedCharges.filter(c => !c.isPaid).reduce((s, c) => s + c.amount, 0);
      const adj = totalExtra - disc;
      const balance = Math.max(0, totalDue - disc);
      grandDisplay.textContent = GM.fmt.currency(grandTotal + adj);
      balanceEl.textContent = GM.fmt.currency(balance);
      balanceRow.className = 'bill-balance' + (balance > 0 ? ' bill-balance--due' : '');
      const hiddenEc = document.getElementById('extra-charges');
      if (hiddenEc) hiddenEc.value = totalExtra;
      return balance;
    }
    discountInput.addEventListener('input', calcBalance);
    calcBalance();

    function syncPrintValues() {
      const extraTotal = addedCharges.reduce((s, c) => s + c.amount, 0);
      const ecValEl = document.getElementById('extra-charges-val');
      if (ecValEl) ecValEl.textContent = extraTotal;
      if (discValEl) discValEl.textContent = discountInput.value || '0';
    }

    // Print
    document.getElementById('print-bill-btn').addEventListener('click', () => {
      syncPrintValues();
      window.print();
    });

    // PDF
    document.getElementById('save-pdf-btn').addEventListener('click', async () => {
      syncPrintValues();
      const btn = document.getElementById('save-pdf-btn');
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
        const extra = addedCharges.reduce((s, c) => s + c.amount, 0);
        const disc = parseFloat(discountInput.value) || 0;
        let y = 15; const lm = 14, rw = 134;

        // Header
        doc.setFillColor(248, 245, 237); doc.rect(0, 0, 148, 28, 'F');
        doc.setFontSize(16); doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 26, 26);
        doc.text('THE GRANDE MIST', 74, 12, { align: 'center' });
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
        doc.text('KODAIKANAL, DINDIGUL  ·  ★★★★', 74, 19, { align: 'center' });
        doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.5); doc.line(0, 28, 148, 28);
        y = 36;

        // Guest info
        doc.setTextColor(26, 26, 26); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(`Guest: `, lm, y); doc.setFont('helvetica', 'bold'); doc.text(booking.guestName, lm + 14, y);
        doc.setFont('helvetica', 'normal'); doc.text(`Room: `, 85, y); doc.setFont('helvetica', 'bold'); doc.text(`${booking.roomNumber} — ${room.type}`, 97, y); y += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(`Check-in: ${GM.fmt.date(booking.checkIn)}`, lm, y);
        doc.text(`Check-out: ${GM.fmt.date(booking.checkOut)}  (${nights} nights)`, 85, y); y += 4;
        doc.setDrawColor(220); doc.setLineWidth(0.2); doc.line(lm, y, lm + rw, y); y += 5;

        const sections = [
          { title: 'ROOM CHARGES', items: roomPays },
          { title: 'FOOD ORDERS', items: foodPays },
          { title: 'EVENTS', items: eventPays },
          { title: 'EXTRA SERVICES', items: pays.filter(p => p.type === 'extra') },
        ];
        sections.forEach(({ title, items }) => {
          if (!items.length) return;
          doc.setFillColor(240, 240, 240); doc.rect(lm - 2, y - 4, rw + 4, 7, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(60);
          doc.text(title, lm, y); y += 5;
          items.forEach(p => {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(26, 26, 26);
            doc.text(p.description, lm + 2, y);
            doc.text(GM.fmt.currency(p.amount), lm + rw, y, { align: 'right' });
            // Paid badge
            doc.setFontSize(6); doc.setTextColor(22, 101, 52);
            doc.text('✓ PAID', lm + rw - 22, y); y += 4.5;
            doc.setFontSize(7); doc.setTextColor(120);
            doc.text(`${fmtPaidAt(p.paidAt)}  ·  ${p.method}`, lm + 2, y); y += 5.5;
          });
        });

        // Adjustments (Due charges and Discounts)
        const dueCharges = addedCharges.filter(c => !c.isPaid);
        if (dueCharges.length || disc) {
          doc.setDrawColor(220); doc.line(lm, y, lm + rw, y); y += 4;
          doc.setFontSize(7); doc.setTextColor(60); doc.setFont('helvetica', 'bold');
          doc.text('ADJUSTMENTS', lm, y); y += 5;
          dueCharges.forEach(c => {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(26, 26, 26);
            doc.text(c.name, lm + 2, y);
            doc.text(GM.fmt.currency(c.amount), lm + rw, y, { align: 'right' });
            doc.setFontSize(6); doc.setTextColor(153, 27, 27);
            doc.text('! DUE', lm + rw - 22, y); y += 5;
          });
          if (disc) {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(26, 26, 26);
            doc.text('Total Discount', lm + 2, y);
            doc.text(`- ${GM.fmt.currency(disc)}`, lm + rw, y, { align: 'right' }); y += 5;
          }
        }

        // Final Totals
        y = Math.max(y, 165);
        doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.5); doc.line(lm, y, lm + rw, y); y += 6;
        doc.setTextColor(26, 26, 26); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text('GRAND TOTAL', lm, y);
        doc.text(GM.fmt.currency(grandTotal + (parseFloat(document.getElementById('extra-charges').value) || 0) - disc), lm + rw, y, { align: 'right' }); y += 5;

        doc.setFontSize(8); doc.setTextColor(100);
        const balPayable = calcBalance();
        doc.text(balPayable > 0 ? `Balance Payable: ${GM.fmt.currency(balPayable)}` : 'Balance: ₹0 (Fully Paid)', lm, y); y += 8;
        doc.setTextColor(160); doc.setFontSize(7);
        doc.text(`Bill No: ${billNo}   ·   ${generatedAt}`, lm, y);

        doc.save(`GrandeMist-Bill-${booking.guestName.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`);
      } catch (err) {
        GM.toast('PDF failed: ' + err.message, 'error');
      }
      GM.btnLoading(btn, false);
    });

    // Confirm checkout
    document.getElementById('confirm-checkout-btn').addEventListener('click', async () => {
      const balance = calcBalance();
      const disc = parseFloat(document.getElementById('discount').value) || 0;
      const totalExtra = addedCharges.reduce((s, c) => s + c.amount, 0);

      GM.confirm('Confirm Check-out',
        `Finalise check-out for ${booking.guestName}? Total: ${GM.fmt.currency(grandTotal + totalExtra - disc)} · Balance Payable: ${GM.fmt.currency(balance)}`,
        async () => {
          const coBtn = document.getElementById('confirm-checkout-btn');
          GM.btnLoading(coBtn, true);

          try {
            // 1. Process Paid extra charges as individual payments
            for (const ec of addedCharges) {
              if (ec.isPaid) {
                await MockData.addPaymentToStay({
                  bookingId: booking.id,
                  type: 'extra',
                  description: ec.name,
                  amount: ec.amount,
                  method: 'Counter',
                  ref: 'Added at Checkout',
                  paidAt: new Date().toISOString()
                });
              }
            }

            // 2. Pass only Due charges to completeStay
            const dueExtrasTotal = addedCharges.filter(c => !c.isPaid).reduce((s, c) => s + c.amount, 0);
            const bill = await MockData.completeStay(booking.id, dueExtrasTotal, disc);

            document.getElementById('checkout-success').classList.remove('hidden');
            const actionsEl = document.getElementById('bill-actions');
            if (actionsEl) actionsEl.style.display = 'none';

            coBtn.classList.add('hidden');
            const msg = `${booking.guestName} checked out successfully. Bill ${bill ? bill.billNo : billNo} saved.`;
            document.getElementById('checkout-success-msg').textContent = msg;
            GM.toast('✔ ' + msg, 'success');

            // Scroll to success message
            document.getElementById('checkout-success').scrollIntoView({ behavior: 'smooth' });
          } catch (err) {
            GM.toast('Error during checkout: ' + err.message, 'error');
          } finally {
            GM.btnLoading(coBtn, false);
          }
        }, 'Confirm Check-out', false);
    });
  }
})();
