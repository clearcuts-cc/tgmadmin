/* orders.js — Food Orders — localStorage-backed */
(function () {
  const main = document.getElementById('main-content');
  const bookingParam = GMRouteParam('booking');

  main.innerHTML = `
    <div class="page-header animate-in">
      <h1>Food Orders</h1>
      <p>Place in-room food orders for active guests</p>
    </div>
    <div class="page-content">
      <div style="display:grid;grid-template-columns:1fr 380px;gap:1.5rem;" id="orders-grid">

        <!-- Left: Room Selector + Menu -->
        <div>
          <div class="card mb-md animate-in">
            <h3 style="margin-bottom:0.75rem;">Select Room / Guest</h3>
            <select class="form-select" id="room-selector">
              <option value="">— Select active room —</option>
            </select>
            <div id="active-guest-info" style="margin-top:0.75rem;display:none;">
              <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--bg-raised);border-radius:var(--radius-sm);">
                <div class="guest-photo" style="width:40px;height:40px;font-size:1.2rem;">👤</div>
                <div>
                  <div id="active-guest-name" style="font-weight:500;font-size:0.9rem;"></div>
                  <div id="active-room-info" style="font-size:0.78rem;color:var(--text-muted);"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mb-md animate-in animate-in-delay-1">
            <h3 style="margin-bottom:0.75rem;">Add to Order</h3>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              <select class="form-select" id="menu-item-select" style="flex:1;min-width:200px;">
                <option value="">— Select menu item —</option>
              </select>
              <div style="display:flex;align-items:center;gap:0.4rem;">
                <label style="font-size:0.82rem;color:var(--text-muted);">Qty:</label>
                <input type="number" id="item-qty" class="form-input" value="1" min="1" max="20" style="width:72px;text-align:center;">
              </div>
              <button class="btn btn--primary" id="add-to-order-btn">＋ Add</button>
            </div>
          </div>

          <div class="card animate-in animate-in-delay-2">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
              <h3>Current Order</h3>
              <button class="btn btn--sm btn--ghost" id="clear-order-btn">Clear</button>
            </div>
            <div id="order-items-list"></div>
            <div id="order-summary-box" style="margin-top:1rem;padding-top:1rem;border-top:1px dashed var(--border);">
              <div class="bill-row"><span>Subtotal</span><span id="order-subtotal">₹0</span></div>
              <div class="bill-row"><span id="order-gst-label">GST (0%)</span><span id="order-gst-amount">₹0</span></div>
              <div class="bill-grand" id="order-total-box" style="margin-top:0.5rem;">
                <span class="bill-grand__label">Order Total</span>
                <span class="bill-grand__value" id="order-total">₹0</span>
              </div>
            </div>
            <button class="btn btn--primary btn--full mt-md" id="place-order-btn" disabled>Place Order &amp; Collect Payment</button>
          </div>
        </div>

        <!-- Right: Order History -->
        <div>
          <div class="card animate-in">
            <h3 style="margin-bottom:0.75rem;">Recent Orders</h3>
            <div id="order-history"></div>
          </div>
        </div>

      </div>
    </div>

    <!-- Payment Modal -->
    <div class="modal-overlay" id="order-payment-modal">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">💳 Collect Food Payment</h2>
          <button class="modal__close" id="order-modal-close">✕</button>
        </div>
        <div class="modal__body">
          <div id="modal-order-breakdown" style="background:var(--bg-raised);border-radius:var(--radius-sm);padding:1rem;margin-bottom:1.25rem;">
            <div class="bill-row"><span>Subtotal</span><span id="modal-subtotal">₹0</span></div>
            <div class="bill-row"><span id="modal-gst-label">GST (0%)</span><span id="modal-gst-amount">₹0</span></div>
            <div class="bill-grand" style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--border);">
              <span class="bill-grand__label">Grand Total</span>
              <span class="bill-grand__value" id="modal-order-total">₹0</span>
            </div>
          </div>
          <div id="modal-order-summary" style="margin-bottom:1rem;font-size:0.85rem;color:var(--text-secondary);"></div>
          <div class="form-group">
            <label class="form-label" for="food-payment-method">Payment Method</label>
            <select class="form-select" id="food-payment-method">
              <option value="Cash">Cash</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="food-payment-ref">Reference (optional)</label>
            <input class="form-input" type="text" id="food-payment-ref" placeholder="UPI ref, txn ID…">
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--ghost" id="order-modal-cancel">Cancel</button>
          <button class="btn btn--primary" id="order-modal-confirm">✔ Mark as Paid &amp; Place Order</button>
        </div>
      </div>
    </div>
  `;

  const roomSelector = document.getElementById('room-selector');
  const menuSelect = document.getElementById('menu-item-select');
  const qtyInput = document.getElementById('item-qty');
  const addBtn = document.getElementById('add-to-order-btn');
  const clearOrderBtn = document.getElementById('clear-order-btn');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const orderItemsList = document.getElementById('order-items-list');
  const orderTotalEl = document.getElementById('order-total');
  const guestInfo = document.getElementById('active-guest-info');
  const guestNameEl = document.getElementById('active-guest-name');
  const roomInfoEl = document.getElementById('active-room-info');
  const paymentModal = document.getElementById('order-payment-modal');

  let currentOrder = [];
  let selectedBooking = null;
  let pendingOrderTotal = 0;

  // Add a listener to refresh menu if MockData changes
  window.addEventListener('gm-data-ready', refreshMenuSelect);

  // Populate active rooms from localStorage bookings
  function refreshRoomSelector() {
    const activeBookings = MockData.bookings.filter(b => b.status === 'checked_in' || b.status === 'due_checkout');
    roomSelector.innerHTML = '<option value="">— Select active room —</option>';
    activeBookings.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `Room ${b.roomNumber} — ${b.guestName}`;
      roomSelector.appendChild(opt);
    });
    if (!activeBookings.length) {
      roomSelector.innerHTML = '<option value="">No active check-ins</option>';
    }
  }
  refreshRoomSelector();

  if (bookingParam) roomSelector.value = bookingParam;

  // Populate menu from localStorage
  function refreshMenuSelect() {
    menuSelect.innerHTML = '<option value="">— Select menu item —</option>';
    MockData.menu.filter(i => i.available).forEach(i => {
      const opt = document.createElement('option');
      opt.value = i.id;
      opt.textContent = `${i.name} — ₹${i.price}`;
      menuSelect.appendChild(opt);
    });
  }
  refreshMenuSelect();

  roomSelector.addEventListener('change', () => {
    selectedBooking = MockData.getBookingById(roomSelector.value) || null;
    if (selectedBooking) {
      guestNameEl.textContent = selectedBooking.guestName;
      roomInfoEl.textContent = `Room ${selectedBooking.roomNumber} · Check-out ${GM.fmt.date(selectedBooking.checkOut)}`;
      guestInfo.style.display = 'block';
      renderHistory(selectedBooking.id);
    } else {
      guestInfo.style.display = 'none';
    }
    placeOrderBtn.disabled = currentOrder.length === 0 || !selectedBooking;
  });

  if (bookingParam) roomSelector.dispatchEvent(new Event('change'));

  addBtn.addEventListener('click', () => {
    const menuId = menuSelect.value;
    if (!menuId) { GM.toast('Select a menu item first.', 'error'); return; }
    const item = MockData.menu.find(i => i.id === menuId);
    if (!item) return;
    const qty = parseInt(qtyInput.value) || 1;
    const existing = currentOrder.find(o => o.menuId === menuId);
    if (existing) { existing.qty += qty; } else { currentOrder.push({ menuId, name: item.name, price: item.price, qty }); }
    renderCurrentOrder();
  });

  function getOrderTotal() {
    return currentOrder.reduce((s, o) => s + o.price * o.qty, 0);
  }

  function renderCurrentOrder() {
    const foodGST = window.GMSettings ? window.GMSettings.get('foodGST') : 5;
    if (currentOrder.length === 0) {
      orderItemsList.innerHTML = `<div class="empty-state" style="padding:1rem 0;"><span>🍽</span>No items added yet.</div>`;
      document.getElementById('order-subtotal').textContent = '₹0';
      document.getElementById('order-gst-amount').textContent = '₹0';
      document.getElementById('order-gst-label').textContent = `GST (${foodGST}%)`;
      orderTotalEl.textContent = '₹0';
      placeOrderBtn.disabled = true;
      return;
    }
    let subtotal = 0;
    orderItemsList.innerHTML = `<div style="display:flex;flex-direction:column;gap:0.4rem;">
      ${currentOrder.map((o, i) => {
      const sub = o.price * o.qty; subtotal += sub;
      return `
          <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid var(--border);">
            <div style="flex:1;font-size:0.875rem;">${o.name}</div>
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <button class="btn btn--sm btn--ghost btn--icon" onclick="GMOrderQty(${i},-1)">−</button>
              <span style="font-size:0.875rem;min-width:24px;text-align:center;">${o.qty}</span>
              <button class="btn btn--sm btn--ghost btn--icon" onclick="GMOrderQty(${i},1)">+</button>
            </div>
            <div style="font-family:var(--font-display);color:var(--gold-bright);min-width:60px;text-align:right;">₹${sub}</div>
            <button class="btn btn--sm btn--danger btn--icon" onclick="GMOrderRemove(${i})">✕</button>
          </div>`;
    }).join('')}
    </div>`;

    const gstAmount = Math.round(subtotal * (foodGST / 100));
    const total = subtotal + gstAmount;

    document.getElementById('order-subtotal').textContent = GM.fmt.currency(subtotal);
    document.getElementById('order-gst-amount').textContent = GM.fmt.currency(gstAmount);
    document.getElementById('order-gst-label').textContent = `GST (${foodGST}%)`;
    orderTotalEl.textContent = GM.fmt.currency(total);
    placeOrderBtn.disabled = !selectedBooking;
  }

  window.GMOrderQty = (i, delta) => { currentOrder[i].qty = Math.max(1, currentOrder[i].qty + delta); renderCurrentOrder(); };
  window.GMOrderRemove = (i) => { currentOrder.splice(i, 1); renderCurrentOrder(); };
  clearOrderBtn.addEventListener('click', () => { currentOrder = []; renderCurrentOrder(); });

  placeOrderBtn.addEventListener('click', () => {
    if (!selectedBooking || currentOrder.length === 0) return;
    const foodGST = window.GMSettings ? window.GMSettings.get('foodGST') : 5;
    const subtotal = currentOrder.reduce((s, o) => s + o.price * o.qty, 0);
    const gstAmount = Math.round(subtotal * (foodGST / 100));
    pendingOrderTotal = subtotal + gstAmount;

    document.getElementById('modal-subtotal').textContent = GM.fmt.currency(subtotal);
    document.getElementById('modal-gst-amount').textContent = GM.fmt.currency(gstAmount);
    document.getElementById('modal-gst-label').textContent = `GST (${foodGST}%)`;
    document.getElementById('modal-order-total').textContent = GM.fmt.currency(pendingOrderTotal);

    document.getElementById('modal-order-summary').innerHTML = currentOrder
      .map(o => `<div>• ${o.name} ×${o.qty} — ${GM.fmt.currency(o.price * o.qty)}</div>`).join('');
    document.getElementById('food-payment-ref').value = '';
    paymentModal.classList.add('open');
  });

  function closeModal() { paymentModal.classList.remove('open'); }
  document.getElementById('order-modal-close').addEventListener('click', closeModal);
  document.getElementById('order-modal-cancel').addEventListener('click', closeModal);
  paymentModal.addEventListener('click', e => { if (e.target === paymentModal) closeModal(); });

  document.getElementById('order-modal-confirm').addEventListener('click', () => {
    const method = document.getElementById('food-payment-method').value;
    const ref = document.getElementById('food-payment-ref').value.trim();
    const confirmBtn = document.getElementById('order-modal-confirm');
    GM.btnLoading(confirmBtn, true);

    (async () => {
      try {
        const desc = currentOrder.map(o => `${o.name} ×${o.qty}`).join(', ');

        const orderId = crypto.randomUUID();

        // Save order to localStorage & Supabase
        await MockData.addOrder({
          id: orderId,
          bookingId: selectedBooking.id,
          room: selectedBooking.roomNumber,
          guestName: selectedBooking.guestName,
          items: currentOrder.map(o => ({ menuId: o.menuId, name: o.name, qty: o.qty, price: o.price })),
          total: pendingOrderTotal,
          createdAt: new Date().toISOString(),
          status: 'pending' // Start as "Order Placed"
        });

        // Record payment in active stay
        await MockData.addPaymentToStay(selectedBooking.id, {
          type: 'food',
          description: desc,
          amount: pendingOrderTotal,
          method,
          ref
        });

        GM.toast(`Order placed & ${GM.fmt.currency(pendingOrderTotal)} collected via ${method} for Room ${selectedBooking.roomNumber}`, 'success');
        currentOrder = [];
        renderCurrentOrder();
        renderHistory(selectedBooking?.id);
        closeModal();
      } catch (err) {
        console.error('Order error:', err);
      } finally {
        GM.btnLoading(confirmBtn, false);
      }
    })();
  });

  function renderHistory(bookingId) {
    const histEl = document.getElementById('order-history');
    let history = [...MockData.orders];

    // Sort by latest first
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (bookingId) {
      history = history.filter(o => o.bookingId === bookingId);
    }

    if (!history.length) {
      histEl.innerHTML = `<div class="empty-state" style="padding:1rem 0;"><span>🧾</span>No orders found.</div>`;
      return;
    }
    histEl.innerHTML = history.map(ord => {
      const total = ord.items.reduce((s, i) => s + i.price * i.qty, 0);
      const isPending = ord.status === 'pending';
      const statusLabel = isPending ? 'Order Placed' : (ord.status.charAt(0).toUpperCase() + ord.status.slice(1));
      const statusClass = isPending ? 'badge--blue' : 'badge--green';

      return `
        <div style="padding:0.75rem 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;align-items:flex-start;">
            <div>
              <div style="font-weight:600;font-size:0.9rem;">${ord.guestName || 'Walk-in'}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">Room ${ord.room || '—'} · ${GM.fmt.datetime(ord.createdAt)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;">
               <span class="badge ${statusClass}">${statusLabel}</span>
               <div style="display:flex;gap:0.4rem;">
                 <button class="btn btn--sm btn--ghost btn--icon" title="View Items" onclick="GMViewOrder('${ord.id}')">👁</button>
                 ${isPending ? `<button class="btn btn--sm btn--primary" style="padding:0.25rem 0.6rem;font-size:0.75rem;" onclick="GMMarkDelivered('${ord.id}')">Mark Delivered</button>` : ''}
               </div>
            </div>
          </div>
          <div style="font-weight:500;margin-top:0.2rem;color:var(--gold-bright);">Total: ${GM.fmt.currency(total)}</div>
        </div>`;
    }).join('');
  }

  /* ── ORDER DETAIL MODAL ─────────────────────────────────── */
  window.GMViewOrder = (id) => {
    const ord = MockData.orders.find(o => o.id === id);
    if (!ord) return;
    GM.alert('Order Details', `
      <div style="margin-bottom:1rem;padding:0.75rem;background:var(--bg-raised);border-radius:var(--radius-sm);font-size:0.875rem;">
        <div style="font-weight:600;margin-bottom:0.25rem;">${ord.guestName} (Room ${ord.room})</div>
        <div style="color:var(--text-muted);font-size:0.75rem;">Placed at ${GM.fmt.datetime(ord.createdAt)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;">
        ${ord.items.map(i => `
          <div style="display:flex;justify-content:space-between;font-size:0.875rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border-subtle);">
            <span>${i.name} ×${i.qty}</span>
            <span style="font-weight:500;">₹${i.price * i.qty}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;margin-top:0.5rem;font-weight:600;color:var(--gold-bright);font-size:1rem;">
          <span>Grand Total</span>
          <span>₹${ord.total}</span>
        </div>
      </div>
    `, 'Close');
  };

  window.GMMarkDelivered = async (id) => {
    GM.confirm('Mark as Delivered', 'Has this order been delivered to the room?', async () => {
      await MockData.updateOrderStatus(id, 'delivered');
      renderHistory(selectedBooking?.id);
    }, 'Yes, Delivered');
  };

  // Initial render
  renderCurrentOrder();
  renderHistory();

  // Real-time updates
  const onDataChange = (e) => {
    if (e.detail.table === 'orders') renderHistory(selectedBooking?.id);
  };
  window.addEventListener('gm:data-change', onDataChange);

  const grid = document.getElementById('orders-grid');
  function handleResize() {
    if (grid) grid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 380px';
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  window.__gmPageCleanup = () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('gm:data-change', onDataChange);
    window.removeEventListener('gm-data-ready', refreshMenuSelect);
    delete window.GMOrderQty;
    delete window.GMOrderRemove;
    delete window.GMViewOrder;
    delete window.GMMarkDelivered;
  };
})();
