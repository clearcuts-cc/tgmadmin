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
      payments = [
        { type: 'room', description: `Room charges — ${nights} nights × ${GM.fmt.currency(rate)}`, amount: nights * rate, paidAt: booking.checkIn || new Date().toISOString(), method: 'Cash', ref: '' }
      ];
    }

    const roomGST = window.GMSettings ? window.GMSettings.get('roomGST') : 12;
    const roomSubtotal = nights * rate;
    const roomGstAmt = Math.round(roomSubtotal * (roomGST / 100));
    const roomChargeTotal = roomSubtotal + roomGstAmt;

    const bookingOrders = MockData.orders.filter(o => o.bookingId === booking.id);
    const totalFoodOrders = bookingOrders.reduce((s, o) => s + o.total, 0);

    const roomPays = payments.filter(p => p.type === 'room');
    const roomPaymentsTotal = roomPays.reduce((s, p) => s + p.amount, 0);

    const foodPays = payments.filter(p => p.type === 'food');
    const eventPays = payments.filter(p => p.type === 'event');
    const advancePays = payments.filter(p => p.type === 'advance');
    const advanceTotal = Math.abs(advancePays.reduce((s, p) => s + p.amount, 0));

    // Total of service payments (food, events, extras) which are already settled
    const servicePays = payments.filter(p => ['food', 'event', 'extra'].includes(p.type));
    const servicesTotal = servicePays.reduce((s, p) => s + p.amount, 0);

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
    const s = window.GMSettings ? window.GMSettings.getAll() : {};
    const stars = '★'.repeat(s.resortStars || 4);

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
        </style>
        <div class="page-header animate-in">
          <div style="display:flex;align-items:center;gap:1rem;">
            <a href="#checkout" class="btn btn--ghost btn--sm">← Room Board</a>
            <div><h1>Guest Check-out</h1><p>Final consolidated bill for ${booking.guestName}</p></div>
          </div>
        </div>
        <div class="page-content" style="padding-top:0;">

          <div id="bill-print-area">
            <div class="receipt-bill animate-in">

              <!-- HEADER -->
              <div class="rb-header" style="text-align: center;">
                <img src="assets/logo.png" alt="Logo" style="max-width: 64px; max-height: 64px; margin: 0 auto 0.5rem auto; display: block; object-fit: contain;">
                <h1 class="rb-resort-name">${s.resortName || 'THE GRAND MIST'}</h1>
                <p class="rb-resort-sub">${s.resortAddress || 'KODAIKANAL, DINDIGUL'} · ${stars}</p>
              </div>

              <div class="rb-divider-full"></div>

              <!-- GUEST INFO ROW -->
              <div class="rb-info-grid">
                <div class="rb-info-col">
                  <span class="rb-info-label">GUEST</span>
                  <span class="rb-info-value">${booking.guestName}</span>
                </div>
                <div class="rb-info-col">
                  <span class="rb-info-label">ROOM</span>
                  <span class="rb-info-value">${booking.roomNumber} — ${room.type}</span>
                </div>
              </div>

              <div class="rb-info-grid">
                <div class="rb-info-col">
                  <span class="rb-info-label">CHECK-IN</span>
                  <span class="rb-info-value">${GM.fmt.date(booking.checkIn)}</span>
                </div>
                <div class="rb-info-col">
                  <span class="rb-info-label">CHECK-OUT · NIGHTS</span>
                  <span class="rb-info-value">${GM.fmt.date(booking.checkOut)} · ${nights} nights</span>
                </div>
              </div>

              <div class="rb-divider-full"></div>

              <!-- ROOM CHARGES SECTION -->
              <div class="rb-section-label">🏠 ROOM CHARGES</div>
              <div class="rb-row">
                <div class="rb-row-left">
                  <span class="rb-row-title">Room Rent — ${nights} nights × ${GM.fmt.currency(rate)}</span>
                  <span class="rb-row-meta">${GM.fmt.date(booking.checkIn)} to ${GM.fmt.date(booking.checkOut)}</span>
                </div>
                <span class="rb-row-amount">${GM.fmt.currency(roomSubtotal)}</span>
              </div>
              <div class="rb-row">
                <div class="rb-row-left">
                  <span class="rb-row-title">GST (${roomGST}%)</span>
                </div>
                <span class="rb-row-amount">${GM.fmt.currency(roomGstAmt)}</span>
              </div>

              <div class="rb-divider-full"></div>

              <!-- FOOD ORDERS SECTION -->
              ${bookingOrders.length ? `
                <div class="rb-section-label">🍽 FOOD ORDERS</div>
                ${bookingOrders.map(ord => {
      const isPaid = ord.paymentStatus === 'paid';
      const itemsDesc = ord.items.map(i => `${i.name} ×${i.qty}`).join(', ');
      return `
                  <div class="rb-row">
                    <div class="rb-row-left">
                      <span class="rb-row-title">Order #${ord.id.slice(0, 6)}: ${itemsDesc}</span>
                      <span class="rb-row-meta">${GM.fmt.date(ord.createdAt)}</span>
                    </div>
                    <div class="rb-row-right">
                      <span class="rb-row-amount">${GM.fmt.currency(ord.total)}</span>
                      <span class="rb-paid-tag ${isPaid ? '' : 'rb-unpaid-tag'}">${isPaid ? '✓ PAID' : '🔴 UNPAID'}</span>
                    </div>
                  </div>`;
    }).join('')}` : ''}

              <div class="rb-divider-full"></div>

              <!-- EVENTS SECTION -->
              ${eventPays.length ? (function () {
        const total = eventPays.reduce((s, p) => s + p.amount, 0);
        const desc = eventPays.map(p => {
          let d = p.description || '';
          d = d.replace(/^Event:\s*/i, '');
          d = d.split('—')[0].trim();
          return d;
        }).join(', ');

        return `
                  <div class="rb-section-label">🎉 EVENTS</div>
                  <div class="rb-row">
                    <div class="rb-row-left">
                      <span class="rb-row-title">Events: ${desc}</span>
                    </div>
                    <div class="rb-row-right">
                      <span class="rb-row-amount">${GM.fmt.currency(total)}</span>
                      <span class="rb-paid-tag">✓ PAID</span>
                    </div>
                  </div>`;
      })() : ''}

              <div class="rb-divider-full"></div>

              <!-- ADJUSTMENTS SECTION -->
              <div id="rb-adjustments-section" style="display:none;">
                <div class="rb-section-label">⚖ ADJUSTMENTS</div>
                <div id="bill-extra-lines"></div>
                <div class="rb-row" id="rb-discount-row" style="display:none;">
                  <div class="rb-row-left">
                    <span class="rb-row-title">Overall Discount</span>
                  </div>
                  <span class="rb-row-amount">- ₹<span id="discount-val">0</span></span>
                </div>
                <div class="rb-divider-full"></div>
              </div>

              <div class="rb-divider-full"></div>

              <!-- TOTALS SECTION -->
              <div class="rb-section-label">💳 PAYMENT SUMMARY</div>
              <div class="rb-row">
                <div class="rb-row-left">
                  <span class="rb-row-title">Gross Total</span>
                </div>
                <span class="rb-row-amount" id="gross-total-display">${GM.fmt.currency(roomChargeTotal + servicesTotal)}</span>
              </div>

              <div id="rb-deductions-list">
                <div class="rb-row" id="rb-summary-services" style="border-bottom:none; display:none;">
                  <div class="rb-row-left">
                    <span class="rb-row-title">Services Settlement</span>
                  </div>
                  <span class="rb-row-amount" id="summary-services-amt" style="color:#666;"></span>
                </div>

                <div class="rb-row" id="rb-summary-advance" style="border-bottom:none; ${advanceTotal > 0 ? '' : 'display:none;'}">
                  <div class="rb-row-left">
                    <span class="rb-row-title">Advance Deposit</span>
                  </div>
                  <span class="rb-row-amount" id="summary-advance-amt" style="color:#166534;">-${GM.fmt.currency(advanceTotal)}</span>
                </div>

                <div class="rb-row" id="rb-summary-checkin" style="border-bottom:none; ${roomPaymentsTotal > 0 ? '' : 'display:none;'}">
                  <div class="rb-row-left">
                    <span class="rb-row-title">Check-in Deposit</span>
                  </div>
                  <span class="rb-row-amount" id="summary-checkin-amt" style="color:#166534;">-${GM.fmt.currency(roomPaymentsTotal)}</span>
                </div>
              </div>

              <div class="rb-total-row" style="border-top: 1px dashed #e0e0e0; margin-top: 0.5rem;">
                <span class="rb-total-label">Net Payable Amount</span>
                <span class="rb-total-amount" id="grand-total-display">${GM.fmt.currency(Math.max(0, roomChargeTotal - advanceTotal - roomPaymentsTotal))}</span>
              </div>
              
              <div id="net-room-balance" style="display:none;"></div>

              <div class="rb-divider-full"></div>

              <div class="rb-overall-amount-box" style="border: 2px solid #000; background: #f8f8f8; color: #000; padding: 1.25rem; text-align: center; margin-bottom: 1.5rem; border-radius: 4px; -webkit-print-color-adjust: exact;">
                <div style="font-size: 0.85rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.5rem; color: #000;">Overall Bill Amount</div>
                <div style="font-size: 2.2rem; font-weight: 900; color: #000;" id="overall-total-display">${GM.fmt.currency(roomChargeTotal + servicesTotal)}</div>
              </div>

              <div class="rb-divider-full"></div>

              <div class="rb-balance-row" id="balance-row">
                <span class="rb-balance-label">Balance Due Now</span>
                <span class="rb-balance-amount" id="balance-due-display">₹0</span>
              </div>

              <div class="rb-divider-full"></div>

              <!-- FOOTER -->
              <div class="rb-footer">
                <span>Bill No: <strong>${billNo}</strong></span>
                <span>Generated: ${generatedAt}</span>
              </div>

            </div><!-- end receipt-bill -->
          </div><!-- end bill-print-area -->

          <!-- Interactive Controls (Outside Print Area) -->
          <div class="extra-charges-section animate-in" style="max-width:680px; margin: 2rem auto;">
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
            
            <hr style="border:none; border-top:1px dashed rgba(255,255,255,0.1); margin:1.5rem 0;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <span style="font-size:1rem;font-weight:500;">Apply Overall Discount</span>
              <input type="number" id="discount" value="0" min="0" placeholder="0" class="form-input" style="width:120px;text-align:right;">
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:1rem;font-weight:500;color:rgba(100,220,120,0.9);">💵 Pay Balanced Due</span>
              <input type="number" id="paid-now" value="0" min="0" placeholder="0" class="form-input" style="width:130px;text-align:right;">
            </div>
          </div>

          <!-- Action buttons -->
          <div id="bill-actions" class="bill-actions" style="max-width:720px;margin:1.25rem auto 0;display:flex;gap:1rem;flex-wrap:wrap;">
            <button class="btn btn--ghost" id="print-bill-btn">🖨 Print Bill</button>
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
        billLinesEl.innerHTML = '';
      } else {
        billLinesEl.innerHTML = addedCharges.map(c => `
          <div class="rb-row">
            <div class="rb-row-left">
              <span class="rb-row-title">${c.name}</span>
              <span class="rb-row-meta">${c.isPaid ? 'Already Settle' : 'Charge to Room'}</span>
            </div>
            <div class="rb-row-right">
              <span class="rb-row-amount">${GM.fmt.currency(c.amount)}</span>
              ${c.isPaid ? '<span class="rb-paid-tag">✓ PAID</span>' : ''}
            </div>
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
      const totalExtraPaid = addedCharges.filter(c => c.isPaid).reduce((s, c) => s + c.amount, 0);
      const totalExtraDue = addedCharges.filter(c => !c.isPaid).reduce((s, c) => s + c.amount, 0);
      const paidNow = parseFloat(document.getElementById('paid-now')?.value) || 0;

      // Update summary table real-time
      // Gross = Room + All Food + Active Stay Events (usually already paid) + New Extra Paid
      const currentGross = roomChargeTotal + totalFoodOrders + servicesTotal - foodPays.reduce((s, p) => s + p.amount, 0) + totalExtraPaid;
      const grossEl = document.getElementById('gross-total-display');
      if (grossEl) grossEl.textContent = GM.fmt.currency(currentGross);
      
      const overallTotalEl = document.getElementById('overall-total-display');
      const overallDiscountedTotal = Math.max(0, currentGross - disc);
      if (overallTotalEl) overallTotalEl.textContent = GM.fmt.currency(overallDiscountedTotal);

      const srvAmtEl = document.getElementById('summary-services-amt');
      // Services Settlement = Sum of all payments already made (excluding room and advance)
      const totalSettled = servicesTotal + totalExtraPaid;
      if (srvAmtEl) {
        srvAmtEl.textContent = `-${GM.fmt.currency(totalSettled)}`;
        const srvRow = document.getElementById('rb-summary-services');
        if (srvRow) srvRow.style.display = totalSettled > 0 ? 'flex' : 'none';
      }

      const roomBal = Math.max(0, roomChargeTotal - advanceTotal - roomPaymentsTotal);
      const netRoomEl = document.getElementById('net-room-balance');
      if (netRoomEl) netRoomEl.textContent = GM.fmt.currency(roomBal);

      // Unpaid food orders contribution
      const unpaidFoodTotal = bookingOrders.filter(o => o.paymentStatus !== 'paid').reduce((s, o) => s + o.total, 0);

      const currentNetTotal = Math.max(0, roomBal + unpaidFoodTotal + totalExtraDue - disc);
      if (grandDisplay) grandDisplay.textContent = GM.fmt.currency(currentNetTotal);

      // Visibility toggles for adjustments
      const adjSection = document.getElementById('rb-adjustments-section');
      if (adjSection) adjSection.style.display = (addedCharges.length > 0 || disc > 0) ? 'block' : 'none';
      const discRow = document.getElementById('rb-discount-row');
      if (discRow) discRow.style.display = disc > 0 ? 'flex' : 'none';

      const balance = Math.max(0, currentNetTotal - paidNow);
      if (balanceEl) balanceEl.textContent = GM.fmt.currency(balance);
      if (balanceRow) balanceRow.className = 'rb-balance-row' + (balance > 0 ? ' rb-balance-row--due' : '');

      const hiddenEc = document.getElementById('extra-charges');
      if (hiddenEc) hiddenEc.value = totalExtra;
      return balance;
    }
    discountInput.addEventListener('input', calcBalance);
    document.getElementById('paid-now').addEventListener('input', calcBalance);
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


    // Confirm checkout
    document.getElementById('confirm-checkout-btn').addEventListener('click', async () => {
      const balance = calcBalance();
      const disc = parseFloat(document.getElementById('discount').value) || 0;
      const totalExtra = addedCharges.reduce((s, c) => s + c.amount, 0);

      GM.confirm('Confirm Check-out',
        `Finalise check-out for ${booking.guestName}? Room Balance: ${GM.fmt.currency(roomChargeTotal - advanceTotal + totalExtra - disc)} · Balance Payable Now: ${GM.fmt.currency(balance)}`,
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

            // 2. Record "Amount Paid Now" if entered
            const paidNow = parseFloat(document.getElementById('paid-now')?.value) || 0;
            if (paidNow > 0) {
              await MockData.addPaymentToStay(booking.id, {
                type: 'extra',
                description: `Payment received at checkout`,
                amount: paidNow,
                method: 'Cash',
                ref: 'Checkout Counter',
                paidAt: new Date().toISOString()
              });
            }

            // 3. Pass only Due charges to completeStay
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
