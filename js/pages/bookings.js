/* bookings.js — Bookings list page — localStorage-backed */
(function () {
  const main = document.getElementById('main-content');

  main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1>Bookings</h1>
          <p>All guest reservations and their current status</p>
        </div>
        <a href="#bookings-new" class="btn btn--primary" id="new-booking-btn">＋ New Booking</a>
      </div>
    </div>
    <div class="page-content">
      <div class="filter-bar animate-in">
        <div class="search-wrap">
          <input class="form-input" type="search" id="booking-search" placeholder="Search guest, room…" aria-label="Search bookings">
        </div>
        <select class="form-select" id="status-filter" style="max-width:180px;">
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="due_checkout">Due Checkout</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input class="form-input" type="date" id="date-filter" style="max-width:180px;" aria-label="Filter by date">
        <button class="btn btn--ghost btn--sm" id="clear-filters">Clear</button>
      </div>

      <div class="table-wrap animate-in">
        <table id="bookings-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Guest Name</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Nights</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="bookings-body"></tbody>
        </table>
      </div>
      <div id="bookings-empty" class="empty-state hidden">
        <span>📋</span>No bookings yet. <a href="#bookings-new" style="color:var(--gold-bright);">Create your first booking →</a>
      </div>
    </div>
  `;

  const tbody = document.getElementById('bookings-body');
  const searchInput = document.getElementById('booking-search');
  const statusSel = document.getElementById('status-filter');
  const dateSel = document.getElementById('date-filter');
  const emptyState = document.getElementById('bookings-empty');

  function renderTable() {
    const q = searchInput.value.toLowerCase();
    const status = statusSel.value;
    const dateVal = dateSel.value;
    const bookings = MockData.bookings;

    const filtered = bookings.filter(b => {
      const matchQ = (b.guestName + b.roomNumber + b.id).toLowerCase().includes(q);
      const matchS = !status || b.status === status;
      const matchD = !dateVal || b.checkIn === dateVal || b.checkOut === dateVal;
      return matchQ && matchS && matchD;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(b => {
      const nights = GM.nights(b.checkIn, b.checkOut);
      const viewLink = b.status === 'due_checkout'
        ? `#checkout?booking=${b.id}`
        : b.status === 'confirmed'
          ? `#checkin?booking=${b.id}`
          : `#booking-detail?booking=${b.id}`;
      return `
        <tr>
          <td style="font-size:0.78rem;color:var(--text-muted);">${b.id}</td>
          <td style="font-weight:500;">${b.guestName}</td>
          <td>Room ${b.roomNumber}</td>
          <td>${GM.fmt.date(b.checkIn)}</td>
          <td>${GM.fmt.date(b.checkOut)}</td>
          <td>${nights}</td>
          <td>${GM.statusBadge(b.status)}</td>
          <td><a href="${viewLink}" class="btn btn--sm btn--ghost">View →</a></td>
        </tr>`;
    }).join('');
  }

  searchInput.addEventListener('input', renderTable);
  statusSel.addEventListener('change', renderTable);
  dateSel.addEventListener('change', renderTable);
  document.getElementById('clear-filters').addEventListener('click', () => {
    searchInput.value = ''; statusSel.value = ''; dateSel.value = '';
    renderTable();
  });

  renderTable();
})();
