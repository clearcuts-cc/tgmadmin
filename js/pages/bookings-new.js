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
                  <input class="form-input" type="text" id="guestAadhaar" placeholder="XXXX XXXX XXXX" maxlength="14" required list="guest-aadhaar-list">
                  <datalist id="guest-aadhaar-list"></datalist>
                  <span class="form-error" id="guestAadhaar-err">Valid 12-digit Aadhaar required.</span>
                </div>
              </div>
            </div>

            <div class="card mb-md">
              <h3 style="margin-bottom:1rem;">📎 Documents</h3>
              <div class="form-grid form-grid--2">
                <div class="form-group">
                    <label class="form-label">Aadhaar Front Image</label>
                    <div class="upload-zone" id="aadhaar-front-zone">
                      <input type="file" id="aadhaarFrontImage" accept="image/*">
                      <div class="upload-zone__icon">🪪</div>
                      <div class="upload-zone__label" style="font-size:0.8rem">Click to upload Front</div>
                    </div>
                    <div class="upload-preview" id="aadhaar-front-preview" style="display:none; margin-top:0.5rem;"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Aadhaar Back Image</label>
                    <div class="upload-zone" id="aadhaar-back-zone">
                      <input type="file" id="aadhaarBackImage" accept="image/*">
                      <div class="upload-zone__icon">🪪</div>
                      <div class="upload-zone__label" style="font-size:0.8rem">Click to upload Back</div>
                    </div>
                    <div class="upload-preview" id="aadhaar-back-preview" style="display:none; margin-top:0.5rem;"></div>
                </div>
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
              <div class="form-grid form-grid--2">
                <div class="form-group">
                  <label class="form-label" for="roomSelect">Room <span class="req">*</span></label>
                  <select class="form-select" id="roomSelect" required>
                    <option value="">— Select a room —</option>
                  </select>
                  <span class="form-error" id="room-err">Please select a room.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="platformSelect">Booking Platform</label>
                  <select class="form-select" id="platformSelect">
                    <option value="">— Direct —</option>
                    <!-- Injected by JS -->
                  </select>
                </div>
                <div class="form-group" id="commission-row" style="display:none;">
                  <label class="form-label" for="platformCommAmt">Commission Amount (₹) <span style="font-size:0.65rem;opacity:0.5;font-weight:400;">(Optional)</span></label>
                  <input class="form-input" type="number" id="platformCommAmt" placeholder="e.g. 500" min="0" step="1">
                </div>
              </div>
              <div class="form-grid form-grid--2">
                <div class="form-group">
                  <label class="form-label" for="checkInDate">Check-in Date <span class="req">*</span></label>
                  <input class="form-input" type="date" id="checkInDate" required>
                  <span class="form-error" id="checkin-err">Check-in date is required.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="checkInTime">Check-in Time</label>
                  <input class="form-input" type="time" id="checkInTime" value="12:00">
                </div>
              </div>
              <div class="form-grid form-grid--2">
                <div class="form-group">
                  <label class="form-label" for="checkOutDate">Check-out Date <span class="req">*</span></label>
                  <input class="form-input" type="date" id="checkOutDate" required>
                  <span class="form-error" id="checkout-err">Check-out must be after check-in.</span>
                </div>
                <div class="form-group">
                  <label class="form-label" for="checkOutTime">Check-out Time</label>
                  <input class="form-input" type="time" id="checkOutTime" value="11:00">
                </div>
              </div>

              <!-- Stay summary -->
              <div id="stay-summary" style="background:var(--bg-raised);border-radius:var(--radius-sm);padding:0.75rem;margin-bottom:0.75rem;display:none;">
                <div class="bill-row"><span>Nights</span><strong id="sum-nights">—</strong></div>
                <div class="bill-row"><span>Rate per night</span><strong id="sum-rate">—</strong></div>
                <div class="bill-row" style="border-top:1px dashed var(--border);margin-top:0.4rem;padding-top:0.4rem;">
                  <span>Subtotal</span><strong id="sum-subtotal">—</strong>
                </div>
                <div class="bill-row" id="sum-gst-row"><span id="sum-gst-label">Room GST (0%)</span><strong id="sum-gst-amount">—</strong></div>
                <div class="bill-row" style="border-top:1px solid var(--border);margin-top:0.4rem;padding-top:0.4rem;">
                  <span style="color:var(--gold-bright);">Estimated Total</span>
                  <strong id="sum-total" style="color:var(--gold-bright);">—</strong>
                </div>
                <div class="bill-row" id="sum-advance-row" style="display:none;color:rgba(100,220,120,0.9);">
                  <span>Advance Paid</span><strong id="sum-advance-amt" style="color:rgba(100,220,120,0.9);">—</strong>
                </div>
                <div class="bill-row" id="sum-due-row" style="display:none;border-top:1px dashed var(--border);margin-top:0.4rem;padding-top:0.4rem;">
                  <span style="color:var(--gold-bright);">Remaining Due at Checkout</span>
                  <strong id="sum-due-amt" style="color:var(--gold-bright);">—</strong>
                </div>
              </div>

              <!-- Advance Payment Toggle -->
              <div style="background:rgba(212,168,83,0.06);border:1px solid rgba(212,168,83,0.15);border-radius:9px;padding:0.7rem 0.9rem;margin-bottom:0.75rem;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;">
                  <div>
                    <div style="font-size:0.8rem;font-weight:700;color:var(--gold-bright);">Advance Payment</div>
                    <div style="font-size:0.7rem;color:rgba(255,255,255,0.35);margin-top:0.1rem;">Guest pays part now, rest at checkout</div>
                  </div>
                  <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;">
                    <input type="checkbox" id="advanceToggle" style="opacity:0;width:0;height:0;">
                    <span style="position:absolute;inset:0;background:rgba(255,255,255,0.12);border-radius:24px;cursor:pointer;transition:background 0.25s;" id="advance-track"></span>
                    <span style="position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform 0.25s;pointer-events:none;" id="advance-thumb"></span>
                  </label>
                </div>
                <div id="advance-amount-row" style="display:none;margin-top:0.65rem;">
                  <label class="form-label" for="advanceAmount" style="font-size:0.72rem;">Advance Amount (₹)</label>
                  <input class="form-input" type="number" id="advanceAmount" min="0" placeholder="e.g. 1000" style="margin-top:0.25rem;">
                </div>
              </div>

              <div class="form-grid form-grid--2">
                <div class="form-group">
                  <label class="form-label" for="adults">Adults <span class="req">*</span></label>
                  <input class="form-input" type="number" id="adults" min="1" max="10" value="2" required>
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

  // Populate Booking Platforms from GMSettings
  const platformSelect = document.getElementById('platformSelect');
  const commRow = document.getElementById('commission-row');
  const platforms = window.GMSettings ? window.GMSettings.get('bookingPlatforms') : ['Direct', 'Agoda', 'Booking.com', 'MakeMyTrip', 'Goibibo', 'Airbnb'];
  
  // Clear any existing options first (keep only the 'Direct' default)
  platformSelect.innerHTML = '<option value="">— Direct —</option>';
  
  platforms.filter(p => p !== 'Direct').forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    platformSelect.appendChild(opt);
  });

  platformSelect.addEventListener('change', () => {
    commRow.style.display = platformSelect.value ? 'block' : 'none';
  });

  // Aadhaar auto-format + returning guest auto-fetch
  const aadhaarInput = document.getElementById('guestAadhaar');
  const aadhaarList = document.getElementById('guest-aadhaar-list');
  let uploadedAadhaarFrontUrl = '';
  let uploadedAadhaarBackUrl = '';

  // Populate Aadhaar suggestions
  function refreshAadhaarSuggestions() {
    const uniqueAadhaars = [...new Set(MockData.guests.map(g => g.aadhaar).filter(a => !!a))];
    aadhaarList.innerHTML = uniqueAadhaars.map(a => `<option value="${a}">`).join('');
  }
  refreshAadhaarSuggestions();

  let lastLookedUpAadhaar = '';
  aadhaarInput.addEventListener('input', () => {
    let v = aadhaarInput.value.replace(/\D/g, '').substring(0, 12);

    // Auto-format only if not selecting from list
    if (aadhaarInput.value.length <= 14) {
      aadhaarInput.value = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }

    const cleanV = aadhaarInput.value.replace(/\s/g, '');

    // Proactive lookup: if 12 digits OR exact match in cache
    if (cleanV.length >= 4 && cleanV !== lastLookedUpAadhaar) {
      const guest = MockData.guests.find(g =>
        g.aadhaar && g.aadhaar.replace(/\s/g, '') === cleanV
      );

      if (guest) {
        lastLookedUpAadhaar = cleanV;
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

  // Image previews + Compression + Upload
  function setupPreview(inputId, previewId, zoneId, onUploadSuccess) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const zone = document.getElementById(zoneId);
    const label = zone.querySelector('.upload-zone__label');

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;

      const originalText = label.textContent;
      label.innerHTML = `<span class="btn-spinner"></span> Compressing…`;
      zone.style.opacity = '0.6';
      zone.style.pointerEvents = 'none';

      try {
        preview.innerHTML = ''; // clear preview container

        const compressedFile = await GM.compressImage(file, 200);

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = e => {
           const imgEl = document.createElement('img');
           imgEl.src = e.target.result;
           imgEl.style.width = '100%';
           imgEl.style.height = '100px';
           imgEl.style.objectFit = 'cover';
           imgEl.style.borderRadius = '6px';
           imgEl.style.border = '1px solid var(--border)';
           preview.appendChild(imgEl);
        };
        reader.readAsDataURL(compressedFile);

        label.innerHTML = `<span class="btn-spinner"></span> Uploading…`;
        const url = await MockData.uploadGuestDocument(compressedFile, file.name);

        onUploadSuccess(url);
        preview.classList.add('show');
        preview.style.display = 'block';

        label.innerHTML = `✅ Ready`;
        GM.toast(`Document uploaded successfully!`, 'success');
      } catch (err) {
        console.error('Upload error:', err);
        label.textContent = originalText;
        GM.toast('Could not upload image. Please try again.', 'error');
      } finally {
        zone.style.opacity = '1';
        zone.style.pointerEvents = 'auto';
      }
    });
  }
  setupPreview('aadhaarFrontImage', 'aadhaar-front-preview', 'aadhaar-front-zone', url => uploadedAadhaarFrontUrl = url);
  setupPreview('aadhaarBackImage', 'aadhaar-back-preview', 'aadhaar-back-zone', url => uploadedAadhaarBackUrl = url);

  function clearPreviews() {
    ['front', 'back'].forEach(side => {
      const p = document.getElementById(`aadhaar-${side}-preview`);
      if (p) { p.classList.remove('show'); p.style.display = 'none'; p.innerHTML = ''; }
      const label = document.querySelector(`#aadhaar-${side}-zone .upload-zone__label`);
      if (label) label.textContent = `Click to upload ${side.charAt(0).toUpperCase() + side.slice(1)}`;
    });
    document.getElementById('stay-summary').style.display = 'none';
    uploadedAadhaarFrontUrl = '';
    uploadedAadhaarBackUrl = '';
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

    const enableGST = window.GMSettings ? window.GMSettings.get('enableGST') : true;
    const gstRow = document.getElementById('sum-gst-row');
    if (gstRow) gstRow.style.display = enableGST ? 'flex' : 'none';

    if (!roomId || !checkIn || !checkOut || checkOut <= checkIn) { summary.style.display = 'none'; return; }
    const room = rooms.find(r => r.id === roomId);
    const nights = GM.nights(checkIn, checkOut);
    const subtotal = nights * room.rate;
    const roomGST = enableGST ? (window.GMSettings ? window.GMSettings.get('roomGST') : 12) : 0;
    const gstAmount = Math.round(subtotal * (roomGST / 100));
    const total = subtotal + gstAmount;

    document.getElementById('sum-nights').textContent = nights + ' nights';
    document.getElementById('sum-rate').textContent = GM.fmt.currency(room.rate);
    document.getElementById('sum-subtotal').textContent = GM.fmt.currency(subtotal);
    document.getElementById('sum-gst-label').textContent = `Room GST (${roomGST}%)`;
    document.getElementById('sum-gst-amount').textContent = GM.fmt.currency(gstAmount);
    document.getElementById('sum-total').textContent = GM.fmt.currency(total);
    summary.style.display = 'block';
    updateAdvanceSummary(total);
  }

  function updateAdvanceSummary(total) {
    const advToggle = document.getElementById('advanceToggle');
    const advAmt = parseFloat(document.getElementById('advanceAmount')?.value) || 0;
    const advRow = document.getElementById('sum-advance-row');
    const dueRow = document.getElementById('sum-due-row');
    if (advToggle?.checked && advAmt > 0) {
      advRow.style.display = 'flex';
      dueRow.style.display = 'flex';
      document.getElementById('sum-advance-amt').textContent = '-' + GM.fmt.currency(advAmt);
      document.getElementById('sum-due-amt').textContent = GM.fmt.currency(Math.max(0, total - advAmt));
    } else {
      advRow.style.display = 'none';
      dueRow.style.display = 'none';
    }
  }
  roomSelect.addEventListener('change', updateSummary);
  document.getElementById('checkInDate').addEventListener('change', updateSummary);
  document.getElementById('checkOutDate').addEventListener('change', updateSummary);

  // Advance toggle wiring
  const advanceToggle = document.getElementById('advanceToggle');
  const advanceAmtRow = document.getElementById('advance-amount-row');
  const advanceTrack = document.getElementById('advance-track');
  const advanceThumb = document.getElementById('advance-thumb');
  advanceToggle.addEventListener('change', () => {
    const on = advanceToggle.checked;
    advanceAmtRow.style.display = on ? 'block' : 'none';
    advanceTrack.style.background = on ? 'var(--gold-bright)' : 'rgba(255,255,255,0.12)';
    advanceThumb.style.transform = on ? 'translateX(20px)' : 'translateX(0)';
    const total = parseFloat(document.getElementById('sum-total')?.textContent?.replace(/[^\d.]/g, '')) || 0;
    updateAdvanceSummary(total);
  });
  document.getElementById('advanceAmount').addEventListener('input', () => {
    const total = parseFloat(document.getElementById('sum-total')?.textContent?.replace(/[^\d.]/g, '')) || 0;
    updateAdvanceSummary(total);
  });


  // Initial dates
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const checkInEl = document.getElementById('checkInDate');
  const checkOutEl = document.getElementById('checkOutDate');

  // Pre-fill from URL params (for calendar quick-booking)
  const preRoom = window.GMRouteParam('roomId');
  const preCheckIn = window.GMRouteParam('checkIn');
  if (preRoom) roomSelect.value = preRoom;
  if (preCheckIn) {
    checkInEl.value = preCheckIn;
    // Set checkout to next day relative to pre-checkin
    const nextDay = new Date(preCheckIn);
    nextDay.setDate(nextDay.getDate() + 1);
    checkOutEl.value = nextDay.toISOString().split('T')[0];
  } else {
    checkInEl.value = today;
    checkOutEl.value = tomorrow;
  }
  checkInEl.min = today;
  checkOutEl.min = today;
  updateSummary();

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
      const checkInTime = document.getElementById('checkInTime').value;
      const checkOut = document.getElementById('checkOutDate').value;
      const checkOutTime = document.getElementById('checkOutTime').value;
      const adults = parseInt(document.getElementById('adults').value) || 2;
      const children = parseInt(document.getElementById('children').value) || 0;
      const special = document.getElementById('specialRequests')?.value?.trim() || '';
      const advancePaid = document.getElementById('advanceToggle').checked
        ? (parseFloat(document.getElementById('advanceAmount').value) || 0) : 0;

      try {
        const finalUrl = [uploadedAadhaarFrontUrl, uploadedAadhaarBackUrl].filter(Boolean).join(',');

        // Find or create guest (match by Aadhaar first, then phone)
        const aadhaarClean = aadhaar.replace(/\s/g, '');
        const existingGuest = MockData.guests.find(g =>
          (g.aadhaar && g.aadhaar.replace(/\s/g, '') === aadhaarClean) || g.phone === phone
        );
        let guest;
        if (existingGuest) {
          guest = existingGuest;
          // Update details in case anything changed
          await MockData.updateGuest(guest.id, {
            name, phone, email, address, aadhaar,
            aadhaarUrl: finalUrl || guest.aadhaarUrl
          });
        } else {
          guest = await MockData.addGuest({
            name, phone, email, address, aadhaar,
            aadhaarUrl: finalUrl,
            totalStays: 0, lastStay: null
          });
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
          checkIn, checkOut, checkInTime, checkOutTime, adults, children,
          status: 'confirmed',
          specialRequests: special,
          platform: platformSelect.value || 'Direct',
          platform_comm: platformSelect.value ? (parseFloat(document.getElementById('platformCommAmt').value) || 0) : 0,
          rate: selectedRoom ? selectedRoom.rate : 0,
          nights,
          advance_paid: advancePaid,
          added_by: (JSON.parse(localStorage.getItem('gm_session') || '{}')).name || null,
        });

        GM.toast('🎉 Booking created successfully!', 'success');
        document.getElementById('new-booking-form').reset();
        clearPreviews();
        refreshAadhaarSuggestions(); // Update suggestions with the new guest
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
