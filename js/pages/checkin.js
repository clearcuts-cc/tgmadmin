/* checkin.js — Check-in flow:
 *   #checkin           → Room selector board (confirmed rooms only)
 *   #checkin?roomId=X  → Check-in process for that room's booking
 *   #checkin?booking=Y → (legacy) Check-in process by bookingId
 */
(async function () {
  const main = document.getElementById('main-content');

  /* ── Route: decide which view to render ──────────────────── */
  const roomIdParam = GMRouteParam('roomId');
  const bookingParam = GMRouteParam('booking');

  if (roomIdParam || bookingParam) {
    renderCheckInForm(roomIdParam, bookingParam);
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

    main.innerHTML = `
        <div class="page-header animate-in">
          <h1>Check-in — Select Room</h1>
          <p>Click a <strong style="color:var(--blue)">confirmed</strong> room to begin the check-in process</p>
        </div>
        <div class="page-content">
          <div class="status-legend animate-in" style="margin-bottom:1.25rem;">
            <div class="legend-item"><div class="legend-dot" style="background:var(--blue)"></div> Confirmed — click to check in</div>
            <div class="legend-item" style="opacity:0.5;"><div class="legend-dot" style="background:var(--red)"></div> Occupied — already checked in</div>
            <div class="legend-item" style="opacity:0.5;"><div class="legend-dot" style="background:var(--green)"></div> Available — no booking</div>
            <div class="legend-item" style="opacity:0.5;"><div class="legend-dot" style="background:var(--orange)"></div> Due Checkout</div>
            <div class="legend-item" style="opacity:0.5;"><div class="legend-dot" style="background:var(--purple)"></div> Maintenance</div>
          </div>
          <div class="room-grid animate-in" id="checkin-room-grid"></div>
        </div>`;

    const grid = document.getElementById('checkin-room-grid');

    const TODAY_STR = new Date().toISOString().split('T')[0];

    grid.innerHTML = rooms.map(room => {
      const st = MockData.getRoomStatus(room.id);
      const meta = STATUS_META[st] || STATUS_META.available;
      const booking = MockData.getActiveBookingForRoom(room.id);
      // Only show as check-in-ready if booking is confirmed AND check-in date is today or before
      const isActive = st === 'confirmed' && booking && booking.checkIn <= TODAY_STR;
      const dimmed = !isActive;

      const guestLine = (isActive && booking)
        ? `<div style="margin-top:0.5rem;font-size:0.78rem;color:var(--blue);font-weight:500;">${booking.guestName}</div>
                   <div style="font-size:0.72rem;color:var(--text-muted);">In: ${GM.fmt.date(booking.checkIn)}</div>`
        : '';

      return `
          <div class="room-card room-card--${st} ${isActive ? 'room-card--checkin-active' : 'room-card--dimmed'}"
               data-room-id="${room.id}"
               ${isActive ? `role="button" tabindex="0" aria-label="Check in Room ${room.number} — ${booking ? booking.guestName : ''}"` : 'aria-disabled="true"'}>
            <div class="room-card__icon">${meta.icon}</div>
            <div class="room-card__number">${room.number}</div>
            <div class="room-card__type">${room.type}</div>
            <div class="room-card__badge">${GM.statusBadge(st)}</div>
            <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-muted);">
              ${GM.fmt.currency(room.rate)}<span style="opacity:0.6"> / night</span>
            </div>
            ${guestLine}
            ${isActive ? `<div style="margin-top:0.6rem;font-size:0.72rem;color:var(--blue);font-weight:600;letter-spacing:0.06em;">TAP TO CHECK IN ›</div>` : ''}
          </div>`;
    }).join('');

    // Only attach click to confirmed rooms
    grid.querySelectorAll('.room-card--checkin-active').forEach(card => {
      const roomId = card.dataset.roomId;
      card.addEventListener('click', () => {
        window.location.hash = `#checkin?roomId=${roomId}`;
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') window.location.hash = `#checkin?roomId=${roomId}`;
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
   * VIEW 2 — Check-in Process Form
   * ═════════════════════════════════════════════════════════ */
  async function renderCheckInForm(roomId, bookingId) {
    const cRooms = await window.RoomCache.getRooms();
    const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status }));
    // Resolve booking: prefer roomId lookup, fall back to bookingId param
    let booking = null;
    let room = null;

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
              <a href="#checkin" class="btn btn--ghost btn--sm">← Back</a>
              <div><h1>Guest Check-in</h1></div>
            </div>
          </div>
          <div class="page-content">
            <div class="empty-state"><span>✔</span>No confirmed booking found for this room.</div>
            <div style="text-align:center;margin-top:1rem;">
              <a href="#checkin" class="btn btn--primary">← Select a Room</a>
            </div>
          </div>`;
      return;
    }

    const guest = MockData.getGuestById(booking.guestId);
    const nights = GM.nights(booking.checkIn, booking.checkOut);
    const roomTotal = nights * room.rate;

    main.innerHTML = `
        <div class="page-header animate-in">
          <div style="display:flex;align-items:center;gap:1rem;">
            <a href="#checkin" class="btn btn--ghost btn--sm">← Room Board</a>
            <div><h1>Guest Check-in</h1><p>Verify identity, collect payment &amp; confirm check-in</p></div>
          </div>
        </div>
        <div class="page-content">
          <div style="max-width:700px;margin:0 auto;">

            <!-- Guest card -->
            <div class="guest-summary-card card mb-md animate-in">
              <div class="guest-photo" style="width:90px;height:90px;font-size:2.5rem;">👤</div>
              <div style="flex:1;">
                <div style="font-size:0.7rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.35rem;">Guest Arriving</div>
                <h2 style="font-size:1.5rem;margin-bottom:0.3rem;">${booking.guestName}</h2>
                <p style="font-size:0.88rem;margin-bottom:0.5rem;">${guest ? guest.phone : ''} &nbsp;·&nbsp; Aadhaar: <span style="font-family:monospace;">${guest ? guest.aadhaar : '—'}</span></p>
                ${GM.statusBadge(booking.status)}
              </div>
            </div>

            <!-- Info grid -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;" id="checkin-info-grid">
              <div class="card animate-in animate-in-delay-1">
                <h4 style="margin-bottom:0.75rem;">Room Assigned</h4>
                <div style="font-family:var(--font-display);font-size:2rem;font-weight:600;margin-bottom:0.25rem;">${room.number}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);">${room.type}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Floor ${room.floor} · ${GM.fmt.currency(room.rate)}/night</div>
              </div>
              <div class="card animate-in animate-in-delay-2">
                <h4 style="margin-bottom:0.75rem;">Stay Summary</h4>
                <div class="bill-row"><span>Check-in</span><strong>${GM.fmt.date(booking.checkIn)}</strong></div>
                <div class="bill-row"><span>Check-out</span><strong>${GM.fmt.date(booking.checkOut)}</strong></div>
                <div class="bill-row"><span>Nights</span><strong>${nights}</strong></div>
                <div class="bill-row"><span>Guests</span><strong>${booking.adults}A ${booking.children ? '+' + booking.children + 'C' : ''}</strong></div>
              </div>
            </div>

            ${booking.specialRequests ? `
            <div class="card mb-md animate-in animate-in-delay-3" style="border-left:2px solid var(--gold-bright);">
              <h4 style="margin-bottom:0.4rem;">Special Requests</h4>
              <p style="font-size:0.9rem;">${booking.specialRequests}</p>
            </div>` : ''}

            <!-- Verification checklist -->
            <div class="card mb-md animate-in animate-in-delay-3">
              <h4 style="margin-bottom:0.75rem;">Verification Checklist</h4>
              <div style="display:flex;flex-direction:column;gap:0.6rem;">
                ${['Identity verified against Aadhaar', 'Guest photo matched', 'Room key handed over', 'House rules explained'].map((item, i) => `
                  <label style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;font-size:0.9rem;" for="chk-${i}">
                    <input type="checkbox" id="chk-${i}" style="accent-color:var(--green);width:18px;height:18px;">
                    ${item}
                  </label>`).join('')}
              </div>
            </div>

            <!-- Payment Collection -->
            <div class="card mb-md animate-in animate-in-delay-4" style="border-color:var(--gold-mid);" id="payment-section">
              <h3 style="margin-bottom:0.1rem;">💳 Room Payment Collection</h3>
              <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;">Collect room charges at check-in before confirming</p>

              <div class="bill-section">
                <div class="bill-section__title">Charge Breakdown</div>
                <div class="bill-row">
                  <span>Room Charges (${nights} night${nights > 1 ? 's' : ''} × ${GM.fmt.currency(room.rate)})</span>
                  <strong>${GM.fmt.currency(roomTotal)}</strong>
                </div>
                <div class="bill-row">
                  <span id="ci-gst-label">Room GST (0%)</span>
                  <strong id="ci-gst-amount">₹0</strong>
                </div>
              </div>
              <div class="bill-grand" style="margin-bottom:1.25rem;">
                <span class="bill-grand__label">Amount to Collect</span>
                <span class="bill-grand__value" id="ci-grand-total">${GM.fmt.currency(roomTotal)}</span>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;" id="payment-form-grid">
                <div class="form-group">
                  <label class="form-label" for="ci-payment-method">Payment Method *</label>
                  <select class="form-select" id="ci-payment-method">
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="NEFT">NEFT / Bank Transfer</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="ci-payment-ref">Reference No. (optional)</label>
                  <input class="form-input" type="text" id="ci-payment-ref" placeholder="e.g. UPI ref, txn ID…">
                </div>
              </div>
            </div>

            <!-- Success -->
            <div id="checkin-success" class="hidden animate-in">
              <div class="card" style="text-align:center;border-color:var(--green);background:var(--green-bg);">
                <div style="font-size:3rem;margin-bottom:0.5rem;">✅</div>
                <h2 style="color:var(--green);margin-bottom:0.4rem;">Check-in Confirmed!</h2>
                <p>${booking.guestName} is now checked in to Room ${room.number}. Room charges of ${GM.fmt.currency(roomTotal)} collected.</p>
                <div style="display:flex;gap:0.75rem;justify-content:center;margin-top:1rem;flex-wrap:wrap;">
                  <a href="#orders?booking=${booking.id}" class="btn btn--secondary">🍽 Food Orders</a>
                  <a href="#events" class="btn btn--ghost">🎉 Events</a>
                  <a href="#checkin" class="btn btn--teal">✔ Next Check-in</a>
                  <a href="#dashboard" class="btn btn--ghost">← Dashboard</a>
                </div>
              </div>
            </div>

            <button class="btn btn--primary btn--full btn--lg animate-in" id="confirm-checkin" style="margin-bottom:0.5rem;">
              ✔ Collect Payment &amp; Confirm Check-in
            </button>
            <button class="btn btn--danger btn--full animate-in" id="cancel-booking-btn" style="margin-bottom:0.5rem;">
              ✕ Cancel Booking
            </button>
            <a href="#checkin" class="btn btn--ghost btn--full">← Back to Room Board</a>

          </div>
        </div>`;

    const roomGST = window.GMSettings ? window.GMSettings.get('roomGST') : 12;
    const gstAmount = Math.round(roomTotal * (roomGST / 100));
    const grandTotal = roomTotal + gstAmount;

    document.getElementById('ci-gst-label').textContent = `Room GST (${roomGST}%)`;
    document.getElementById('ci-gst-amount').textContent = GM.fmt.currency(gstAmount);
    document.getElementById('ci-grand-total').textContent = GM.fmt.currency(grandTotal);

    // Responsive grids
    const infoGrid = document.getElementById('checkin-info-grid');
    const payGrid = document.getElementById('payment-form-grid');
    function handleResize() {
      const col = window.innerWidth < 600 ? '1fr' : '1fr 1fr';
      if (infoGrid) infoGrid.style.gridTemplateColumns = col;
      if (payGrid) payGrid.style.gridTemplateColumns = col;
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    window.__gmPageCleanup = () => window.removeEventListener('resize', handleResize);

    document.getElementById('confirm-checkin').addEventListener('click', () => {
      const method = document.getElementById('ci-payment-method').value;
      const ref = document.getElementById('ci-payment-ref').value.trim();

      const roomGST = window.GMSettings ? window.GMSettings.get('roomGST') : 12;
      const gstAmount = Math.round(roomTotal * (roomGST / 100));
      const grandTotal = roomTotal + gstAmount;

      GM.confirm('Confirm Check-in & Payment',
        `Collect ${GM.fmt.currency(grandTotal)} (${method}) from ${booking.guestName} and check in to Room ${room.number}?`,
        async () => {
          const btn = document.getElementById('confirm-checkin');
          GM.btnLoading(btn, true);
          try {
            await MockData.startStay(booking, room, method, ref);
            await MockData.updateBookingStatus(booking.id, 'checked_in');

            document.getElementById('checkin-success').classList.remove('hidden');
            document.getElementById('payment-section').classList.add('hidden');
            btn.classList.add('hidden');
            GM.toast(`✔ ${booking.guestName} checked in to Room ${room.number} · ${GM.fmt.currency(grandTotal)} via ${method}`, 'success');
          } catch (err) {
            console.error('Check-in error:', err);
            // Error toast shown by MockData
          } finally {
            GM.btnLoading(btn, false);
          }
        }, 'Collect & Check In', false);
    });

    // Cancel Booking Logic
    const cancelBtn = document.getElementById('cancel-booking-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        GM.confirm('Cancel Booking',
          `Are you sure you want to cancel this booking for <strong>${booking.guestName}</strong> — Room ${room.number}?<br><br>Check-in: ${GM.fmt.date(booking.checkIn)} | Check-out: ${GM.fmt.date(booking.checkOut)}<br><br><span style="color:var(--text-muted);font-size:0.85rem;">This action cannot be undone. You will be asked for a reason next.</span>`,
          () => {
            // Use custom prompt instead of window.prompt
            GM.prompt('Cancellation Reason', 'Please provide a reason for cancellation (optional):', (reason) => {
              GM.btnLoading(cancelBtn, true);
              setTimeout(async () => {
                try {
                  await MockData.cancelBooking(booking.id, reason);
                  window.location.hash = '#checkin'; // Go back to selector
                } catch (err) {
                  console.error('Cancellation error:', err);
                } finally {
                  GM.btnLoading(cancelBtn, false);
                }
              }, 800);
            }, 'No reason provided', 'Confirm Cancellation');
          },
          'Yes, Cancel Booking', true);
      });
    }
  }
})();
