/* rooms.js — Room Board page module */
(async function () {
  const main = document.getElementById('main-content');

  main.innerHTML = `
    <div class="page-header animate-in">
      <h1>Room Board</h1>
      <p>Live occupancy view — status derived from bookings · maintenance is manually set</p>
    </div>
    <div class="page-content">

      <!-- Room Grid -->
      <div class="room-grid animate-in" id="room-grid"></div>
    </div>

    <!-- Side Panel -->
    <div class="side-panel" id="room-panel">
      <div class="side-panel__header">
        <div>
          <div class="side-panel__title" id="panel-room-num">Room Details</div>
          <div style="font-size:0.78rem;color:var(--text-muted);" id="panel-room-type"></div>
        </div>
        <button class="side-panel__close" id="panel-close">✕</button>
      </div>
      <div class="side-panel__body" id="panel-body"></div>
    </div>
  `;

  const grid = document.getElementById('room-grid');
  const panel = document.getElementById('room-panel');
  document.getElementById('panel-close').addEventListener('click', () => {
    panel.classList.remove('open');
    grid.classList.remove('panel-open');
  });

  const STATUS_META = {
    available: { icon: '🌿', label: 'Available' },
    confirmed: { icon: '🔵', label: 'Confirmed' },
    occupied: { icon: '🔴', label: 'Occupied' },
    due_checkout: { icon: '⏰', label: 'Due Checkout' },
    maintenance: { icon: '🔧', label: 'Maintenance' },
  };

  async function renderGrid() {
    const cRooms = await window.RoomCache.getRooms();
    const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status }));
    if (rooms.length === 0) { grid.innerHTML = `<div class="empty-state">No rooms added yet. Go to Settings → Room Management to add your first room.</div>`; return; }
    grid.innerHTML = rooms.map(room => {
      const st = MockData.getRoomStatus(room.id);
      const meta = STATUS_META[st] || STATUS_META.available;
      return `
        <div class="room-card room-card--${st} animate-in"
             data-room-id="${room.id}" role="button" tabindex="0"
             aria-label="Room ${room.number} — ${meta.label}">
          <div class="room-card__icon">${meta.icon}</div>
          <div class="room-card__number">${room.number}</div>
          <div class="room-card__type">${room.type}</div>
          <div class="room-card__badge">${GM.statusBadge(st)}</div>
          <div style="margin-top:0.75rem;font-size:0.75rem;color:var(--text-muted);">
            ${GM.fmt.currency(room.rate)}<span style="opacity:0.6"> / night</span>
          </div>
          ${st === 'maintenance' ? `<div style="margin-top:0.4rem;font-size:0.68rem;color:var(--purple);font-weight:600;letter-spacing:0.06em;">MANUAL OVERRIDE</div>` : ''}
        </div>`;
    }).join('');

    grid.querySelectorAll('.room-card').forEach(card => {
      card.addEventListener('click', () => openPanel(card.dataset.roomId));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') openPanel(card.dataset.roomId);
      });
    });
  }

  async function openPanel(roomId) {
    const r = await window.RoomCache.getRoomById(roomId);
    const room = r ? { id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status } : null;

    const st = room ? MockData.getRoomStatus(room.id) : 'available';
    const booking = MockData.getActiveBookingForRoom(roomId);
    const isMaint = st === 'maintenance';

    document.getElementById('panel-room-num').textContent = `Room ${room.number}`;
    document.getElementById('panel-room-type').textContent = room.type;

    const statusExplain = {
      available: 'No active booking — room is free to assign.',
      confirmed: 'Guest has a confirmed upcoming booking and has not yet arrived.',
      occupied: 'Guest is currently checked in. Checkout is still future.',
      due_checkout: 'Guest is checked in and TODAY is their scheduled checkout date.',
      maintenance: 'Room is manually set to maintenance mode by admin.',
    };

    let body = `
      <div style="margin-bottom:1rem;">
        ${GM.statusBadge(st)}
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem;line-height:1.5;">${statusExplain[st] || ''}</div>
      </div>
      <div class="detail-rows">
        <div class="detail-row"><span class="detail-row__label">Rate</span><span class="detail-row__value">${GM.fmt.currency(room.rate)} / night</span></div>
        <div class="detail-row"><span class="detail-row__label">Floor</span><span class="detail-row__value">Floor ${room.floor}</span></div>
        <div class="detail-row">
          <span class="detail-row__label">Status Source</span>
          <span class="detail-row__value" style="font-size:0.8rem;">
            ${isMaint ? `<span style="color:var(--purple);">🔧 Manual (admin set)</span>` : `<span style="color:var(--teal);">📋 Derived from booking data</span>`}
          </span>
        </div>
      </div>`;

    if (booking) {
      const nights = GM.nights(booking.checkIn, booking.checkOut);
      body += `
        <div class="divider divider--gold" style="margin:0.85rem 0;"></div>
        <h4 style="margin-bottom:0.6rem;">Current / Upcoming Guest</h4>
        <div class="detail-rows">
          <div class="detail-row"><span class="detail-row__label">Guest</span><span class="detail-row__value" style="font-weight:600;">${booking.guestName}</span></div>
          <div class="detail-row"><span class="detail-row__label">Booking</span><span class="detail-row__value" style="font-size:0.8rem;color:var(--text-muted);">${booking.id}</span></div>
          <div class="detail-row"><span class="detail-row__label">Check-in</span><span class="detail-row__value">${GM.fmt.date(booking.checkIn)}</span></div>
          <div class="detail-row"><span class="detail-row__label">Check-out</span><span class="detail-row__value">${GM.fmt.date(booking.checkOut)}</span></div>
          <div class="detail-row"><span class="detail-row__label">Nights</span><span class="detail-row__value">${nights}</span></div>
          <div class="detail-row"><span class="detail-row__label">Guests</span><span class="detail-row__value">${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${booking.children ? ', ' + booking.children + ' child' + (booking.children > 1 ? 'ren' : '') : ''}</span></div>
          ${booking.specialRequests ? `<div class="detail-row"><span class="detail-row__label">Requests</span><span class="detail-row__value">${booking.specialRequests}</span></div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:0.45rem;margin-top:1rem;">
          <a href="#booking-detail?booking=${booking.id}" class="btn btn--primary">View Booking Details</a>
          ${booking.status === 'confirmed' ? `<a href="#checkin?booking=${booking.id}" class="btn btn--teal">✔ Confirm Check-in</a>` : ''}
          ${booking.status === 'due_checkout' || (booking.status === 'checked_in' && booking.checkOut === MockData.TODAY)
          ? `<a href="#checkout?booking=${booking.id}" class="btn btn--secondary">↩ Process Check-out</a>` : ''}
        </div>`;
    } else if (!isMaint) {
      body += `
        <div class="empty-state" style="padding:1rem 0;"><span>🌿</span>No active booking — room is free.</div>
        <a href="#bookings-new" class="btn btn--primary btn--full">＋ New Booking</a>`;
    }

    body += `
      <div class="divider" style="margin:1rem 0;"></div>`;

    /* Only admins can toggle maintenance mode */
    if (window.GMIsAdmin) {
      body += `
      <h4 style="margin-bottom:0.5rem;">🔧 Maintenance Override</h4>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.75rem;">
        Manually mark this room as under maintenance — overrides all booking-derived statuses.
      </p>
      <button class="maintenance-toggle ${isMaint ? 'active' : ''}" id="maint-toggle-btn" data-room="${roomId}">
        ${isMaint ? '🔧 MAINTENANCE ACTIVE — Click to clear' : '⚙ Set Room to Maintenance'}
      </button>`;
    }

    document.getElementById('panel-body').innerHTML = body;
    panel.classList.add('open');
    if (window.innerWidth < 768) {
      grid.classList.add('panel-open');
    }

    const maintBtn = document.getElementById('maint-toggle-btn');
    if (maintBtn) {
      maintBtn.addEventListener('click', function () {
        const rid = this.dataset.room;
        if (st === 'maintenance') {
          GM.confirm('Clear Maintenance',
            `Remove maintenance flag from Room ${room.number}? Status will revert to booking data.`,
            () => { MockData.clearMaintenance(rid); GM.toast(`Room ${room.number} — maintenance cleared.`, 'info'); renderGrid(); openPanel(rid); },
            'Clear Maintenance', false);
        } else {
          GM.confirm('Set Maintenance',
            `Mark Room ${room.number} as under maintenance? This overrides any active booking status.`,
            () => { MockData.setMaintenance(rid); GM.toast(`Room ${room.number} set to maintenance mode.`, 'warning'); renderGrid(); openPanel(rid); },
            'Set Maintenance', true);
        }
      });
    }
  }

  renderGrid();
})();
