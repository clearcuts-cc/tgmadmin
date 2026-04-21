/* rooms.js — Room Board page module */
(async function () {
  const main = document.getElementById('main-content');
  let viewDate = MockData.TODAY;

  async function renderPage() {
    main.innerHTML = `
      <div class="page-header animate-in">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem;">
          <div>
            <h1>Room Board</h1>
            <p style="font-size:0.875rem;color:var(--text-secondary);opacity:0.9;">Viewing status for: <strong>${GM.fmt.date(viewDate)}</strong></p>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <label for="board-date" style="font-size:0.8rem;color:var(--text-primary);font-weight:600;margin-right:0.25rem;">Check Date:</label>
            <div style="display:flex;align-items:center;background:var(--bg-body);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;">
              <button class="btn btn--sm btn--ghost" id="day-prev" style="padding:0.45rem 0.75rem;border-radius:0;border-right:1px solid var(--border);">←</button>
              <input type="date" id="board-date" value="${viewDate}" class="form-control" style="width:150px;background:transparent;border:none;color:var(--text-primary);font-weight:600;text-align:center;padding:0 0.5rem;font-size:0.9rem;">
              <button class="btn btn--sm btn--ghost" id="day-next" style="padding:0.45rem 0.75rem;border-radius:0;border-left:1px solid var(--border);">→</button>
            </div>
            <button class="btn btn--secondary btn--sm" id="reset-today" style="margin-left:0.5rem;">Today</button>
          </div>
        </div>
      </div>
      <div class="page-content">
        <div class="room-grid animate-in" id="room-grid"></div>
      </div>

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
    const dateInput = document.getElementById('board-date');

    dateInput.addEventListener('change', (e) => {
      viewDate = e.target.value;
      updateBoard();
    });

    document.getElementById('day-prev').addEventListener('click', () => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() - 1);
      viewDate = d.toISOString().split('T')[0];
      dateInput.value = viewDate;
      updateBoard();
    });

    document.getElementById('day-next').addEventListener('click', () => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() + 1);
      viewDate = d.toISOString().split('T')[0];
      dateInput.value = viewDate;
      updateBoard();
    });

    document.getElementById('reset-today').addEventListener('click', () => {
      viewDate = MockData.TODAY;
      dateInput.value = viewDate;
      updateBoard();
    });

    function updateBoard() {
      renderGrid();
      document.querySelector('.page-header p strong').textContent = GM.fmt.date(viewDate);
    }

    document.getElementById('panel-close').addEventListener('click', () => {
      panel.classList.remove('open');
      grid.classList.remove('panel-open');
    });

    await renderGrid();
  }

  const STATUS_META = {
    available: { icon: '🌿', label: 'Available' },
    confirmed: { icon: '🔵', label: 'Confirmed' },
    occupied: { icon: '🔴', label: 'Occupied' },
    due_checkout: { icon: '⏰', label: 'Due Checkout' },
    maintenance: { icon: '🔧', label: 'Maintenance' },
  };

  async function renderGrid() {
    const grid = document.getElementById('room-grid');
    if (!grid) return;

    const cRooms = await window.RoomCache.getRooms();
    const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status }));
    
    if (rooms.length === 0) {
      grid.innerHTML = `<div class="empty-state">No rooms added yet. Go to Settings → Room Management to add your first room.</div>`;
      return;
    }

    grid.innerHTML = rooms.map(room => {
      const st = MockData.getRoomStatus(room.id, viewDate);
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
    const grid = document.getElementById('room-grid');
    const panel = document.getElementById('room-panel');
    const r = await window.RoomCache.getRoomById(roomId);
    if (!r) return;
    const room = { id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night, status: r.status };

    const st = MockData.getRoomStatus(room.id, viewDate);
    const booking = MockData.bookings.find(b => b.roomId === roomId && !['cancelled', 'checked_out'].includes(b.status) && viewDate >= b.checkIn && viewDate <= b.checkOut);
    const isMaint = st === 'maintenance';

    document.getElementById('panel-room-num').textContent = `Room ${room.number}`;
    document.getElementById('panel-room-type').textContent = room.type;

    const statusExplain = {
      available: 'No active booking — room is free to assign.',
      confirmed: 'Confirmed upcoming booking.',
      occupied: 'Occupied/Reserved during this period.',
      due_checkout: 'Scheduled checkout on this date.',
      maintenance: 'Room is manually set to maintenance mode.',
    };

    let body = `
      <div style="margin-bottom:1rem;">
        ${GM.statusBadge(st)}
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem;line-height:1.5;">${statusExplain[st] || ''}</div>
      </div>
      <div class="detail-rows">
        <div class="detail-row"><span class="detail-row__label">Rate</span><span class="detail-row__value">${GM.fmt.currency(room.rate)} / night</span></div>
        <div class="detail-row"><span class="detail-row__label">Floor</span><span class="detail-row__value">Floor ${room.floor}</span></div>
      </div>`;

    if (booking) {
      body += `
        <div class="divider divider--gold" style="margin:0.85rem 0;"></div>
        <h4 style="margin-bottom:0.6rem;">Guest Details</h4>
        <div class="detail-rows">
          <div class="detail-row"><span class="detail-row__label">Guest</span><span class="detail-row__value" style="font-weight:600;">${booking.guestName}</span></div>
          <div class="detail-row"><span class="detail-row__label">Dates</span><span class="detail-row__value" style="font-size:0.8rem;">${GM.fmt.date(booking.checkIn)} - ${GM.fmt.date(booking.checkOut)}</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.45rem;margin-top:1.25rem;">
          ${st === 'confirmed' ? `<a href="#checkin?roomId=${room.id}" class="btn btn--blue">Check-in Guest</a>` : ''}
          <a href="#booking-detail?booking=${booking.id}" class="btn btn--primary">View Booking Details</a>
          <button class="btn btn--danger btn--sm" id="quick-cancel-btn" style="margin-top:0.25rem;">No Show / Cancel</button>
        </div>`;
    } else if (!isMaint) {
      body += `
        <div class="empty-state" style="padding:1rem 0;"><span>🌿</span>No active booking — room is free.</div>
        <a href="#bookings-new?roomId=${room.id}&checkIn=${viewDate}" class="btn btn--primary btn--full">＋ New Booking</a>`;
    }

    /* Only admins can toggle maintenance mode */
    if (window.GMIsAdmin) {
      body += `
      <div class="divider" style="margin:1rem 0;"></div>
      <h4 style="margin-bottom:0.5rem;">🔧 Maintenance Override</h4>
      <button class="maintenance-toggle ${isMaint ? 'active' : ''}" id="maint-toggle-btn" data-room="${roomId}">
        ${isMaint ? 'Clear Maintenance' : 'Set to Maintenance'}
      </button>`;
    }

    document.getElementById('panel-body').innerHTML = body;
    panel.classList.add('open');
    if (window.innerWidth < 768) grid.classList.add('panel-open');

    const maintBtn = document.getElementById('maint-toggle-btn');
    if (maintBtn) {
      maintBtn.addEventListener('click', function () {
        if (st === 'maintenance') {
          MockData.clearMaintenance(roomId);
          renderGrid();
          openPanel(roomId);
        } else {
          MockData.setMaintenance(roomId);
          renderGrid();
          openPanel(roomId);
        }
      });
    }

    const cancelBtn = document.getElementById('quick-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        GM.confirm('Cancel Booking', 
          `Are you sure you want to cancel the booking for <strong>${booking.guestName}</strong>?<br><br><span style="color:var(--text-muted);font-size:0.85rem;">This will free up Room ${room.number} for this date.</span>`,
          () => {
            GM.prompt('Reason for Cancellation', 'Optional: Why are you cancelling this booking?', (reason) => {
              GM.btnLoading(cancelBtn, true);
              setTimeout(async () => {
                await MockData.cancelBooking(booking.id, reason || 'Cancelled from Room Board (No Show)');
                renderGrid();
                openPanel(roomId);
              }, 600);
            }, 'No show');
          },
          'Yes, Cancel Booking', true);
      });
    }
  }

  await renderPage();

  const onDataChange = () => renderGrid();
  window.addEventListener('gm:data-change', onDataChange);

  window.__gmPageCleanup = () => {
    window.removeEventListener('gm:data-change', onDataChange);
  };
})();

