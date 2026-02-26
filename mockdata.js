// ============================================================
//  THE GRAND MIST — SUPABASE DATA STORE  (mockdata.js)
//  All data lives in Supabase. In-memory cache keeps the API
//  synchronous for page modules. Realtime keeps it live.
// ============================================================

const MockData = (() => {

    const TODAY = new Date().toISOString().split('T')[0];

    // ── IN-MEMORY CACHE (populated on init, kept fresh by realtime) ──
    const _cache = {
        guests: [],
        bookings: [],
        menu: [],
        orders: [],
        events: [],
        history: [],
        activeStays: {},
        roomStatuses: {},
    };

    let _ready = false;
    const db = () => window.supabaseClient;

    // ── INIT: Load all data from Supabase into cache ──────────────
    async function init() {
        if (_ready) return;
        try {
            const [g, b, m, o, e, h, s, sp, rs] = await Promise.all([
                db().from('guests').select('*'),
                db().from('bookings').select('*'),
                db().from('menu_items').select('*'),
                db().from('orders').select('*'),
                db().from('events').select('*'),
                db().from('billing_history').select('*').order('completed_at', { ascending: false }),
                db().from('active_stays').select('*'),
                db().from('stay_payments').select('*'),
                db().from('room_status_overrides').select('*'),
            ]);

            _cache.guests = (g.data || []).map(normalizeGuest);
            _cache.bookings = (b.data || []).map(normalizeBooking);
            _cache.menu = (m.data || []).map(normalizeMenu);
            _cache.orders = (o.data || []).map(normalizeOrder);
            _cache.events = (e.data || []).map(normalizeEvent);
            _cache.history = (h.data || []).map(normalizeHistory);

            // Build activeStays map keyed by booking_id
            const stays = s.data || [];
            const payments = sp.data || [];
            _cache.activeStays = {};
            stays.forEach(st => {
                _cache.activeStays[st.booking_id] = {
                    stayId: st.stay_id,
                    _dbId: st.id,
                    bookingId: st.booking_id,
                    guestName: st.guest_name,
                    room: st.room,
                    roomType: st.room_type,
                    checkinDate: st.checkin_date,
                    checkoutDate: st.checkout_date,
                    nights: st.nights,
                    rate: Number(st.rate),
                    payments: payments
                        .filter(p => p.stay_id === st.id)
                        .map(p => ({
                            _dbId: p.id,
                            type: p.type,
                            description: p.description,
                            amount: Number(p.amount),
                            method: p.method,
                            ref: p.ref,
                            paidAt: p.paid_at,
                        }))
                };
            });

            // Build room status override map
            _cache.roomStatuses = {};
            (rs.data || []).forEach(r => { _cache.roomStatuses[r.room_id] = r.status; });

            _ready = true;
            console.log('✅ MockData loaded from Supabase');
            window.dispatchEvent(new CustomEvent('gm-data-ready'));

            // Start realtime subscriptions
            setupRealtime();
        } catch (err) {
            console.error('❌ Failed to load data from Supabase:', err);
            _ready = true; // proceed with empty cache to avoid blocking
        }
    }

    // ── NORMALIZERS (Supabase snake_case → app camelCase) ──────────
    function normalizeGuest(g) {
        return {
            id: g.id, name: g.name, phone: g.phone, email: g.email || '',
            address: g.address || '', aadhaar: g.aadhaar || '',
            totalStays: g.total_stays || 0, lastStay: g.last_stay || null,
        };
    }
    function normalizeBooking(b) {
        return {
            id: b.id, guestId: b.guest_id, guestName: b.guest_name,
            roomId: b.room_id, roomNumber: b.room_number || '',
            checkIn: b.check_in, checkOut: b.check_out,
            adults: b.adults || 1, children: b.children || 0,
            status: b.status || 'confirmed',
            specialRequests: b.special_requests || '',
            rate: Number(b.rate) || 0, nights: b.nights || 1,
        };
    }
    function normalizeMenu(m) {
        return {
            id: m.id, name: m.name, category: m.category || '',
            price: Number(m.price), available: m.available !== false,
        };
    }
    function normalizeOrder(o) {
        return {
            id: o.id, bookingId: o.booking_id, guestName: o.guest_name || '',
            room: o.room || '', items: o.items || [], total: Number(o.total) || 0,
            status: o.status || 'pending', createdAt: o.created_at,
        };
    }
    function normalizeEvent(e) {
        return {
            id: e.id, name: e.title, description: e.description || '',
            date: e.date, time: e.time || '', type: e.type || 'general',
            price: Number(e.price) || 0, maxCapacity: Number(e.max_capacity) || 0,
            registrations: e.registrations || [],
        };
    }
    function normalizeHistory(h) {
        return {
            billNo: h.bill_no, bookingId: h.booking_id,
            guestName: h.guest_name, phone: h.phone || '',
            room: h.room || '', roomType: h.room_type || '',
            checkIn: h.check_in, checkOut: h.check_out,
            nights: h.nights || 1, rate: Number(h.rate) || 0,
            payments: h.payments || [], extraCharge: Number(h.extra_charge) || 0,
            discount: Number(h.discount) || 0, grandTotal: Number(h.grand_total) || 0,
            status: h.status || 'completed', completedAt: h.completed_at,
        };
    }

    // ── REALTIME SUBSCRIPTIONS ────────────────────────────────────
    function setupRealtime() {
        const channel = db().channel('gm-realtime');

        channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, payload => {
                handleRealtimeChange('guests', payload, normalizeGuest);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
                handleRealtimeChange('bookings', payload, normalizeBooking);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, payload => {
                handleRealtimeChange('menu', payload, normalizeMenu);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                handleRealtimeChange('orders', payload, normalizeOrder);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
                handleRealtimeChange('events', payload, normalizeEvent);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_history' }, payload => {
                if (payload.eventType === 'INSERT') {
                    const item = normalizeHistory(payload.new);
                    if (!_cache.history.find(h => h.billNo === item.billNo)) {
                        _cache.history.unshift(item);
                    }
                }
                fireChangeEvent('history');
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_stays' }, async () => {
                // Reload stays fully since they have nested payments
                const [s, p] = await Promise.all([
                    db().from('active_stays').select('*'),
                    db().from('stay_payments').select('*'),
                ]);
                _cache.activeStays = {};
                (s.data || []).forEach(st => {
                    _cache.activeStays[st.booking_id] = {
                        stayId: st.stay_id, _dbId: st.id,
                        bookingId: st.booking_id, guestName: st.guest_name,
                        room: st.room, roomType: st.room_type,
                        checkinDate: st.checkin_date, checkoutDate: st.checkout_date,
                        nights: st.nights, rate: Number(st.rate),
                        payments: (p.data || []).filter(px => px.stay_id === st.id).map(px => ({
                            _dbId: px.id, type: px.type, description: px.description,
                            amount: Number(px.amount), method: px.method, ref: px.ref, paidAt: px.paid_at,
                        }))
                    };
                });
                fireChangeEvent('active_stays');
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_status_overrides' }, async () => {
                const { data } = await db().from('room_status_overrides').select('*');
                _cache.roomStatuses = {};
                (data || []).forEach(r => { _cache.roomStatuses[r.room_id] = r.status; });
                fireChangeEvent('rooms');
            })
            .subscribe();

        console.log('📡 Realtime subscriptions active');
    }

    function handleRealtimeChange(cacheKey, payload, normalizer) {
        const arr = _cache[cacheKey];
        if (payload.eventType === 'INSERT') {
            const item = normalizer(payload.new);
            if (!arr.find(x => x.id === item.id)) arr.push(item);
        } else if (payload.eventType === 'UPDATE') {
            const item = normalizer(payload.new);
            const idx = arr.findIndex(x => x.id === item.id);
            if (idx !== -1) arr[idx] = item; else arr.push(item);
        } else if (payload.eventType === 'DELETE') {
            const id = payload.old.id;
            const idx = arr.findIndex(x => x.id === id);
            if (idx !== -1) arr.splice(idx, 1);
        }
        fireChangeEvent(cacheKey);
    }

    function fireChangeEvent(table) {
        window.dispatchEvent(new CustomEvent('gm:data-change', { detail: { table } }));
    }

    // ── ROOM STATUS (COMPUTED — same logic as before) ─────────────
    function computeRoomStatus(roomId) {
        if (_cache.roomStatuses[roomId] === 'maintenance') return 'maintenance';
        const today = new Date().toISOString().split('T')[0];
        const ACTIVE = ['due_checkout', 'checked_in', 'confirmed'];
        const activeBooking = _cache.bookings
            .filter(b => b.roomId === roomId && ACTIVE.includes(b.status))
            .sort((a, b) => ACTIVE.indexOf(a.status) - ACTIVE.indexOf(b.status))[0];
        if (!activeBooking) return 'available';
        if (activeBooking.status === 'checked_in') {
            return activeBooking.checkOut === today ? 'due_checkout' : 'occupied';
        }
        if (activeBooking.status === 'due_checkout') return 'due_checkout';
        if (activeBooking.status === 'confirmed') return 'confirmed';
        return 'available';
    }

    // ── PUBLIC API ────────────────────────────────────────────────
    return {
        TODAY,
        init,
        get isReady() { return _ready; },

        // Sync getters from cache
        get guests() { return _cache.guests; },
        get bookings() { return _cache.bookings; },
        get menu() { return _cache.menu; },
        get orders() { return _cache.orders; },
        get events() { return _cache.events; },
        get history() { return _cache.history; },

        // ── ROOM STATUS ──────────────────────────────────────────
        getRoomStatus: computeRoomStatus,

        setMaintenance(roomId) {
            _cache.roomStatuses[roomId] = 'maintenance';
            db().from('room_status_overrides').upsert({ room_id: roomId, status: 'maintenance' }).then();
        },
        clearMaintenance(roomId) {
            delete _cache.roomStatuses[roomId];
            db().from('room_status_overrides').delete().eq('room_id', roomId).then();
        },
        isMaintenance: (roomId) => _cache.roomStatuses[roomId] === 'maintenance',

        // ── LOOKUPS ──────────────────────────────────────────────
        getGuestById: (id) => _cache.guests.find(g => g.id === id),
        getBookingById: (id) => _cache.bookings.find(b => b.id === id),
        getEventById: (id) => _cache.events.find(e => e.id === id),
        findActiveBookingByGuestName(name) {
            const n = name.toLowerCase();
            const stay = Object.values(_cache.activeStays).find(s => s.guestName.toLowerCase() === n);
            return stay ? stay.bookingId : null;
        },

        getActiveBookingForRoom(roomId) {
            const ACTIVE = ['due_checkout', 'checked_in', 'confirmed'];
            return _cache.bookings
                .filter(b => b.roomId === roomId && ACTIVE.includes(b.status))
                .sort((a, b) => ACTIVE.indexOf(a.status) - ACTIVE.indexOf(b.status))[0] || null;
        },

        // ── GUEST CRUD ───────────────────────────────────────────
        async addGuest(guestData) {
            const guest = {
                id: guestData.id || crypto.randomUUID(),
                name: guestData.name, phone: guestData.phone,
                email: guestData.email || '', address: guestData.address || '',
                aadhaar: guestData.aadhaar || '',
                totalStays: Number(guestData.totalStays) || 0,
                lastStay: guestData.lastStay || null,
            };

            try {
                const { error } = await db().from('guests').insert({
                    id: guest.id, name: guest.name, phone: guest.phone,
                    email: guest.email, address: guest.address, aadhaar: guest.aadhaar,
                    total_stays: guest.totalStays, last_stay: guest.lastStay,
                });

                if (error) {
                    console.error('addGuest error:', error);
                    GM.toast('Failed to save guest to cloud', 'error');
                    throw error;
                }

                _cache.guests.push(guest);
                GM.toast('Guest saved to cloud', 'success');
                return guest;
            } catch (err) {
                console.error('addGuest exception:', err);
                throw err;
            }
        },

        async updateGuest(id, updates) {
            const idx = _cache.guests.findIndex(g => g.id === id);
            if (idx !== -1) {
                _cache.guests[idx] = { ..._cache.guests[idx], ...updates };
            }
            const dbUpdates = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.aadhaar !== undefined) dbUpdates.aadhaar = updates.aadhaar;
            if (updates.totalStays !== undefined) dbUpdates.total_stays = updates.totalStays;
            if (updates.lastStay !== undefined) dbUpdates.last_stay = updates.lastStay;

            if (Object.keys(dbUpdates).length) {
                try {
                    const { error } = await db().from('guests').update(dbUpdates).eq('id', id);
                    if (error) console.error('updateGuest error:', error);
                } catch (err) {
                    console.error('updateGuest exception:', err);
                }
            }
        },

        deleteGuest(id) {
            _cache.guests = _cache.guests.filter(g => g.id !== id);
            db().from('guests').delete().eq('id', id).then(({ error }) => {
                if (error) console.error('deleteGuest error:', error);
            });
        },

        // ── BOOKING CRUD ─────────────────────────────────────────
        async addBooking(bookingData) {
            const booking = {
                id: bookingData.id || crypto.randomUUID(),
                guestId: bookingData.guestId, guestName: bookingData.guestName,
                roomId: bookingData.roomId, roomNumber: bookingData.roomNumber || '',
                checkIn: bookingData.checkIn, checkOut: bookingData.checkOut,
                adults: Number(bookingData.adults) || 1,
                children: Number(bookingData.children) || 0,
                status: bookingData.status || 'confirmed',
                specialRequests: bookingData.specialRequests || '',
                rate: Number(bookingData.rate) || 0,
                nights: Number(bookingData.nights) || 1,
            };

            try {
                const { error } = await db().from('bookings').insert({
                    id: booking.id, guest_id: booking.guestId, guest_name: booking.guestName,
                    room_id: booking.roomId, room_number: booking.roomNumber,
                    check_in: booking.checkIn, check_out: booking.checkOut,
                    adults: booking.adults, children: booking.children,
                    status: booking.status, special_requests: booking.specialRequests,
                    rate: booking.rate, nights: booking.nights,
                });

                if (error) {
                    console.error('addBooking error:', error);
                    GM.toast('Failed to save booking to cloud', 'error');
                    throw error;
                }

                _cache.bookings.push(booking);
                GM.toast(`Booking confirmed for ${booking.guestName}`, 'success');
                return booking;
            } catch (err) {
                console.error('addBooking exception:', err);
                throw err;
            }
        },

        async updateBookingStatus(bookingId, newStatus) {
            const b = _cache.bookings.find(b => b.id === bookingId);
            if (b) b.status = newStatus;
            try {
                const { error } = await db().from('bookings').update({ status: newStatus }).eq('id', bookingId);
                if (error) {
                    console.error('updateBookingStatus error:', error);
                    GM.toast('Failed to update booking status', 'error');
                }
            } catch (err) {
                console.error('updateBookingStatus exception:', err);
            }
        },

        deleteBooking(id) {
            _cache.bookings = _cache.bookings.filter(b => b.id !== id);
            db().from('bookings').delete().eq('id', id).then(({ error }) => {
                if (error) console.error('deleteBooking error:', error);
            });
        },

        // ── MENU CRUD ────────────────────────────────────────────
        async saveMenu(menuArray) {
            _cache.menu = menuArray;
            const rows = menuArray.map(m => {
                // Ensure id is a valid UUID
                let id = m.id;
                if (!id || String(id).startsWith('M')) {
                    id = crypto.randomUUID();
                    m.id = id; // update in-memory object too
                }
                return {
                    id,
                    name: m.name, category: m.category || '',
                    price: Number(m.price), available: m.available !== false,
                };
            });

            try {
                const { error } = await db().from('menu_items').upsert(rows);
                if (error) {
                    console.error('saveMenu error:', error);
                    GM.toast('Failed to sync menu to cloud', 'error');
                } else {
                    GM.toast('Menu synced to cloud', 'success');
                }
            } catch (err) {
                console.error('saveMenu exception:', err);
                GM.toast('Menu sync failed', 'error');
            }
        },

        // ── ORDER CRUD ───────────────────────────────────────────
        async addOrder(order) {
            // Ensure ID and BookingID are valid UUIDs
            let id = order.id;
            if (!id || String(id).startsWith('ORD')) {
                id = crypto.randomUUID();
            }

            const o = {
                id,
                bookingId: order.bookingId, guestName: order.guestName || '',
                room: order.room || '', items: order.items || [],
                total: Number(order.total) || 0, status: order.status || 'pending',
                createdAt: order.createdAt || new Date().toISOString(),
            };

            try {
                const { error } = await db().from('orders').insert({
                    id: o.id, booking_id: o.bookingId, guest_name: o.guestName,
                    room: o.room, items: o.items, total: o.total, status: o.status,
                });

                if (error) {
                    console.error('addOrder error:', error);
                    GM.toast('Failed to save order to cloud', 'error');
                } else {
                    _cache.orders.push(o);
                }
            } catch (err) {
                console.error('addOrder exception:', err);
            }
        },
        async updateOrderStatus(orderId, status) {
            try {
                const { error } = await db()
                    .from('orders')
                    .update({ status })
                    .eq('id', orderId);

                if (error) {
                    console.error('updateOrderStatus error:', error);
                    GM.toast('Failed to update order status', 'error');
                    return false;
                } else {
                    const idx = _cache.orders.findIndex(o => o.id === orderId);
                    if (idx !== -1) _cache.orders[idx].status = status;
                    GM.toast(`Order marked as ${status}`, 'success');
                    return true;
                }
            } catch (err) {
                console.error('updateOrderStatus exception:', err);
                return false;
            }
        },

        // ── EVENT CRUD ───────────────────────────────────────────
        async saveEvents(eventsArray) {
            _cache.events = eventsArray;
            const rows = eventsArray.map(e => {
                let id = e.id;
                if (!id || String(id).startsWith('EV')) {
                    id = crypto.randomUUID();
                    e.id = id;
                }
                return {
                    id,
                    title: e.name, description: e.description || '',
                    date: e.date, time: e.time || '', type: e.type || 'general',
                    price: Number(e.price) || 0, max_capacity: Number(e.maxCapacity) || 0,
                    registrations: e.registrations || [],
                };
            });
            try {
                const { error } = await db().from('events').upsert(rows);
                if (error) console.error('saveEvents error:', error);
            } catch (err) {
                console.error('saveEvents exception:', err);
            }
        },

        // ── HISTORY ──────────────────────────────────────────────
        async addHistory(record) {
            _cache.history.unshift(record);
            try {
                const { error } = await db().from('billing_history').insert({
                    bill_no: record.billNo, booking_id: record.bookingId,
                    guest_name: record.guestName, phone: record.phone || '',
                    room: record.room || '', room_type: record.roomType || '',
                    check_in: record.checkIn, check_out: record.checkOut,
                    nights: Number(record.nights), rate: Number(record.rate),
                    payments: record.payments || [],
                    extra_charge: Number(record.extraCharge) || 0,
                    discount: Number(record.discount) || 0,
                    grand_total: Number(record.grandTotal) || 0,
                    status: record.status || 'completed',
                    completed_at: record.completedAt || new Date().toISOString(),
                });
                if (error) {
                    console.error('addHistory error:', error);
                    GM.toast('Failed to save bill to cloud history', 'error');
                } else {
                    GM.toast(`Bill ${record.billNo} saved to cloud`, 'success');
                }
            } catch (err) {
                console.error('addHistory exception:', err);
            }
        },

        // ── STAY (BILLING) LAYER ─────────────────────────────────
        get activeStays() { return _cache.activeStays; },
        get completedBills() { return _cache.history; },

        async startStay(booking, room, paymentMethod, paymentRef) {
            const n = MockData.nightsBetween(booking.checkIn, booking.checkOut);
            const subtotal = n * room.rate;
            const roomGST = window.GMSettings ? window.GMSettings.get('roomGST') : 12;
            const gstAmount = Math.round(subtotal * (roomGST / 100));
            const amount = subtotal + gstAmount;

            const stayId = 'STAY-' + Date.now();
            const dbId = crypto.randomUUID();
            const paymentDbId = crypto.randomUUID();

            const stay = {
                stayId, _dbId: dbId, bookingId: booking.id,
                guestName: booking.guestName, room: booking.roomNumber,
                roomType: room.type, checkinDate: booking.checkIn,
                checkoutDate: booking.checkOut,
                nights: Number(n),
                rate: Number(room.rate),
                payments: [{
                    _dbId: paymentDbId, type: 'room',
                    description: `Room charges (${n} night${n > 1 ? 's' : ''} × ${MockData.formatCurrency(room.rate)}) + GST ${roomGST}%`,
                    amount: Number(amount),
                    paidAt: new Date().toISOString(),
                    method: paymentMethod, ref: paymentRef || '',
                }]
            };

            // Write to Supabase
            try {
                const { error } = await db().from('active_stays').insert({
                    id: dbId, stay_id: stayId, booking_id: booking.id,
                    guest_name: booking.guestName, room: booking.roomNumber,
                    room_type: room.type, checkin_date: booking.checkIn,
                    checkout_date: booking.checkOut,
                    nights: Number(n),
                    rate: Number(room.rate),
                });

                if (error) {
                    console.error('startStay error:', error);
                    GM.toast('Failed to start stay in cloud', 'error');
                    throw error;
                }

                // Insert the initial payment
                const { error: e2 } = await db().from('stay_payments').insert({
                    id: paymentDbId, stay_id: dbId, booking_id: booking.id,
                    type: 'room', description: stay.payments[0].description,
                    amount: Number(amount), method: paymentMethod, ref: paymentRef || '',
                });

                if (e2) {
                    console.error('startStay payment error:', e2);
                    GM.toast('Warning: Room payment not recorded in cloud', 'warning');
                }

                _cache.activeStays[booking.id] = stay;
                return stay;
            } catch (err) {
                console.error('startStay exception:', err);
                throw err;
            }
        },

        getStayByBookingId(bookingId) {
            return _cache.activeStays[bookingId] || null;
        },

        async addPaymentToStay(bookingId, payment) {
            const stay = _cache.activeStays[bookingId];
            if (!stay) return false;
            const pmt = { ...payment, paidAt: payment.paidAt || new Date().toISOString() };

            try {
                const { error } = await db().from('stay_payments').insert({
                    stay_id: stay._dbId, booking_id: bookingId,
                    type: pmt.type || 'extra', description: pmt.description || '',
                    amount: Number(pmt.amount), method: pmt.method || '', ref: pmt.ref || '',
                });

                if (error) {
                    console.error('addPayment error:', error);
                    GM.toast('Failed to record payment in cloud', 'error');
                } else {
                    stay.payments.push(pmt);
                    GM.toast('Payment recorded in cloud', 'success');
                }
            } catch (err) {
                console.error('addPayment exception:', err);
            }
            return true;
        },

        getStayTotal(bookingId) {
            const stay = _cache.activeStays[bookingId];
            if (!stay) return 0;
            return stay.payments.reduce((s, p) => s + p.amount, 0);
        },

        async completeStay(bookingId, extraCharge = 0, discount = 0) {
            const stay = _cache.activeStays[bookingId];
            if (!stay) return null;
            const booking = MockData.getBookingById(bookingId);
            const grandTotal = stay.payments.reduce((s, p) => s + p.amount, 0) + extraCharge - discount;
            const billNo = 'GM-' + new Date().getFullYear() + '-' + String(_cache.history.length + 1).padStart(4, '0');
            const completedBill = {
                billNo, bookingId,
                guestName: stay.guestName,
                phone: booking ? (MockData.getGuestById(booking.guestId)?.phone || '') : '',
                room: stay.room, roomType: stay.roomType,
                checkIn: stay.checkinDate, checkOut: stay.checkoutDate,
                nights: stay.nights, rate: stay.rate,
                payments: [...stay.payments],
                extraCharge, discount, grandTotal,
                status: 'completed', completedAt: new Date().toISOString(),
            };

            // ARCHIVE to history FIRST (await this)
            await MockData.addHistory(completedBill);

            // Remove active stay (await these too)
            const dbId = stay._dbId;
            delete _cache.activeStays[bookingId];

            try {
                await db().from('stay_payments').delete().eq('stay_id', dbId);
                await db().from('active_stays').delete().eq('id', dbId);
            } catch (err) {
                console.error('Error cleaning up active stay:', err);
            }

            // Update booking status
            MockData.updateBookingStatus(bookingId, 'checked_out');

            // Update guest stats
            if (booking) {
                const guest = MockData.getGuestById(booking.guestId);
                if (guest) {
                    MockData.updateGuest(guest.id, {
                        totalStays: (guest.totalStays || 0) + 1,
                        lastStay: stay.checkoutDate
                    });
                }
            }
            return completedBill;
        },

        // ── DASHBOARD STATS ──────────────────────────────────────
        getDashboardStats() {
            const bookings = _cache.bookings;
            const todayCheckIns = bookings.filter(b => b.checkIn === TODAY && b.status === 'confirmed').length;
            const todayCheckOuts = bookings.filter(b => b.checkOut === TODAY && ['checked_in', 'due_checkout'].includes(b.status)).length;
            const upcomingCheckouts = bookings
                .filter(b => ['checked_in', 'due_checkout'].includes(b.status) && b.checkOut >= TODAY)
                .sort((a, b) => a.checkOut.localeCompare(b.checkOut))
                .slice(0, 5)
                .map(b => ({ bookingId: b.id, guestName: b.guestName, room: b.roomNumber, checkOut: b.checkOut }));
            return { todayCheckIns, todayCheckOuts, upcomingCheckouts };
        },

        // ── GUEST STAY HISTORY ───────────────────────────────────
        get guestStayHistory() {
            const result = {};

            // 1. Process History (Completed)
            _cache.history.forEach(rec => {
                const booking = _cache.bookings.find(b => b.id === rec.bookingId);
                let guestId = booking ? booking.guestId : null;

                // Fallback: match by guest name if booking or guestId missing
                if (!guestId) {
                    const g = _cache.guests.find(x => x.name.toLowerCase() === rec.guestName.toLowerCase());
                    if (g) guestId = g.id;
                }

                if (!guestId) return;
                if (!result[guestId]) result[guestId] = [];
                result[guestId].push({
                    room: rec.room, checkIn: rec.checkIn, checkOut: rec.checkOut,
                    nights: rec.nights, total: rec.grandTotal, status: 'completed'
                });
            });

            // 2. Add Active Stays (Live)
            Object.values(_cache.activeStays).forEach(stay => {
                const booking = _cache.bookings.find(b => b.id === stay.bookingId);
                let guestId = booking ? booking.guestId : null;

                if (!guestId) {
                    const g = _cache.guests.find(x => x.name.toLowerCase() === stay.guestName.toLowerCase());
                    if (g) guestId = g.id;
                }

                if (!guestId) return;
                if (!result[guestId]) result[guestId] = [];

                // Don't duplicate if already added
                if (!result[guestId].find(x => x.checkIn === stay.checkinDate && x.status === 'active')) {
                    result[guestId].unshift({
                        room: stay.room, checkIn: stay.checkinDate, checkOut: stay.checkoutDate,
                        nights: stay.nights, total: stay.payments.reduce((s, p) => s + p.amount, 0),
                        status: 'active'
                    });
                }
            });

            return result;
        },

        // ── FORMATTING HELPERS ───────────────────────────────────
        formatCurrency: (n) => '₹' + Number(n).toLocaleString('en-IN'),
        formatDate: (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        nightsBetween(checkIn, checkOut) {
            const d1 = new Date(checkIn), d2 = new Date(checkOut);
            return Math.max(1, Math.round((d2 - d1) / 86400000));
        },

        // ── IMPORT (restore from JSON) ───────────────────────────
        importData(data) {
            // Import to Supabase
            if (data.guests && data.guests.length) {
                const rows = data.guests.map(g => ({
                    id: g.id || crypto.randomUUID(), name: g.name, phone: g.phone,
                    email: g.email || '', address: g.address || '', aadhaar: g.aadhaar || '',
                    total_stays: g.totalStays || 0, last_stay: g.lastStay || null,
                }));
                _cache.guests = data.guests;
                db().from('guests').upsert(rows).then();
            }
            if (data.bookings && data.bookings.length) {
                const rows = data.bookings.map(b => ({
                    id: b.id || crypto.randomUUID(), guest_id: b.guestId, guest_name: b.guestName,
                    room_id: b.roomId, room_number: b.roomNumber || '',
                    check_in: b.checkIn, check_out: b.checkOut,
                    adults: b.adults || 1, children: b.children || 0,
                    status: b.status || 'confirmed', special_requests: b.specialRequests || '',
                    rate: b.rate || 0, nights: b.nights || 1,
                }));
                _cache.bookings = data.bookings;
                db().from('bookings').upsert(rows).then();
            }
            if (data.menu && data.menu.length) { MockData.saveMenu(data.menu); }
            if (data.events && data.events.length) { MockData.saveEvents(data.events); }
            if (data.history && data.history.length) {
                _cache.history = data.history;
                const rows = data.history.map(h => ({
                    bill_no: h.billNo, booking_id: h.bookingId,
                    guest_name: h.guestName, phone: h.phone || '',
                    room: h.room || '', room_type: h.roomType || '',
                    check_in: h.checkIn, check_out: h.checkOut,
                    nights: h.nights, rate: h.rate, payments: h.payments || [],
                    extra_charge: h.extraCharge || 0, discount: h.discount || 0,
                    grand_total: h.grandTotal || 0, status: h.status || 'completed',
                }));
                db().from('billing_history').upsert(rows, { onConflict: 'bill_no' }).then();
            }
        },
    };
})();
