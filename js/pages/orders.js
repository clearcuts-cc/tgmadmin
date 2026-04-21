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
              <option value="walk_in">— Outer Guest (Walk-in) —</option>
            </select>
            <div id="walkin-guest-form" style="margin-top:0.75rem;display:none;">
              <input type="text" id="walkin-guest-name" class="form-input" placeholder="Enter Walk-in Guest Name">
            </div>
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
            <button class="btn btn--primary btn--full mt-md" id="place-order-btn" disabled>Place Order</button>
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
  let editingOrderId = null;

  // Add a listener to refresh menu if MockData changes
  window.addEventListener('gm-data-ready', refreshMenuSelect);

  // Populate active rooms from localStorage bookings
  function refreshRoomSelector() {
    const activeBookings = MockData.bookings.filter(b => b.status === 'checked_in' || b.status === 'due_checkout');
    roomSelector.innerHTML = '<option value="">— Select active room —</option><option value="walk_in">— Outer Guest (Walk-in) —</option>';
    activeBookings.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `Room ${GM.fmt.room(b.roomNumber)} — ${b.guestName}`;
      roomSelector.appendChild(opt);
    });
    if (!activeBookings.length) {
      roomSelector.innerHTML = '<option value="">No active check-ins</option><option value="walk_in">— Outer Guest (Walk-in) —</option>';
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
    const val = roomSelector.value;
    const walkinForm = document.getElementById('walkin-guest-form');
    
    if (val === 'walk_in') {
      walkinForm.style.display = 'block';
      guestInfo.style.display = 'none';
      selectedBooking = null;
      renderHistory(null); // Clear history filter
    } else {
      walkinForm.style.display = 'none';
      selectedBooking = MockData.getBookingById(val) || null;
      if (selectedBooking) {
        guestNameEl.textContent = selectedBooking.guestName;
        roomInfoEl.textContent = `Room ${GM.fmt.room(selectedBooking.roomNumber)} · Check-out ${GM.fmt.date(selectedBooking.checkOut)}`;
        guestInfo.style.display = 'block';
        renderHistory(selectedBooking.id);
      } else {
        guestInfo.style.display = 'none';
        renderHistory(null);
      }
    }
    placeOrderBtn.disabled = currentOrder.length === 0 || (!selectedBooking && val !== 'walk_in');
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
    const enableGST = window.GMSettings ? window.GMSettings.get('enableGST') : true;
    const foodGST = enableGST ? (window.GMSettings ? window.GMSettings.get('foodGST') : 5) : 0;
    const gstRow = document.querySelector('.bill-row:has(#order-gst-amount)');
    if (gstRow) gstRow.style.display = enableGST ? 'flex' : 'none';

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
    
    const val = roomSelector.value;
    placeOrderBtn.disabled = val === "" || (val === "walk_in" && !document.getElementById('walkin-guest-name').value.trim());
    placeOrderBtn.textContent = editingOrderId ? 'Update Order' : 'Place Order';
  }

  window.GMOrderQty = (i, delta) => { currentOrder[i].qty = Math.max(1, currentOrder[i].qty + delta); renderCurrentOrder(); };
  window.GMOrderRemove = (i) => { currentOrder.splice(i, 1); renderCurrentOrder(); };
  clearOrderBtn.addEventListener('click', () => { currentOrder = []; renderCurrentOrder(); });
  placeOrderBtn.addEventListener('click', () => {
    if (currentOrder.length === 0) return;
    
    const enableGST = window.GMSettings ? window.GMSettings.get('enableGST') : true;
    const foodGST = enableGST ? (window.GMSettings ? window.GMSettings.get('foodGST') : 5) : 0;
    const subtotal = currentOrder.reduce((s, o) => s + o.price * o.qty, 0);
    const gstAmount = Math.round(subtotal * (foodGST / 100));
    pendingOrderTotal = subtotal + gstAmount;

    const isWalkIn = roomSelector.value === 'walk_in';
    const guestName = isWalkIn ? document.getElementById('walkin-guest-name').value.trim() : selectedBooking?.guestName;
    const roomNum = isWalkIn ? 'Walk-in' : selectedBooking?.roomNumber;

    if (!guestName) { GM.toast('Please enter guest name.', 'error'); return; }

    const confirmMsg = editingOrderId 
        ? `Confirm updating order for ${guestName}? New total: ${GM.fmt.currency(pendingOrderTotal)}`
        : `Confirming order total ${GM.fmt.currency(pendingOrderTotal)} for ${isWalkIn ? 'Outer Guest' : 'Room ' + roomNum}. It will be marked as UNPAID by default.`;

    GM.confirm(editingOrderId ? 'Update Order' : 'Place Food Order', confirmMsg, async () => {
      if (editingOrderId) {
          // UPDATE MODE
          await MockData.updateOrder(editingOrderId, {
              items: currentOrder.map(o => ({ menuId: o.menuId, name: o.name, qty: o.qty, price: o.price })),
              total: pendingOrderTotal
          });
          GM.toast(`Order updated for ${guestName}`, 'success');
          editingOrderId = null;
      } else {
          // CREATE MODE
          const orderId = crypto.randomUUID();
          await MockData.addOrder({
            id: orderId,
            bookingId: selectedBooking?.id || null,
            room: roomNum,
            guestName: guestName,
            items: currentOrder.map(o => ({ menuId: o.menuId, name: o.name, qty: o.qty, price: o.price })),
            total: pendingOrderTotal,
            createdAt: new Date().toISOString(),
            status: 'pending',
            paymentStatus: 'unpaid'
          });
          GM.toast(`Order placed for ${guestName} (${isWalkIn ? 'Outer' : 'Room ' + roomNum}). Marked as UNPAID.`, 'success');
      }

      currentOrder = [];
      if (isWalkIn) document.getElementById('walkin-guest-name').value = '';
      renderCurrentOrder();
      renderHistory(selectedBooking?.id);
    });
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

          GM.toast(`Order placed for ${selectedBooking.guestName} (Room ${selectedBooking.roomNumber}). Collected via ${method}.`, 'success');
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

      const isPaid = ord.paymentStatus === 'paid';
      const paymentLabel = isPaid ? '✓ PAID' : '🔴 UNPAID';
      const paymentClass = isPaid ? 'badge--green' : 'badge--red';

      return `
        <div style="padding:0.75rem 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;align-items:flex-start;">
            <div>
              <div style="font-weight:600;font-size:0.9rem;">${ord.guestName || 'Walk-in'}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">Room ${GM.fmt.room(ord.room)} · ${GM.fmt.datetime(ord.createdAt)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;">
                <div style="display:flex;gap:0.4rem;">
                    <span class="badge ${statusClass}">${statusLabel}</span>
                    <span class="badge ${paymentClass}" 
                          onclick="GMToggleFoodPayment('${ord.id}')" 
                          style="cursor:pointer;display:flex;align-items:center;gap:4px;" 
                          title="Click to toggle Paid/Unpaid">
                        ${paymentLabel} 
                        <div class="toggle-switch ${isPaid ? 'on' : 'off'}" style="pointer-events:none;"></div>
                    </span>
                </div>
                <div style="display:flex;gap:0.4rem;">
                  <button class="btn btn--sm btn--ghost btn--icon" title="View Items" onclick="GMViewOrder('${ord.id}')">👁</button>
                  <button class="btn btn--sm btn--ghost btn--icon" title="Edit Order" onclick="GMEditOrder('${ord.id}')">✏️</button>
                  <button class="btn btn--sm btn--ghost btn--icon" title="Print Bill" onclick="GMPrintFoodBill('${ord.id}')" style="color:var(--gold-bright);">⎙</button>
                  ${isPending ? `<button class="btn btn--sm btn--primary" style="padding:0.25rem 0.6rem;font-size:0.75rem;" onclick="GMMarkDelivered('${ord.id}')">Mark Delivered</button>` : ''}
                </div>
             </div>
           </div>
           <div style="font-weight:500;margin-top:0.2rem;color:var(--gold-bright);">Total: ${GM.fmt.currency(ord.total || total)}</div>
         </div>`;
    }).join('');
  }

  window.GMToggleFoodPayment = async (id) => {
    const ord = MockData.orders.find(o => o.id === id);
    if (!ord) return;

    const newStatus = ord.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    const desc = ord.items.map(o => `${o.name} ×${o.qty}`).join(', ');

    if (newStatus === 'paid') {
      GM.confirm('Mark as Paid', `Confirm payment collection of ${GM.fmt.currency(ord.total)} for this order?`, async () => {
        const success = await MockData.updateOrderPaymentStatus(id, 'paid');
        if (success) {
          await MockData.addPaymentToStay(ord.bookingId, {
            type: 'food',
            description: `Food Order: ${desc}`,
            amount: ord.total,
            method: 'Cash',
            ref: `Order #${id.slice(0, 6)}`
          });
          renderHistory(selectedBooking?.id);
        }
      });
    } else {
      GM.confirm('Mark as Unpaid', 'Move this amount back to room balance? It will be collected at checkout.', async () => {
        const success = await MockData.updateOrderPaymentStatus(id, 'unpaid');
        if (success) {
          await MockData.deleteStayPaymentByDescription(ord.bookingId, `Food Order: ${desc}`);
          renderHistory(selectedBooking?.id);
        }
      });
    }
  };

  /* ── EDIT ORDER ────────────────────────────────────────── */
  window.GMEditOrder = (id) => {
    if (currentOrder.length > 0) {
        GM.confirm('Overwrite Current Order?', 'You have items in your active order area. Loading an existing order will overwrite them. Proceed?', () => loadOrderToEdit(id));
    } else {
        loadOrderToEdit(id);
    }
  };

  function loadOrderToEdit(id) {
    const ord = MockData.orders.find(o => o.id === id);
    if (!ord) return;

    editingOrderId = id;
    currentOrder = ord.items.map(i => ({
        menuId: i.menuId,
        name: i.name,
        qty: i.qty,
        price: i.price
    }));

    // Auto-select the room if possible
    if (ord.bookingId) {
        roomSelector.value = ord.bookingId;
        roomSelector.dispatchEvent(new Event('change'));
    } else if (ord.room === 'Walk-in') {
        roomSelector.value = 'walk_in';
        roomSelector.dispatchEvent(new Event('change'));
        const walkinNameField = document.getElementById('walkin-guest-name');
        if (walkinNameField) walkinNameField.value = ord.guestName;
    }

    renderCurrentOrder();
    GM.toast('Order loaded for editing', 'info');
    document.querySelector('.card:nth-child(2)').scrollIntoView({ behavior: 'smooth' });
  }

  /* ── ORDER DETAIL MODAL ─────────────────────────────────── */
  window.GMViewOrder = (id) => {
    const ord = MockData.orders.find(o => o.id === id);
    if (!ord) return;
    GM.alert('Order Details', `
      <div style="margin-bottom:1rem;padding:0.75rem;background:var(--bg-raised);border-radius:var(--radius-sm);font-size:0.875rem;">
        <div style="font-weight:600;margin-bottom:0.25rem;">${ord.guestName} (Room ${GM.fmt.room(ord.room)})</div>
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

  /* ── PRINT FOOD BILL ────────────────────────────────────── */
  window.GMPrintFoodBill = (id) => {
    const ord = MockData.orders.find(o => o.id === id);
    if (!ord) return;

    const s = window.GMSettings ? window.GMSettings.getAll() : {};
    const enableGST = s.enableGST !== false;
    const foodGST = enableGST ? (s.foodGST || 5) : 0;
    const subtotal = ord.items.reduce((s, i) => s + i.price * i.qty, 0);
    const gstAmount = Math.round(subtotal * (foodGST / 100));

    const printWin = window.open('', '_blank', 'width=450,height=800');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Food Bill - Room ${ord.room}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            
            * { box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              color: #111; 
              line-height: 1.4; 
              margin: 0; 
              padding: 40px 20px;
              background: #f4f4f4;
            }
            
            .receipt { 
              background: #fff; 
              max-width: 450px; 
              margin: 0 auto; 
              padding: 35px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              border-radius: 4px;
              position: relative;
            }

            /* Remove browser header/footer */
            @page {
              margin: 0;
              size: auto;
            }

            @media print {
              body { padding: 0; background: none; }
              .receipt { 
                box-shadow: none; 
                max-width: 100%; 
                width: 100%; 
                margin: 0;
                padding: 15mm 15mm; /* Professional margins */
              }
            }

            .header { text-align: center; margin-bottom: 30px; }
            .hotel-name { 
              font-weight: 800; 
              font-size: 1.7rem; 
              text-transform: uppercase; 
              letter-spacing: 0.05em; 
              margin-bottom: 6px;
              color: #000;
            }
            .hotel-tagline { font-size: 0.8rem; color: #555; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
            .hotel-info { font-size: 0.75rem; color: #777; margin-top: 2px; }

            .bill-type {
              text-align: center;
              border-top: 1px solid #eee;
              border-bottom: 1px solid #eee;
              padding: 8px 0;
              margin: 20px 0;
              font-weight: 600;
              font-size: 0.9rem;
              letter-spacing: 0.2em;
              color: #444;
            }

            .meta-grid { 
              display: grid; 
              grid-template-columns: 1fr 1.2fr;
              gap: 15px;
              margin-bottom: 25px;
              font-size: 0.85rem;
            }
            .meta-item { display: flex; flex-direction: column; gap: 3px; }
            .meta-label { color: #888; font-size: 0.7rem; text-transform: uppercase; font-weight: 600; }
            .meta-value { font-weight: 600; color: #111; }

            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 25px 0; 
            }
            .items-table th { 
              text-align: left; 
              padding: 10px 0; 
              border-bottom: 2px solid #111;
              font-size: 0.75rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #666;
            }
            .items-table td { padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-size: 0.95rem; }
            .price-col { text-align: right; font-weight: 500; }
            .qty-col { text-align: center; color: #666; }

            .summary { margin-top: 20px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 0.95rem; color: #444; }
            .grand-total { 
              margin-top: 15px;
              padding-top: 15px; 
              border-top: 2px solid #111; 
              display: flex; 
              justify-content: space-between; 
              align-items: baseline;
            }
            .grand-label { font-weight: 800; font-size: 1.1rem; letter-spacing: 0.02em; }
            .grand-amount { font-weight: 800; font-size: 1.6rem; color: #000; }

            .footer { 
              text-align: center; 
              margin-top: 45px; 
              font-size: 0.85rem; 
              color: #666; 
              padding-top: 20px;
              border-top: 1px dashed #ddd;
            }
            .status-badge {
              display: inline-block;
              margin-top: 10px;
              padding: 4px 10px;
              background: #f0f0f0;
              border-radius: 4px;
              font-size: 0.7rem;
              font-weight: 700;
              text-transform: uppercase;
              color: #444;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="receipt">
            <div class="header">
              <div class="hotel-name">${s.resortName || 'The Grand Mist'}</div>
              <div class="hotel-tagline">Luxury Stay & Dining · Kodaikanal</div>
              <div class="hotel-info">
                ${s.resortAddress ? `<div>${s.resortAddress}</div>` : ''}
                <div>Phone: ${s.resortPhone || '+91 9944033765'}</div>
                ${(enableGST && s.resortGSTIN) ? `<div>GSTIN: ${s.resortGSTIN}</div>` : ''}
              </div>
            </div>

            <div class="bill-type">FOOD BILL</div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">${ord.room === 'Walk-in' ? 'Guest Type' : 'Room Number'}</span>
                <span class="meta-value">${ord.room === 'Walk-in' ? '<span style="color:#2563eb;">Outer Guest</span>' : GM.fmt.room(ord.room)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Bill ID</span>
                <span class="meta-value">#${ord.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div class="meta-item" style="grid-column: span 2;">
                <span class="meta-label">Guest Name</span>
                <span class="meta-value">${ord.guestName}</span>
              </div>
              <div class="meta-item" style="grid-column: span 2;">
                <span class="meta-label">Date & Time</span>
                <span class="meta-value">${GM.fmt.datetime(ord.createdAt)}</span>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th class="qty-col">Qty</th>
                  <th class="price-col">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${ord.items.map(i => `
                  <tr>
                    <td>${i.name}</td>
                    <td class="qty-col">${i.qty}</td>
                    <td class="price-col">₹${(i.price * i.qty).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>₹${subtotal.toLocaleString()}</span>
              </div>
              ${(enableGST && gstAmount > 0) ? `
              <div class="summary-row">
                <span>GST (${foodGST}%)</span>
                <span>₹${gstAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              
              <div class="grand-total">
                <span class="grand-label">GRAND TOTAL</span>
                <span class="grand-amount">₹${ord.total.toLocaleString()}</span>
              </div>
            </div>

            <div class="footer">
              <div>${s.billFooter || 'Thank you for dining with us!'}</div>
              <div class="status-badge">${ord.status.toUpperCase()}</div>
              <div style="font-size: 0.65rem; color: #aaa; margin-top: 15px;">Generated by TGM Management System</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Initial render
  renderCurrentOrder();
  renderHistory();

  // Real-time updates
  const onDataChange = (e) => {
    const table = e.detail.table;
    if (table === 'orders') renderHistory(selectedBooking?.id);
    if (table === 'bookings') refreshRoomSelector();
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
    delete window.GMPrintFoodBill;
    delete window.GMMarkDelivered;
  };
})();
