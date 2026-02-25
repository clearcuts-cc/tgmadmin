/* booking-detail.js — Booking Detail page module */
(async function () {
  const main = document.getElementById('main-content');
  const bookingId = GMRouteParam('booking');
  const booking = MockData.getBookingById(bookingId);
  const guest = booking ? MockData.getGuestById(booking.guestId) : null;

  if (!booking) {
    main.innerHTML = `
      <div class="page-header"><h1>Booking Detail</h1></div>
      <div class="page-content"><div class="empty-state"><span>📋</span>Booking not found.</div></div>`;
    return;
  }

  const r = await window.RoomCache.getRoomById(booking.roomId);
  const room = r ? { id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status } : { number: booking.roomNumber, type: 'Unknown Room', rate: 0, status: 'error' };
  const nights = GM.nights(booking.checkIn, booking.checkOut);

  main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;gap:1rem;">
        <a href="#bookings" class="btn btn--ghost btn--sm">← Back</a>
        <div>
          <h1>Booking ${booking.id}</h1>
          <p>${booking.guestName} · Room ${booking.roomNumber}</p>
        </div>
      </div>
    </div>
    <div class="page-content">
      <div style="display:grid;grid-template-columns:1fr 380px;gap:1.5rem;" id="detail-grid">

        <!-- Left -->
        <div>
          <div class="guest-summary-card card mb-md animate-in">
            <div class="guest-photo">👤</div>
            <div>
              <h2 style="font-size:1.3rem;">${booking.guestName}</h2>
              <p style="font-size:0.85rem;margin-bottom:0.5rem;">${guest ? guest.phone : '—'} &nbsp;·&nbsp; ${guest ? guest.email : '—'}</p>
              ${GM.statusBadge(booking.status)}
            </div>
          </div>

          <div class="card mb-md animate-in animate-in-delay-1">
            <h3 style="margin-bottom:1rem;">Personal Details</h3>
            <div class="detail-rows">
              <div class="detail-row"><span class="detail-row__label">Full Name</span><span class="detail-row__value">${booking.guestName}</span></div>
              <div class="detail-row"><span class="detail-row__label">Phone</span><span class="detail-row__value">${guest ? guest.phone : '—'}</span></div>
              <div class="detail-row"><span class="detail-row__label">Email</span><span class="detail-row__value">${guest ? guest.email : '—'}</span></div>
              <div class="detail-row"><span class="detail-row__label">Address</span><span class="detail-row__value">${guest ? guest.address : '—'}</span></div>
              <div class="detail-row"><span class="detail-row__label">Aadhaar No.</span><span class="detail-row__value" style="font-family:monospace;letter-spacing:0.05em;">${guest ? guest.aadhaar : '—'}</span></div>
            </div>
          </div>

          <div class="card animate-in animate-in-delay-2">
            <h3 style="margin-bottom:1rem;">📎 Documents</h3>
            <div class="form-grid form-grid--2">
              <div>
                <div class="form-label" style="margin-bottom:0.5rem;">Aadhaar Card</div>
                <div class="doc-img"><span>🪪</span><span>Aadhaar image placeholder</span></div>
              </div>
              <div>
                <div class="form-label" style="margin-bottom:0.5rem;">Guest Photo</div>
                <div class="doc-img"><span>📷</span><span>Photo placeholder</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right -->
        <div>
          <div class="card mb-md animate-in">
            <h3 style="margin-bottom:1rem;">🗓 Booking Details</h3>
            <div class="detail-rows">
              <div class="detail-row"><span class="detail-row__label">Booking ID</span><span class="detail-row__value" style="font-size:0.82rem;color:var(--text-muted);">${booking.id}</span></div>
              <div class="detail-row"><span class="detail-row__label">Room</span><span class="detail-row__value">${room.number} — ${room.type}</span></div>
              <div class="detail-row"><span class="detail-row__label">Check-in</span><span class="detail-row__value">${GM.fmt.date(booking.checkIn)}</span></div>
              <div class="detail-row"><span class="detail-row__label">Check-out</span><span class="detail-row__value">${GM.fmt.date(booking.checkOut)}</span></div>
              <div class="detail-row"><span class="detail-row__label">Nights</span><span class="detail-row__value" style="font-family:var(--font-display);font-size:1.1rem;">${nights}</span></div>
              <div class="detail-row"><span class="detail-row__label">Guests</span><span class="detail-row__value">${booking.adults} adults${booking.children ? ', ' + booking.children + ' children' : ''}</span></div>
              <div class="detail-row"><span class="detail-row__label">Rate</span><span class="detail-row__value">${GM.fmt.currency(room.rate)} / night</span></div>
              <div class="detail-row"><span class="detail-row__label">Room Total</span><span class="detail-row__value text-gold" style="font-size:1.1rem;font-family:var(--font-display);">${GM.fmt.currency(nights * room.rate)}</span></div>
              ${booking.specialRequests ? `<div class="detail-row"><span class="detail-row__label">Special Req.</span><span class="detail-row__value">${booking.specialRequests}</span></div>` : ''}
            </div>
          </div>

          <div class="card animate-in animate-in-delay-1">
            <h3 style="margin-bottom:1rem;">⚡ Actions</h3>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              ${booking.status === 'confirmed' ? `<button class="btn btn--teal btn--full" id="confirm-checkin-btn">✔ Confirm Check-in</button>` : ''}
              ${booking.status === 'checked_in' || booking.status === 'due_checkout'
      ? `<a href="#checkout?booking=${booking.id}" class="btn btn--secondary btn--full">↩ Process Check-out</a>` : ''}
              ${booking.status === 'checked_out' ? `<div class="badge badge--gray" style="justify-content:center;padding:0.5rem;">Stay Completed</div>` : ''}
              <a href="#orders?booking=${booking.id}" class="btn btn--ghost btn--full">🧾 View Food Orders</a>
              <a href="#guest-profile?guest=${booking.guestId}" class="btn btn--ghost btn--full">👤 View Guest Profile</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Responsive
  const detailGrid = document.getElementById('detail-grid');
  function handleResize() {
    if (detailGrid) detailGrid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 380px';
  }
  window.addEventListener('resize', handleResize);
  handleResize();
  window.__gmPageCleanup = () => window.removeEventListener('resize', handleResize);

  // Check-in confirm
  const checkinBtn = document.getElementById('confirm-checkin-btn');
  if (checkinBtn) {
    checkinBtn.addEventListener('click', () => {
      GM.confirm('Confirm Guest Check-in',
        `Are you sure you want to check in ${booking.guestName} to Room ${booking.roomNumber}?`,
        () => {
          GM.btnLoading(checkinBtn, true);
          setTimeout(() => {
            MockData.updateBookingStatus(booking.id, 'checked_in');
            GM.toast(`${booking.guestName} checked in to Room ${booking.roomNumber}!`, 'success');
            checkinBtn.innerHTML = '✔ Checked In';
            checkinBtn.disabled = true;
            checkinBtn.className = 'btn btn--ghost btn--full';
          }, 1000);
        },
        'Check In Now', false);
    });
  }
})();
