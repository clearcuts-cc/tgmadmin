/* bookings-new.js — New Booking page module */
(async function () {
  const main = document.getElementById('main-content');

  main.innerHTML = `
    <div class="page-header animate-in">
      <h1>New Booking</h1>
      <p>Register a new guest stay at The Grand Mist</p>
    </div>
    <div class="page-content">
      <form id="new-booking-form" novalidate>
        <div style="display:grid;grid-template-columns:1fr 360px;gap:1.5rem;" id="booking-grid">

          <!-- LEFT: Guest Details -->
          <div>
            <div class="card mb-md">
              <h3 style="margin-bottom:1rem;">👤 Guest Information</h3>
              <div class="form-grid form-grid--2">
                <div class="form-group" style="grid-column:1/-1;">
                  <label class="form-label" for="guestName">Full Name <span class="req">*</span></label>
                  <input class="form-input" type="text" id="guestName" placeholder="e.g. Arjun Mehta" required>
                  <span class="form-error" id="guestName-err">Full name is required.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="guestPhone">Phone <span class="req">*</span></label>
                  <input class="form-input" type="tel" id="guestPhone" placeholder="10-digit mobile number" required>
                  <span class="form-error" id="guestPhone-err">Valid phone number required.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="guestEmail">Email (optional)</label>
                  <input class="form-input" type="email" id="guestEmail" placeholder="email@example.com">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                  <label class="form-label" for="guestAddress">Full Address <span class="req">*</span></label>
                  <textarea class="form-textarea" id="guestAddress" rows="2" placeholder="Flat / Street, City, State PIN" required></textarea>
                  <span class="form-error" id="guestAddress-err">Address is required.</span>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                  <label class="form-label" for="guestAadhaar">Aadhaar Number <span class="req">*</span></label>
                  <input class="form-input" type="text" id="guestAadhaar" placeholder="XXXX XXXX XXXX" maxlength="14" required>
                  <span class="form-error" id="guestAadhaar-err">Valid 12-digit Aadhaar required.</span>
                </div>
              </div>
            </div>

            <div class="card mb-md">
              <h3 style="margin-bottom:1rem;">📎 Documents</h3>
              <div class="form-group">
                  <label class="form-label">Aadhaar Card Image</label>
                  <div class="upload-zone" id="aadhaar-zone">
                    <input type="file" id="aadhaarImage" accept="image/*">
                    <div class="upload-zone__icon">🪪</div>
                    <div class="upload-zone__label">Click to upload Aadhaar</div>
                    <div class="upload-zone__sub">JPG, PNG or PDF · Max 5 MB</div>
                  </div>
                  <div class="upload-preview" id="aadhaar-preview"><img id="aadhaar-preview-img" src="" alt="Aadhaar preview"></div>
              </div>
            </div>

            <div class="card">
              <h3 style="margin-bottom:1rem;">💬 Special Requests</h3>
              <div class="form-group">
                <label class="form-label" for="specialRequests">Special Requests / Notes</label>
                <textarea class="form-textarea" id="specialRequests" rows="3" placeholder="e.g. early check-in, extra pillows, dietary restrictions…"></textarea>
              </div>
            </div>
          </div>

          <!-- RIGHT: Stay Details -->
          <div>
            <div class="card mb-md">
              <h3 style="margin-bottom:1rem;">🏠 Stay Details</h3>
              <div class="form-group">
                <label class="form-label" for="roomSelect">Room <span class="req">*</span></label>
                <select class="form-select" id="roomSelect" required>
                  <option value="">— Select a room —</option>
                </select>
                <span class="form-error" id="room-err">Please select a room.</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="checkInDate">Check-in Date <span class="req">*</span></label>
                <input class="form-input" type="date" id="checkInDate" required>
                <span class="form-error" id="checkin-err">Check-in date is required.</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="checkOutDate">Check-out Date <span class="req">*</span></label>
                <input class="form-input" type="date" id="checkOutDate" required>
                <span class="form-error" id="checkout-err">Check-out must be after check-in.</span>
              </div>

              <!-- Stay summary -->
              <div id="stay-summary" style="background:var(--bg-raised);border-radius:var(--radius-sm);padding:0.75rem;margin-bottom:0.75rem;display:none;">
                <div class="bill-row"><span>Nights</span><strong id="sum-nights">—</strong></div>
                <div class="bill-row"><span>Rate per night</span><strong id="sum-rate">—</strong></div>
                <div class="bill-row" style="border-top:1px dashed var(--border);margin-top:0.4rem;padding-top:0.4rem;">
                  <span>Subtotal</span><strong id="sum-subtotal">—</strong>
                </div>
                <div class="bill-row"><span id="sum-gst-label">Room GST (0%)</span><strong id="sum-gst-amount">—</strong></div>
                <div class="bill-row" style="border-top:1px solid var(--border);margin-top:0.4rem;padding-top:0.4rem;">
                  <span style="color:var(--gold-bright);">Estimated Total</span>
                  <strong id="sum-total" style="color:var(--gold-bright);">—</strong>
                </div>
              </div>

              <div class="form-grid form-grid--2">
                <div class="form-group">
                  <label class="form-label" for="adults">Adults <span class="req">*</span></label>
                  <input class="form-input" type="number" id="adults" min="1" max="10" value="1" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="children">Children</label>
                  <input class="form-input" type="number" id="children" min="0" max="10" value="0">
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn--primary btn--full btn--lg" id="submit-booking" style="margin-bottom:0.5rem;">
              ✓ Confirm Booking
            </button>
            <button type="button" class="btn btn--ghost btn--full" id="clear-form-btn">Clear Form</button>
          </div>

        </div>
      </form>
    </div>
  `;

  const roomSelect = document.getElementById('roomSelect');
  const cRooms = await window.RoomCache.getRooms();
  const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type, floor: r.floor, rate: r.base_price_per_night }));
  rooms.forEach(r => {
    // Derive real-time status from bookings + localStorage overrides
    const st = MockData.getRoomStatus(r.id);
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `Room ${r.number} — ${r.type} (${GM.fmt.currency(r.rate)}/night)`;
    // Only 'available' rooms are selectable; confirmed/occupied/maintenance are disabled
    if (st !== 'available') {
      opt.disabled = true;
      opt.textContent += st === 'maintenance' ? ' [Maintenance]' : ' [Unavailable]';
    }
    roomSelect.appendChild(opt);
  });

  // Aadhaar auto-format + returning guest auto-fetch
  const aadhaarInput = document.getElementById('guestAadhaar');
  let lastLookedUpAadhaar = '';
  aadhaarInput.addEventListener('input', () => {
    let v = aadhaarInput.value.replace(/\D/g, '').substring(0, 12);
    aadhaarInput.value = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

    // When all 12 digits are entered, look up returning guest
    if (v.length === 12 && v !== lastLookedUpAadhaar) {
      lastLookedUpAadhaar = v;
      const formatted = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      const guest = MockData.guests.find(g =>
        g.aadhaar && g.aadhaar.replace(/\s/g, '') === v
      );
      if (guest) {
        // Auto-fill guest details
        const fields = {
          guestName: guest.name || '',
          guestPhone: guest.phone || '',
          guestEmail: guest.email || '',
          guestAddress: guest.address || '',
        };
        Object.entries(fields).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el && val) {
            el.value = val;
            // Brief highlight animation
            el.style.transition = 'box-shadow 0.3s ease';
            el.style.boxShadow = '0 0 0 2px var(--gold-bright)';
            setTimeout(() => { el.style.boxShadow = ''; }, 1500);
          }
        });
        GM.toast(`👋 Welcome back, ${guest.name}! Details auto-filled.`, 'success');
      }
    }
  });

  // Image previews
  function setupPreview(inputId, previewId, imgId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const img = document.getElementById(imgId);
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; preview.classList.add('show'); };
      reader.readAsDataURL(file);
    });
  }
  setupPreview('aadhaarImage', 'aadhaar-preview', 'aadhaar-preview-img');

  function clearPreviews() {
    document.getElementById('aadhaar-preview').classList.remove('show');
    document.getElementById('aadhaar-preview-img').src = '';
    document.getElementById('stay-summary').style.display = 'none';
  }

  document.getElementById('clear-form-btn').addEventListener('click', () => {
    document.getElementById('new-booking-form').reset();
    clearPreviews();
  });

  // Stay summary live update
  function updateSummary() {
    const roomId = roomSelect.value;
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    const summary = document.getElementById('stay-summary');
    if (!roomId || !checkIn || !checkOut || checkOut <= checkIn) { summary.style.display = 'none'; return; }
    const room = rooms.find(r => r.id === roomId);
    const nights = GM.nights(checkIn, checkOut);
    const subtotal = nights * room.rate;
    const roomGST = window.GMSettings ? window.GMSettings.get('roomGST') : 12;
    const gstAmount = Math.round(subtotal * (roomGST / 100));
    const total = subtotal + gstAmount;

    document.getElementById('sum-nights').textContent = nights + ' nights';
    document.getElementById('sum-rate').textContent = GM.fmt.currency(room.rate);
    document.getElementById('sum-subtotal').textContent = GM.fmt.currency(subtotal);
    document.getElementById('sum-gst-label').textContent = `Room GST (${roomGST}%)`;
    document.getElementById('sum-gst-amount').textContent = GM.fmt.currency(gstAmount);
    document.getElementById('sum-total').textContent = GM.fmt.currency(total);
    summary.style.display = 'block';
  }
  roomSelect.addEventListener('change', updateSummary);
  document.getElementById('checkInDate').addEventListener('change', updateSummary);
  document.getElementById('checkOutDate').addEventListener('change', updateSummary);

  // Set default & min dates — today for check-in, tomorrow for check-out
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const checkInEl = document.getElementById('checkInDate');
  const checkOutEl = document.getElementById('checkOutDate');
  checkInEl.min = today;
  checkInEl.value = today;
  checkOutEl.min = today;
  checkOutEl.value = tomorrow;

  // Form submission
  document.getElementById('new-booking-form').addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('submit-booking');
    const fields = [
      { id: 'guestName', errId: 'guestName-err', check: v => v.trim().length >= 2 },
      { id: 'guestPhone', errId: 'guestPhone-err', check: v => /^[6-9]\d{9}$/.test(v.trim()) },
      { id: 'guestAddress', errId: 'guestAddress-err', check: v => v.trim().length >= 5 },
      { id: 'guestAadhaar', errId: 'guestAadhaar-err', check: v => v.replace(/\s/g, '').length === 12 },
      { id: 'roomSelect', errId: 'room-err', check: v => !!v },
      { id: 'checkInDate', errId: 'checkin-err', check: v => !!v },
      { id: 'checkOutDate', errId: 'checkout-err', check: v => v > document.getElementById('checkInDate').value },
    ];

    let valid = true;
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      const err = document.getElementById(f.errId);
      if (!f.check(el.value)) { el.classList.add('error'); err.classList.add('show'); valid = false; }
      else { el.classList.remove('error'); err.classList.remove('show'); }
    });
    if (!valid) return;

    GM.btnLoading(btn, true);
    setTimeout(async () => {
      const name = document.getElementById('guestName').value.trim();
      const phone = document.getElementById('guestPhone').value.trim();
      const email = document.getElementById('guestEmail').value.trim();
      const address = document.getElementById('guestAddress').value.trim();
      const aadhaar = document.getElementById('guestAadhaar').value.trim();
      const roomId = roomSelect.value;
      const checkIn = document.getElementById('checkInDate').value;
      const checkOut = document.getElementById('checkOutDate').value;
      const adults = parseInt(document.getElementById('adults').value) || 1;
      const children = parseInt(document.getElementById('children').value) || 0;
      const special = document.getElementById('specialRequests')?.value?.trim() || '';

      try {
        // Find or create guest (match by Aadhaar first, then phone)
        const aadhaarClean = aadhaar.replace(/\s/g, '');
        const existingGuest = MockData.guests.find(g =>
          (g.aadhaar && g.aadhaar.replace(/\s/g, '') === aadhaarClean) || g.phone === phone
        );
        let guest;
        if (existingGuest) {
          guest = existingGuest;
          // Update details in case anything changed
          await MockData.updateGuest(guest.id, { name, phone, email, address, aadhaar });
        } else {
          guest = await MockData.addGuest({ name, phone, email, address, aadhaar, totalStays: 0, lastStay: null });
        }

        // Find selected room info
        const selectedRoom = rooms.find(r => r.id === roomId);
        const nights = GM.nights(checkIn, checkOut);

        // Save booking
        await MockData.addBooking({
          guestId: guest.id,
          guestName: name,
          roomId: roomId,
          roomNumber: selectedRoom ? selectedRoom.number : '—',
          checkIn, checkOut, adults, children,
          status: 'confirmed',
          specialRequests: special,
          rate: selectedRoom ? selectedRoom.rate : 0,
          nights,
        });

        GM.toast('🎉 Booking created successfully!', 'success');
        document.getElementById('new-booking-form').reset();
        clearPreviews();
      } catch (err) {
        console.error('Booking submission error:', err);
        // Error toast already shown by MockData
      } finally {
        GM.btnLoading(btn, false);
      }
    }, 500);
  });

  // Responsive grid
  const grid = document.getElementById('booking-grid');
  function handleResize() {
    grid.style.gridTemplateColumns = window.innerWidth < 900 ? '1fr' : '1fr 360px';
  }
  window.addEventListener('resize', handleResize);
  handleResize();
  window.__gmPageCleanup = () => window.removeEventListener('resize', handleResize);
})();
