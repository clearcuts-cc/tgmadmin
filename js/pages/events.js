/* events.js — Events list + inline Event Detail — localStorage-backed */
(function () {
  const main = document.getElementById('main-content');

  function getEvents() { return MockData.events; }
  function saveEvents(e) { MockData.saveEvents(e); }

  /* ══════════════════════════════════════════════════════════
     EVENTS LIST
  ══════════════════════════════════════════════════════════ */
  function renderEventsList() {
    main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1>Events</h1>
          <p>Plan and manage resort activities and experiences</p>
        </div>
        <button class="btn btn--primary" id="create-event-btn">＋ Create Event</button>
      </div>
    </div>
    <div class="page-content">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;" id="events-grid" class="animate-in"></div>
      <div id="events-empty" class="empty-state hidden"><span>🎉</span>No events yet. Create one!</div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" id="event-modal">
      <div class="modal" style="max-width:540px;">
        <div class="modal__header">
          <h2 class="modal__title" id="event-modal-title">Create Event</h2>
          <button class="modal__close" id="event-modal-close">✕</button>
        </div>
        <div class="modal__body">
          <form id="event-form">
            <div class="form-group">
              <label class="form-label" for="ev-name">Event Name <span class="req">*</span></label>
              <input class="form-input" type="text" id="ev-name" placeholder="e.g. Stargazing Night" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="ev-desc">Description</label>
              <textarea class="form-textarea" id="ev-desc" rows="2" placeholder="Brief description…"></textarea>
            </div>
            <div class="form-grid form-grid--2">
              <div class="form-group">
                <label class="form-label" for="ev-date">Date <span class="req">*</span></label>
                <input class="form-input" type="date" id="ev-date" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="ev-time">Time <span class="req">*</span></label>
                <input class="form-input" type="time" id="ev-time" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="ev-price">Price per Person (₹) <span class="req">*</span></label>
                <input class="form-input" type="number" id="ev-price" min="0" placeholder="e.g. 500" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="ev-capacity">Max Capacity <span class="req">*</span></label>
                <input class="form-input" type="number" id="ev-capacity" min="1" placeholder="e.g. 20" required>
              </div>
            </div>

            <!-- SERVICES / EXTRA CHARGES -->
            <div style="margin-top:1rem;border-top:1px solid rgba(255,255,255,0.08);padding-top:1rem;">
              <div style="font-size:0.78rem;font-weight:700;color:var(--gold-bright);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.6rem;">Services / Extra Charges</div>
              <div style="display:flex;gap:0.5rem;align-items:flex-end;">
                <div class="form-group" style="flex:1;margin:0;">
                  <label class="form-label" for="ev-svc-name" style="font-size:0.72rem;">Service Name</label>
                  <input class="form-input" type="text" id="ev-svc-name" placeholder="e.g. Chair, DJ, Bonfire">
                </div>
                <div class="form-group" style="width:110px;margin:0;">
                  <label class="form-label" for="ev-svc-amt" style="font-size:0.72rem;">Amount (₹)</label>
                  <input class="form-input" type="number" id="ev-svc-amt" min="0" placeholder="0">
                </div>
                <button type="button" class="btn btn--primary" id="ev-svc-add" style="white-space:nowrap;flex-shrink:0;">＋ Add</button>
              </div>
              <div id="ev-svc-list" style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.3rem;"></div>
            </div>

          </form>
        </div>
        <div class="modal__footer">
          <button class="btn btn--ghost" id="event-modal-cancel">Cancel</button>
          <button class="btn btn--primary" id="event-modal-save">Save Event</button>
        </div>
      </div>
    </div>
  `;

    let editingEventId = null;
    let modalServices = []; // [{name, amount}]
    const evGrid = document.getElementById('events-grid');
    const emptyState = document.getElementById('events-empty');
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('event-modal-title');
    const modalSave = document.getElementById('event-modal-save');

    function renderModalServices() {
      const list = document.getElementById('ev-svc-list');
      if (!list) return;
      if (!modalServices.length) { list.innerHTML = ''; return; }
      list.innerHTML = modalServices.map((s, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(212,168,83,0.07);border:1px solid rgba(212,168,83,0.15);border-radius:7px;padding:0.35rem 0.6rem;font-size:0.82rem;">
          <span style="font-weight:500;">${s.name}</span>
          <span style="display:flex;align-items:center;gap:0.5rem;">
            <span style="color:var(--gold-bright);font-weight:600;">₹${s.amount}</span>
            <button type="button" onclick="GMEvSvcRemove(${i})" style="background:none;border:none;cursor:pointer;color:rgba(255,80,80,0.7);font-size:1rem;line-height:1;">✕</button>
          </span>
        </div>`).join('');
    }
    window.GMEvSvcRemove = (i) => { modalServices.splice(i, 1); renderModalServices(); };

    document.getElementById('ev-svc-add').addEventListener('click', () => {
      const name = document.getElementById('ev-svc-name').value.trim();
      const amount = parseFloat(document.getElementById('ev-svc-amt').value) || 0;
      if (!name) { GM.toast('Enter a service name.', 'error'); return; }
      if (amount <= 0) { GM.toast('Enter a valid amount.', 'error'); return; }
      modalServices.push({ name, amount });
      document.getElementById('ev-svc-name').value = '';
      document.getElementById('ev-svc-amt').value = '';
      renderModalServices();
    });

    function totalRegistered(ev) { return (ev.registrations || []).reduce((s, r) => s + r.numGuests, 0); }

    function renderCards() {
      const events = getEvents();
      emptyState.classList.toggle('hidden', events.length > 0);
      evGrid.innerHTML = events.map(ev => {
        const used = totalRegistered(ev);
        const dateStr = ev.date
          ? new Date(ev.date + 'T' + ev.time).toLocaleString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'TBD';
        return `
        <div class="event-card">
          <div class="event-card__date">${dateStr}</div>
          <div class="event-card__name">${ev.name}</div>
          <div class="event-card__meta">${ev.description || ''}</div>
          ${ev.added_by ? `<div style="font-size:0.68rem;color:rgba(255,255,255,0.3);margin-top:0.25rem;">Added by ${ev.added_by}</div>` : ''}
          ${(ev.services && ev.services.length) ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.4rem;">${ev.services.map(s => `<span style="font-size:0.7rem;background:rgba(212,168,83,0.12);color:var(--gold-bright);border-radius:5px;padding:0.15rem 0.45rem;border:1px solid rgba(212,168,83,0.2);">${s.name} ₹${s.amount}</span>`).join('')}</div>` : ''}
          ${GM.capacityBar(used, ev.maxCapacity)}
          <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.6rem;flex-wrap:wrap;">
            <span class="badge badge--blue">₹${ev.price}/person</span>
            <span style="font-size:0.78rem;color:var(--text-muted);">${used} registered</span>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap;">
            <button onclick="window.__gmViewEvent('${ev.id}')" class="btn btn--sm btn--ghost">View Details →</button>
            ${window.GMCan?.edit() !== false ? `<button class="btn btn--sm btn--ghost btn--icon" title="Edit" onclick="GMEvEdit('${ev.id}')">✏</button>` : ''}
            ${window.GMCan?.delete() !== false ? `<button class="btn btn--sm btn--danger btn--icon" title="Delete" onclick="GMEvDelete('${ev.id}')">🗑</button>` : ''}
          </div>
        </div>`;
      }).join('');
    }

    window.GMEvDelete = (id) => {
      GM.confirm('Delete Event', 'Permanently remove this event?', () => {
        (async () => {
          await MockData.deleteEvent(id);
          renderCards();
          GM.toast('Event removed.', 'info');
        })();
      });
    };

    window.GMEvEdit = (id) => {
      const ev = getEvents().find(e => e.id === id);
      if (!ev) return;
      editingEventId = id;
      modalTitle.textContent = 'Edit Event';
      document.getElementById('ev-name').value = ev.name;
      document.getElementById('ev-desc').value = ev.description || '';
      document.getElementById('ev-date').value = ev.date;
      document.getElementById('ev-time').value = ev.time;
      document.getElementById('ev-price').value = ev.price;
      document.getElementById('ev-capacity').value = ev.maxCapacity;
      modalServices = ev.services ? [...ev.services] : [];
      renderModalServices();
      modal.classList.add('open');
    };

    document.getElementById('create-event-btn').addEventListener('click', () => {
      editingEventId = null;
      modalTitle.textContent = 'Create Event';
      document.getElementById('event-form').reset();
      modalServices = [];
      renderModalServices();
      modal.classList.add('open');
    });

    function closeModal() { modal.classList.remove('open'); }
    document.getElementById('event-modal-close').addEventListener('click', closeModal);
    document.getElementById('event-modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    modalSave.addEventListener('click', () => {
      const name = document.getElementById('ev-name').value.trim();
      const date = document.getElementById('ev-date').value;
      const time = document.getElementById('ev-time').value;
      const price = parseFloat(document.getElementById('ev-price').value);
      const capacity = parseInt(document.getElementById('ev-capacity').value);
      if (!name || !date || !time || isNaN(price) || isNaN(capacity)) {
        GM.toast('All required fields must be filled.', 'error'); return;
      }
      GM.btnLoading(modalSave, true);
      (async () => {
        const events = getEvents();
        if (editingEventId) {
          const idx = events.findIndex(e => e.id === editingEventId);
          events[idx] = { ...events[idx], name, description: document.getElementById('ev-desc').value.trim(), date, time, price, maxCapacity: capacity, services: [...modalServices] };
          GM.toast('Event updated.', 'success');
        } else {
          const session = JSON.parse(localStorage.getItem('gm_session') || '{}');
          events.push({
            id: crypto.randomUUID(),
            name,
            description: document.getElementById('ev-desc').value.trim(),
            date, time, price, maxCapacity: capacity,
            registrations: [],
            services: [...modalServices],
            added_by: session.name || null
          });
          GM.toast('Event created!', 'success');
        }
        await MockData.saveEvents(events);
        GM.btnLoading(modalSave, false);
        closeModal(); renderCards();
      })();
    });

    renderCards();
  }

  /* ══════════════════════════════════════════════════════════
     EVENT DETAIL (inline)
  ══════════════════════════════════════════════════════════ */
  window.__gmViewEvent = function (eventId) {
    const events = getEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) {
      main.innerHTML = `
      <div class="page-header animate-in">
        <div style="display:flex;align-items:center;gap:1rem;">
          <button onclick="window.__gmRenderEventsList()" class="btn btn--ghost btn--sm">← Back to Events</button>
          <div><h1>Event Detail</h1></div>
        </div>
      </div>
      <div class="page-content"><div class="empty-state"><span>🎉</span>Event not found.</div></div>`;
      return;
    }

    // Work on a mutable copy of registrations; save back on changes
    let registrations = JSON.parse(JSON.stringify(event.registrations || []));

    function persistRegistrations() {
      const events = getEvents();
      const idx = events.findIndex(e => e.id === eventId);
      if (idx !== -1) { events[idx].registrations = registrations; saveEvents(events); }
    }

    // Build guest list from localStorage
    const guestOptions = MockData.guests.map(g => `<option value="${g.name}">${g.name}</option>`).join('');

    main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;gap:1rem;">
        <button onclick="window.__gmRenderEventsList()" class="btn btn--ghost btn--sm">← Back to Events</button>
        <div>
          <h1>${event.name}</h1>
          <p>${GM.fmt.date(event.date)} · ${event.time} · ₹${event.price}/person · Max ${event.maxCapacity} guests</p>
        </div>
      </div>
    </div>
    <div class="page-content">
      <div style="display:grid;grid-template-columns:1fr 340px;gap:1.5rem;" id="event-detail-grid">

        <!-- Left -->
        <div>
          <div class="card mb-md animate-in">
            <h3 style="margin-bottom:0.75rem;">📋 Event Info</h3>
            <div class="detail-rows">
              <div class="detail-row"><span class="detail-row__label">Name</span><span class="detail-row__value">${event.name}</span></div>
              <div class="detail-row"><span class="detail-row__label">Description</span><span class="detail-row__value">${event.description || '—'}</span></div>
              <div class="detail-row"><span class="detail-row__label">Date &amp; Time</span><span class="detail-row__value">${GM.fmt.date(event.date)} at ${event.time}</span></div>
              <div class="detail-row"><span class="detail-row__label">Price</span><span class="detail-row__value text-gold">₹${event.price} per person</span></div>
              <div class="detail-row">
                <span class="detail-row__label">Capacity</span>
                <div>${GM.capacityBar(registrations.reduce((s, r) => s + r.numGuests, 0), event.maxCapacity)}</div>
              </div>
              ${(event.services && event.services.length) ? `
              <div class="detail-row">
                <span class="detail-row__label">Services</span>
                <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
                  ${event.services.map(s => `<span style="font-size:0.75rem;background:rgba(212,168,83,0.1);color:var(--gold-bright);border-radius:6px;padding:0.2rem 0.5rem;border:1px solid rgba(212,168,83,0.2);">${s.name} — ₹${s.amount}</span>`).join('')}
                </div>
              </div>` : ''}
            </div>
          </div>

          <div class="card animate-in animate-in-delay-1">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
              <h3>Registered Guests</h3>
              <span class="badge badge--blue" id="reg-count-badge">${registrations.reduce((s, r) => s + r.numGuests, 0)} / ${event.maxCapacity}</span>
            </div>
            <div id="registrations-list"></div>
          </div>
        </div>

        <!-- Right: Add Registration -->
        <div>
          <div class="card animate-in">
            <h3 style="margin-bottom:0.75rem;">＋ Add Registration</h3>
            <div class="form-group">
              <label class="form-label" for="reg-guest">Guest Name <span class="req">*</span></label>
              <select class="form-select" id="reg-guest">
                <option value="">— Select guest —</option>
                ${guestOptions}
                <option value="__custom__">Other (type below)</option>
              </select>
            </div>
            <div class="form-group" id="custom-name-group" style="display:none;">
              <label class="form-label" for="reg-custom-name">Custom Name</label>
              <input class="form-input" type="text" id="reg-custom-name" placeholder="Guest full name">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-num">Number of Guests <span class="req">*</span></label>
              <input class="form-input" type="number" id="reg-num" min="1" max="${event.maxCapacity}" value="1">
            </div>
            <div id="reg-revenue-preview" style="font-size:0.85rem;color:var(--gold-bright);margin-bottom:0.75rem;"></div>
            <button class="btn btn--primary btn--full" id="add-reg-btn">Add Registration</button>
        </div>

      </div>
    </div>
  `;

    function totalGuests() { return registrations.reduce((s, r) => s + r.numGuests, 0); }

    function renderRegs() {
      const listEl = document.getElementById('registrations-list');
      const badge = document.getElementById('reg-count-badge');
      if (badge) badge.textContent = `${totalGuests()} / ${event.maxCapacity}`;
      if (!registrations.length) {
        listEl.innerHTML = `<div class="empty-state" style="padding:1rem 0;"><span>🎉</span>No registrations yet.</div>`;
        return;
      }
      listEl.innerHTML = registrations.map((r, i) => {
        const servicesTotal = (event.services || []).reduce((s, svc) => s + svc.amount, 0);
        const rowTotal = r.numGuests * (event.price + servicesTotal);
        const serviceNames = (event.services || []).map(s => s.name).join(', ');
        return `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0;border-bottom:1px solid var(--border);">
        <div style="width:32px;height:32px;background:var(--blue-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--blue);font-size:0.85rem;font-weight:600;flex-shrink:0;">${r.numGuests}</div>
        <div style="flex:1;">
          <div style="font-size:0.9rem;font-weight:500;">${r.guestName}</div>
          ${serviceNames ? `<div style="font-size:0.7rem;color:rgba(255,255,255,0.35);">${serviceNames}</div>` : ''}
        </div>
        <div style="font-size:0.82rem;color:var(--gold-bright);font-weight:600;">${GM.fmt.currency(rowTotal)}</div>
        <button class="btn btn--sm btn--danger btn--icon" onclick="GMEvRegRemove(${i})">✕</button>
      </div>`;
      }).join('');
    }
    renderRegs();

    window.GMEvRegRemove = (i) => {
      GM.confirm('Remove Registration', 'Remove this guest from the event?', () => {
        registrations.splice(i, 1);
        persistRegistrations();
        renderRegs();
        GM.toast('Registration removed.', 'info');
      });
    };

    const numInput = document.getElementById('reg-num');
    const servicesPerPerson = (event.services || []).reduce((s, svc) => s + svc.amount, 0);
    const totalPerPerson = event.price + servicesPerPerson;
    function updatePreview() {
      const n = parseInt(numInput.value) || 0;
      const preview = document.getElementById('reg-revenue-preview');
      if (n > 0) {
        let lines = `₹${event.price} × ${n} guest${n > 1 ? 's' : ''}`;
        if (servicesPerPerson > 0) lines += ` + ₹${servicesPerPerson} services`;
        lines += ` = ${GM.fmt.currency(n * totalPerPerson)}`;
        preview.textContent = lines;
      } else {
        preview.textContent = '';
      }
    }
    numInput.addEventListener('input', updatePreview);
    updatePreview();

    document.getElementById('reg-guest').addEventListener('change', function () {
      document.getElementById('custom-name-group').style.display = this.value === '__custom__' ? 'block' : 'none';
    });

    document.getElementById('add-reg-btn').addEventListener('click', () => {
      const sel = document.getElementById('reg-guest').value;
      const name = sel === '__custom__' ? document.getElementById('reg-custom-name').value.trim() : sel;
      const num = parseInt(numInput.value) || 1;
      if (!name) { GM.toast('Select or enter a guest name.', 'error'); return; }
      if (totalGuests() + num > event.maxCapacity) {
        GM.toast(`Not enough capacity. Only ${event.maxCapacity - totalGuests()} spots remain.`, 'error'); return;
      }
      const btn = document.getElementById('add-reg-btn');
      GM.btnLoading(btn, true);
      (async () => {
        registrations.push({ guestName: name, numGuests: num });
        persistRegistrations();

        const bookingId = MockData.findActiveBookingByGuestName(name);
        if (bookingId) {
          // Bill base event price
          await MockData.addPaymentToStay(bookingId, {
            type: 'event',
            description: `Event: ${event.name} (${num} guest${num > 1 ? 's' : ''})`,
            amount: num * event.price,
            method: 'Room Charge',
            ref: 'Event Reg'
          });
          // Bill each pre-defined service
          for (const svc of (event.services || [])) {
            await MockData.addPaymentToStay(bookingId, {
              type: 'event',
              description: `${svc.name} — ${event.name}`,
              amount: svc.amount,
              method: 'Room Charge',
              ref: 'Event Service'
            });
          }
          GM.toast(`Event + services billed to ${name}'s room`, 'info');
        }

        renderRegs();
        GM.toast(`${name} registered for ${num} guest${num > 1 ? 's' : ''}!`, 'success');
        document.getElementById('reg-guest').value = '';
        numInput.value = 1;
        updatePreview();
        GM.btnLoading(btn, false);
      })();
    });


    const dGrid = document.getElementById('event-detail-grid');
    function handleResize() {
      if (dGrid) dGrid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 340px';
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    window.__gmPageCleanup = () => {
      window.removeEventListener('resize', handleResize);
      delete window.__gmViewEvent;
      delete window.__gmRenderEventsList;
      delete window.GMEvRegRemove;
    };
  };

  window.__gmRenderEventsList = renderEventsList;

  renderEventsList();

  window.__gmPageCleanup = () => {
    delete window.__gmViewEvent;
    delete window.__gmRenderEventsList;
    delete window.GMEvEdit;
    delete window.GMEvDelete;
  };
})();
