/* room-cache.js — Supabase-backed Room Management */
window.RoomCache = (function () {

    const db = () => window.supabaseClient;

    // In-memory cache for sync access
    let _rooms = [];
    let _loaded = false;

    async function getRooms() {
        if (_loaded) return _rooms;
        try {
            const { data, error } = await db().from('rooms').select('*');
            if (error) throw error;
            _rooms = data || [];
            _loaded = true;
        } catch (e) {
            console.error('Failed to get rooms from Supabase:', e);
        }
        return _rooms;
    }

    async function saveRooms(roomsArray) {
        try {
            _rooms = roomsArray;
            const rows = roomsArray.map(r => ({
                id: r.id, room_number: r.room_number, room_type: r.room_type,
                floor: r.floor, base_price_per_night: Number(r.base_price_per_night),
                capacity: Number(r.capacity) || 2,
                status: r.status || 'available',
            }));
            const { error } = await db().from('rooms').upsert(rows);
            if (error) throw error;
        } catch (e) {
            console.error('Failed to save rooms to Supabase:', e);
        }
    }

    async function addRoom(roomObj) {
        const room = { id: roomObj.id || crypto.randomUUID(), ...roomObj };
        _rooms.push(room);
        try {
            const { error } = await db().from('rooms').insert({
                id: room.id, room_number: room.room_number, room_type: room.room_type,
                floor: room.floor, base_price_per_night: Number(room.base_price_per_night),
                capacity: Number(room.capacity) || 2,
                status: room.status || 'available',
            });
            if (error) throw error;
            GM.toast(`Room ${room.room_number} added to cloud`, 'success');
        } catch (e) {
            console.error('Failed to add room to Supabase:', e);
            GM.toast('Failed to save room to cloud', 'error');
        }
    }

    async function updateRoom(id, updatedObj) {
        try {
            const dbUpdates = { ...updatedObj };
            if (dbUpdates.base_price_per_night !== undefined) dbUpdates.base_price_per_night = Number(dbUpdates.base_price_per_night);
            if (dbUpdates.capacity !== undefined) dbUpdates.capacity = Number(dbUpdates.capacity);

            const { error } = await db().from('rooms').update(dbUpdates).eq('id', id);
            if (error) throw error;

            // Only update local cache if DB update succeeds
            const index = _rooms.findIndex(r => r.id === id);
            if (index !== -1) _rooms[index] = { ..._rooms[index], ...updatedObj };

            GM.toast(`Room ${updatedObj.room_number || 'details'} updated in cloud`, 'success');
            return true;
        } catch (e) {
            console.error('Failed to update room in Supabase:', e);
            GM.toast('Failed to update room in cloud', 'error');
            throw e; // Re-throw so caller can handle
        }
    }

    async function deleteRoom(id) {
        _rooms = _rooms.filter(r => r.id !== id);
        try {
            const { error } = await db().from('rooms').delete().eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error('Failed to delete room from Supabase:', e);
        }
    }

    async function getRoomById(id) {
        if (_loaded) return _rooms.find(r => r.id === id) || null;
        const rooms = await getRooms();
        return rooms.find(r => r.id === id) || null;
    }

    // Realtime: invalidate cache on room changes
    function setupRealtime() {
        try {
            db().channel('room-cache-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, async () => {
                    const { data } = await db().from('rooms').select('*');
                    _rooms = data || [];
                    window.dispatchEvent(new CustomEvent('gm:data-change', { detail: { table: 'rooms' } }));
                })
                .subscribe();
        } catch (e) {
            console.error('Room realtime setup failed:', e);
        }
    }

    // Auto-setup realtime when supabase is ready
    setTimeout(() => { if (db()) setupRealtime(); }, 1000);

    return { getRooms, saveRooms, addRoom, updateRoom, deleteRoom, getRoomById };
})();
