/* dashboard.js — Dashboard page module */
(async function () {
  const main = document.getElementById('main-content');

  function getTimeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  // Compute live stats
  const cRooms = await window.RoomCache.getRooms();
  const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night }));
  const bookings = MockData.bookings;
  const occupied = rooms.filter(r => MockData.getRoomStatus(r.id) === 'occupied').length;
  const available = rooms.filter(r => MockData.getRoomStatus(r.id) === 'available').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const dueCheckout = rooms.filter(r => MockData.getRoomStatus(r.id) === 'due_checkout').length;
  const maintenance = rooms.filter(r => MockData.getRoomStatus(r.id) === 'maintenance').length;
  const occupancyPct = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;

  const checkedInBookings = bookings.filter(b => b.status === 'checked_in' || b.status === 'due_checkout');
  const todayArrivals = bookings.filter(b => b.status === 'confirmed' && b.checkIn === MockData.TODAY);
  const todayDepartures = bookings.filter(b => (b.status === 'checked_in' || b.status === 'due_checkout') && b.checkOut === MockData.TODAY);

  main.innerHTML = `
    <div class="page-header animate-in">
      <h1>Dashboard</h1>
      <p>Good ${getTimeGreeting()} · ${GM.fmt.date(MockData.TODAY)} · Live resort overview</p>
    </div>

    <div class="page-content">

      <!-- STAT CARDS -->
      <div class="stat-grid">
        <div class="stat-card animate-in" style="--accent-color:var(--green);">
          <div class="stat-card__label">Available Rooms</div>
          <div class="stat-card__value" style="color:var(--green);">${available}</div>
          <div class="stat-card__sub">Ready for check-in</div>
          <div class="stat-card__icon">🌿</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-1" style="--accent-color:var(--red);">
          <div class="stat-card__label">Occupied Rooms</div>
          <div class="stat-card__value" style="color:var(--red);">${occupied}</div>
          <div class="stat-card__sub">Of ${rooms.length} total rooms</div>
          <div class="stat-card__icon">🔴</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-2" style="--accent-color:var(--teal);">
          <div class="stat-card__label">Today's Check-ins</div>
          <div class="stat-card__value" style="color:var(--teal);">${todayArrivals.length}</div>
          <div class="stat-card__sub">Arriving today</div>
          <div class="stat-card__icon">✔</div>
        </div>
        <div class="stat-card animate-in animate-in-delay-3" style="--accent-color:var(--orange);">
          <div class="stat-card__label">Today's Check-outs</div>
          <div class="stat-card__value" style="color:var(--orange);">${todayDepartures.length}</div>
          <div class="stat-card__sub">Departing today</div>
          <div class="stat-card__icon">↩</div>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="section-heading animate-in"><h3>Quick Actions</h3></div>
      <div class="quick-actions animate-in">
        <a href="#bookings-new" class="btn btn--primary">＋ New Booking</a>
        <a href="#rooms" class="btn btn--secondary">🏠 Room Board</a>
        <a href="#checkin" class="btn btn--teal">✔ Check-in Guest</a>
        <a href="#checkout" class="btn btn--ghost">↩ Process Check-out</a>
        <a href="#orders" class="btn btn--ghost">🍽 Food Orders</a>
        <a href="#events" class="btn btn--ghost">🎉 Events</a>
      </div>

      <!-- 2-COLUMN GRID -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;" id="dash-grid">

        <!-- Today's Activity -->
        <div class="card animate-in">
          <h3 style="margin-bottom:1rem;">📅 Today's Activity</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.25rem;">
            <div style="background:var(--green-bg);border:1px solid rgba(62,180,140,0.2);border-radius:var(--radius-sm);padding:0.85rem;text-align:center;">
              <div style="font-family:var(--font-display);font-size:1.75rem;font-weight:600;color:var(--green);">${todayArrivals.length}</div>
              <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-top:0.2rem;">Arriving</div>
            </div>
            <div style="background:var(--orange-bg);border:1px solid rgba(230,154,54,0.2);border-radius:var(--radius-sm);padding:0.85rem;text-align:center;">
              <div style="font-family:var(--font-display);font-size:1.75rem;font-weight:600;color:var(--orange);">${todayDepartures.length}</div>
              <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-top:0.2rem;">Departing</div>
            </div>
          </div>

          ${todayArrivals.length > 0 ? `
          <div style="margin-bottom:0.75rem;">
            <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--green);margin-bottom:0.5rem;">Arrivals Today</div>
            ${todayArrivals.slice(0, 3).map(b => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-size:0.88rem;font-weight:500;">${b.guestName}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">Room ${b.roomNumber}</div>
                </div>
                <a href="#checkin?booking=${b.id}" class="btn btn--sm btn--teal">Check-in</a>
              </div>`).join('')}
          </div>` : ''}

          ${todayDepartures.length > 0 ? `
          <div>
            <div style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--orange);margin-bottom:0.5rem;">Departures Today</div>
            ${todayDepartures.slice(0, 3).map(b => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border);">
                <div>
                  <div style="font-size:0.88rem;font-weight:500;">${b.guestName}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">Room ${b.roomNumber}</div>
                </div>
                <a href="#checkout?booking=${b.id}" class="btn btn--sm btn--ghost">Check-out</a>
              </div>`).join('')}
          </div>` : ''}

          ${todayArrivals.length === 0 && todayDepartures.length === 0 ? `
          <div class="empty-state" style="padding:1.5rem 0;">
            <span>🌿</span>No check-ins or check-outs scheduled for today.
          </div>` : ''}
        </div>

        <!-- Room Status Overview -->
        <div class="card animate-in animate-in-delay-1">
          <h3 style="margin-bottom:1rem;">🏠 Room Status Overview</h3>
          ${rooms.map(room => {
    const st = MockData.getRoomStatus(room.id);
    const booking = MockData.getActiveBookingForRoom(room.id);
    const colors = { available: 'var(--green)', occupied: 'var(--red)', confirmed: 'var(--blue)', due_checkout: 'var(--orange)', maintenance: 'var(--purple)' };
    const icons = { available: '🌿', occupied: '🔴', confirmed: '🔵', due_checkout: '⏰', maintenance: '🔧' };
    return `
              <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--border);">
                <div style="width:36px;height:36px;background:var(--bg-raised);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:600;font-size:0.9rem;border:1px solid ${colors[st] || 'var(--border)'};color:${colors[st] || 'var(--text-secondary)'};">${room.number}</div>
                <div style="flex:1;">
                  <div style="font-size:0.82rem;font-weight:500;">${room.type}</div>
                  ${booking ? `<div style="font-size:0.72rem;color:var(--text-muted);">${booking.guestName}</div>` : `<div style="font-size:0.72rem;color:var(--text-muted);">${GM.fmt.currency(room.rate)}/night</div>`}
                </div>
                ${GM.statusBadge(st)}
              </div>`;
  }).join('')}
          <div style="margin-top:1rem;text-align:center;">
            <a href="#rooms" class="btn btn--ghost btn--sm">View Full Room Board →</a>
          </div>
        </div>

        <!-- Recent Bookings -->
        <div class="card animate-in animate-in-delay-2">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
            <h3>Recent Bookings</h3>
            <a href="#bookings" class="btn btn--sm btn--ghost">View All</a>
          </div>
          <div class="table-wrap" style="border:none;">
            <table>
              <thead><tr><th>Guest</th><th>Room</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${bookings.length === 0
      ? `<tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text-muted);">No bookings yet</td></tr>`
      : [...bookings].reverse().slice(0, 6).map(b => `
                  <tr>
                    <td style="font-weight:500;">${b.guestName}</td>
                    <td>Room ${b.roomNumber}</td>
                    <td>${GM.statusBadge(b.status)}</td>
                    <td><a href="#booking-detail?booking=${b.id}" class="btn btn--sm btn--ghost">→</a></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Room Stats -->
        <div class="card animate-in animate-in-delay-3">
          <h3 style="margin-bottom:1rem;">📊 Quick Stats</h3>
          <div style="display:flex;flex-direction:column;gap:0.85rem;">
            ${[
      { label: 'Available', val: available, color: 'var(--green)', pct: rooms.length ? Math.round(available / rooms.length * 100) : 0 },
      { label: 'Occupied', val: occupied, color: 'var(--red)', pct: rooms.length ? Math.round(occupied / rooms.length * 100) : 0 },
      { label: 'Confirmed', val: confirmed, color: 'var(--blue)', pct: rooms.length ? Math.round(confirmed / rooms.length * 100) : 0 },
      { label: 'Due Checkout', val: dueCheckout, color: 'var(--orange)', pct: rooms.length ? Math.round(dueCheckout / rooms.length * 100) : 0 },
      { label: 'Maintenance', val: maintenance, color: 'var(--purple)', pct: rooms.length ? Math.round(maintenance / rooms.length * 100) : 0 },
    ].map(s => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:0.3rem;">
                  <span style="color:var(--text-secondary);">${s.label}</span>
                  <span style="color:${s.color};font-weight:600;">${s.val} rooms</span>
                </div>
                <div class="progress-bar"><div class="progress-bar__fill" style="width:${s.pct}%;background:${s.color};"></div></div>
              </div>`).join('')}
          </div>
          <div style="margin-top:1.25rem;padding:0.85rem;background:var(--gold-glow);border:1px solid var(--border-accent);border-radius:var(--radius-sm);">
            <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.25rem;">Total Guests (Active)</div>
            <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:600;color:var(--gold-bright);">
              ${checkedInBookings.reduce((s, b) => s + b.adults + (b.children || 0), 0)} guests
            </div>
          </div>
        </div>

      </div><!-- end dash-grid -->
    </div><!-- end page-content -->
  `;

  // Responsive grid
  const dashGrid = document.getElementById('dash-grid');
  function handleResize() {
    if (dashGrid) dashGrid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 1fr';
  }
  window.addEventListener('resize', handleResize);
  handleResize();
  window.__gmPageCleanup = () => window.removeEventListener('resize', handleResize);
})();
