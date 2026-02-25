/* reports.js — Reports & Analytics — computed from localStorage data */
(function () {
  const main = document.getElementById('main-content');

  /* ── Compute analytics from real localStorage data ─────────── */
  function computeReports(fromDate, toDate) {
    const history = MockData.history;
    const activeStays = Object.values(MockData.activeStays);
    const orders = MockData.orders;

    // Monthly bucketing helper
    function monthKey(dateStr) {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }

    const occupancyMap = {};
    const revenueMap = {};
    const guestCountMap = {};

    // 1. Process History (Completed Stays)
    history.forEach(rec => {
      if (fromDate && rec.checkIn < fromDate) return;
      if (toDate && rec.checkIn > toDate) return;
      const k = monthKey(rec.checkIn);
      if (!k) return;
      occupancyMap[k] = (occupancyMap[k] || 0) + (rec.nights || 0);
      revenueMap[k] = (revenueMap[k] || 0) + (rec.grandTotal || 0);
      guestCountMap[k] = (guestCountMap[k] || 0) + 1;
    });

    // 2. Process Active Stays (Live Data)
    activeStays.forEach(stay => {
      if (fromDate && stay.checkinDate < fromDate) return;
      if (toDate && stay.checkinDate > toDate) return;
      const k = monthKey(stay.checkinDate);
      if (!k) return;
      occupancyMap[k] = (occupancyMap[k] || 0) + (stay.nights || 0);
      // For revenue, we sum their current payments
      const stayRev = stay.payments.reduce((s, p) => s + p.amount, 0);
      revenueMap[k] = (revenueMap[k] || 0) + stayRev;
      guestCountMap[k] = (guestCountMap[k] || 0) + 1;
    });

    // 3. Process Orders (including one-off) for category stats
    const months = Array.from(new Set([...Object.keys(occupancyMap), ...Object.keys(revenueMap), ...Object.keys(guestCountMap)]))
      .sort((a, b) => new Date('01 ' + a) - new Date('01 ' + b));

    const cats = ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages'];
    const foodMap = {};
    cats.forEach(c => { foodMap[c] = { orders: 0, revenue: 0 }; });
    orders.forEach(ord => {
      const d = ord.time ? ord.time.split('T')[0] : '';
      if (fromDate && d < fromDate) return;
      if (toDate && d > toDate) return;

      ord.items.forEach(item => {
        const menuItem = MockData.menu.find(m => m.id === item.menuId);
        const cat = menuItem ? menuItem.category : 'snacks';
        if (foodMap[cat]) {
          foodMap[cat].orders += item.qty;
          foodMap[cat].revenue += item.price * item.qty;
        }
      });
    });

    const foodStats = cats.map(c => ({
      category: c.charAt(0).toUpperCase() + c.slice(1),
      orders: foodMap[c].orders,
      revenue: foodMap[c].revenue,
    }));

    // KPIs
    const totalRevenue = Object.values(revenueMap).reduce((s, v) => s + v, 0);
    const totalNights = Object.values(occupancyMap).reduce((s, v) => s + v, 0);
    const totalOrdersCount = orders.length;

    const roomCount = window.__gmRoomCount || 1;
    const occupancy = months.map(m => ({ month: m, pct: Math.min(100, Math.round((occupancyMap[m] || 0) / (30 * roomCount) * 100)) }));
    const revenueLabels = months.map(m => ({ month: m, amount: revenueMap[m] || 0 }));
    const guestCounts = months.map(m => ({ month: m, guests: guestCountMap[m] || 0 }));

    const avgOcc = occupancy.length
      ? Math.round(occupancy.reduce((s, o) => s + o.pct, 0) / occupancy.length)
      : 0;

    return {
      occupancy,
      revenue: revenueLabels,
      guestCount: guestCounts,
      foodStats,
      totalRevenue,
      totalNights,
      totalOrdersCount,
      avgOcc,
      filteredCount: history.length + activeStays.length
    };
  }

  function render(fromDate, toDate) {
    const rpt = computeReports(fromDate, toDate);

    // Update KPI grid if it exists
    const kpiGrid = document.getElementById('kpi-grid');
    if (kpiGrid) {
      const kpis = [
        { label: 'Avg Occupancy', val: rpt.avgOcc + '%', accent: true },
        { label: 'Total Revenue', val: GM.fmt.currency(rpt.totalRevenue), accent: true },
        { label: 'Completed Stays', val: String(rpt.filteredCount), accent: false },
        { label: 'Total Food Ord.', val: String(rpt.totalOrdersCount), accent: false },
      ];
      kpiGrid.innerHTML = kpis.map(k =>
        `<div class="report-kpi animate-in">
          <div class="report-kpi__val ${k.accent ? 'report-kpi__accent' : ''}">${k.val}</div>
          <div class="report-kpi__label">${k.label}</div>
        </div>`).join('');
    }

    // Charts
    function buildBarChart(containerId, data, maxVal, labelFn, tipFn) {
      const el = document.getElementById(containerId);
      if (!el) return;
      if (!data.length) { el.innerHTML = `<div class="empty-state" style="padding:1rem 0;font-size:0.85rem;">No data in selected range.</div>`; return; }
      el.innerHTML = data.map(d =>
        `<div class="ibc-col">
          <div class="ibc-bar" style="height:calc(${maxVal > 0 ? Math.round((d.value / maxVal) * 100) : 0}% - 6px);">
            <div class="ibc-bar__tip">${tipFn(d)}</div>
          </div>
          <div class="ibc-label">${labelFn(d)}</div>
        </div>`).join('');
    }

    // Occupancy
    const occData = rpt.occupancy.map(d => ({ label: d.month.replace(' ', '\n'), value: d.pct, raw: d }));
    buildBarChart('occ-chart', occData, 100, d => d.label, d => d.value + '%');
    const occTbody = document.querySelector('#occ-table tbody');
    if (occTbody) occTbody.innerHTML = rpt.occupancy.map(d =>
      `<tr><td>${d.month}</td><td><strong>${d.pct}%</strong></td><td class="bar-cell"><div class="progress-bar"><div class="progress-bar__fill" style="width:${d.pct}%"></div></div></td></tr>`).join('') ||
      '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No data</td></tr>';

    // Revenue
    const revMax = rpt.revenue.length ? Math.max(...rpt.revenue.map(r => r.amount), 1) : 1;
    buildBarChart('rev-chart', rpt.revenue.map(d => ({ label: d.month.replace(' ', '\n'), value: d.amount })), revMax, d => d.label, d => '₹' + (d.value / 1000).toFixed(0) + 'k');
    const revTbody = document.querySelector('#rev-table tbody');
    if (revTbody) revTbody.innerHTML = rpt.revenue.map(d => {
      const pct = revMax > 0 ? Math.round((d.amount / revMax) * 100) : 0;
      return `<tr><td>${d.month}</td><td><strong>${GM.fmt.currency(d.amount)}</strong></td><td class="bar-cell"><div class="progress-bar"><div class="progress-bar__fill" style="width:${pct}%"></div></div></td></tr>`;
    }).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No data</td></tr>';

    // Food
    const maxOrders = Math.max(...rpt.foodStats.map(f => f.orders), 1);
    const foodBars = document.getElementById('food-bars');
    if (foodBars) foodBars.innerHTML = rpt.foodStats.map(f =>
      `<div class="food-row">
        <div class="food-row__name">${f.category}</div>
        <div class="food-row__bar"><div class="food-row__fill" style="width:${Math.round((f.orders / maxOrders) * 100)}%"></div></div>
        <div class="food-row__val">${f.orders} orders</div>
        <div class="food-row__val text-gold">${GM.fmt.currency(f.revenue)}</div>
      </div>`).join('');
    const foodTbody = document.getElementById('food-table-body');
    if (foodTbody) foodTbody.innerHTML = rpt.foodStats.map(f =>
      `<tr><td>${f.category}</td><td><strong>${f.orders}</strong></td><td style="color:var(--gold-bright);font-weight:500;">${GM.fmt.currency(f.revenue)}</td></tr>`).join('');

    // Guests
    const gmax = rpt.guestCount.length ? Math.max(...rpt.guestCount.map(g => g.guests), 1) : 1;
    buildBarChart('guest-chart', rpt.guestCount.map(d => ({ label: d.month.replace(' ', '\n'), value: d.guests })), gmax, d => d.label, d => d.value + ' guests');
    const guestTbody = document.querySelector('#guest-table tbody');
    if (guestTbody) guestTbody.innerHTML = rpt.guestCount.map(d => {
      const pct = gmax > 0 ? Math.round((d.guests / gmax) * 100) : 0;
      return `<tr><td>${d.month}</td><td><strong>${d.guests}</strong></td><td class="bar-cell"><div class="progress-bar"><div class="progress-bar__fill" style="width:${pct}%"></div></div></td></tr>`;
    }).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No data</td></tr>';
  }

  /* ── Initial HTML shell ─────────────────────────────────── */
  const thisYear = new Date().getFullYear();
  main.innerHTML = `
    <div class="page-header animate-in">
      <h1>Reports &amp; Analytics</h1>
      <p>Resort performance overview — computed from real data</p>
    </div>
    <div class="page-content">

      <div class="filter-bar animate-in" style="margin-bottom:1.25rem;">
        <div style="font-size:0.82rem;color:var(--text-muted);">Date range:</div>
        <input class="form-input" type="date" id="report-from" value="${thisYear}-01-01" style="max-width:160px;">
        <span style="color:var(--text-muted);">to</span>
        <input class="form-input" type="date" id="report-to" value="${thisYear}-12-31" style="max-width:160px;">
        <button class="btn btn--secondary btn--sm" id="apply-range">Apply</button>
        <button class="btn btn--ghost btn--sm" id="clear-range">All Time</button>
      </div>

      <div class="report-kpi-grid animate-in" id="kpi-grid"></div>

      <div class="tabs animate-in">
        <button class="tab-btn active" data-tab="occupancy">Occupancy</button>
        <button class="tab-btn" data-tab="revenue">Revenue</button>
        <button class="tab-btn" data-tab="food">Food Stats</button>
        <button class="tab-btn" data-tab="guests">Guest Count</button>
      </div>

      <div class="tab-panel active" id="tab-occupancy">
        <div class="card">
          <h3 style="margin-bottom:1rem;">Monthly Occupancy Rate (%)</h3>
          <div class="inline-bar-chart" id="occ-chart"></div>
          <div class="divider"></div>
          <div class="table-wrap" style="border:none;">
            <table id="occ-table"><thead><tr><th>Month</th><th>Occupancy %</th><th style="width:50%">Bar</th></tr></thead><tbody></tbody></table>
          </div>
        </div>
      </div>

      <div class="tab-panel" id="tab-revenue">
        <div class="card">
          <h3 style="margin-bottom:1rem;">Monthly Revenue (₹)</h3>
          <div class="inline-bar-chart" id="rev-chart" style="--bar-top:var(--teal);--bar-bot:var(--gold-bright);"></div>
          <div class="divider"></div>
          <div class="table-wrap" style="border:none;">
            <table id="rev-table"><thead><tr><th>Month</th><th>Revenue</th><th style="width:50%">Bar</th></tr></thead><tbody></tbody></table>
          </div>
        </div>
      </div>

      <div class="tab-panel" id="tab-food">
        <div class="card">
          <h3 style="margin-bottom:1rem;">Food Orders by Category</h3>
          <div id="food-bars"></div>
          <div class="divider"></div>
          <div class="table-wrap" style="border:none;">
            <table><thead><tr><th>Category</th><th>Orders</th><th>Revenue</th></tr></thead><tbody id="food-table-body"></tbody></table>
          </div>
        </div>
      </div>

      <div class="tab-panel" id="tab-guests">
        <div class="card">
          <h3 style="margin-bottom:1rem;">Monthly Guest Count</h3>
          <div class="inline-bar-chart" id="guest-chart" style="--bar-top:#9B72D8;--bar-bot:var(--blue);"></div>
          <div class="divider"></div>
          <div class="table-wrap" style="border:none;">
            <table id="guest-table"><thead><tr><th>Month</th><th>Guests</th><th style="width:50%">Bar</th></tr></thead><tbody></tbody></table>
          </div>
        </div>
      </div>

    </div>
  `;

  // Responsive KPI
  const kpiGrid = document.getElementById('kpi-grid');
  function handleResize() {
    if (kpiGrid) kpiGrid.style.gridTemplateColumns = window.innerWidth < 600 ? '1fr 1fr' : 'repeat(4,1fr)';
  }
  window.addEventListener('resize', handleResize);
  handleResize();
  window.__gmPageCleanup = () => window.removeEventListener('resize', handleResize);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Preload room count for occupancy calculation
  (async () => {
    try {
      const rooms = await window.RoomCache.getRooms();
      window.__gmRoomCount = rooms.length || 1;
    } catch { window.__gmRoomCount = 1; }
    render(document.getElementById('report-from').value, document.getElementById('report-to').value);
  })();

  document.getElementById('apply-range').addEventListener('click', () => {
    const from = document.getElementById('report-from').value;
    const to = document.getElementById('report-to').value;
    render(from, to);
    GM.toast('Report updated for selected range.', 'info');
  });

  document.getElementById('clear-range').addEventListener('click', () => {
    document.getElementById('report-from').value = '';
    document.getElementById('report-to').value = '';
    render('', '');
    GM.toast('Showing all-time data.', 'info');
  });

  // REALTIME UPDATES
  window.addEventListener('gm:data-change', (e) => {
    const table = e.detail.table;
    if (table === 'history' || table === 'active_stays' || table === 'orders') {
      const from = document.getElementById('report-from').value;
      const to = document.getElementById('report-to').value;
      render(from, to);
    }
  });
})();
