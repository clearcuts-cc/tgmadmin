/* calendar.js — Room availability matrix view */
(async function () {
    const main = document.getElementById('main-content');
    let currentStartDate = new Date();
    currentStartDate.setDate(1); // Start from the 1st of the current month
    currentStartDate.setHours(0, 0, 0, 0);

    function getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    function getDates(daysToShow) {
        const dates = [];
        for (let i = 0; i < daysToShow; i++) {
            const d = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth(), 1 + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }

    async function renderCalendar() {
        const daysToShow = getDaysInMonth(currentStartDate);
        const dates = getDates(daysToShow);
        const monthLabel = currentStartDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        main.innerHTML = `
        <style>
            .calendar-container {
                overflow-x: auto;
                background: var(--bg-panel);
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                margin-top: 1rem;
                position: relative;
                max-height: 70vh;
            }
            .calendar-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.82rem;
                table-layout: fixed;
            }
            .calendar-table th, .calendar-table td {
                border: 1px solid var(--border);
                padding: 0.75rem 0.5rem;
                text-align: center;
                height: 50px;
                min-width: 80px;
                width: 80px;
            }
            .calendar-table th {
                background: var(--bg-surface);
                font-weight: 600;
                color: var(--text-secondary);
                position: sticky;
                top: 0;
                z-index: 10;
            }
            .calendar-table th.room-col, .calendar-table td.room-col {
                position: sticky;
                left: 0;
                background: var(--bg-surface);
                min-width: 140px;
                width: 140px;
                z-index: 11;
                text-align: left;
                padding-left: 1rem;
                border-right: 2px solid var(--border);
            }
            .day-header {
                font-size: 0.65rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                display: block;
                margin-bottom: 2px;
                color: var(--text-muted);
            }
            .date-header {
                font-size: 0.95rem;
                font-family: var(--font-display);
                color: var(--text-primary);
            }
            .date-header.is-today {
                color: var(--gold-bright);
                text-decoration: underline;
            }

            .cell-booking {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                font-size: 0.65rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.1s;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding: 0 4px;
            }
            .cell-booking:hover {
                transform: scale(1.05);
                filter: brightness(1.2);
            }

            .status-available { background: transparent; }
            .status-confirmed { background: var(--blue-bg); border: 1px solid var(--blue); color: var(--blue); }
            .status-occupied { background: var(--red-bg); border: 1px solid var(--red); color: var(--red); }
            .status-due_checkout { background: var(--orange-bg); border: 1px solid var(--orange); color: var(--orange); }
            .status-maintenance { background: var(--purple-bg); border: 1px solid var(--purple); color: var(--purple); }

            .calendar-legend {
                display: flex;
                gap: 1.25rem;
                margin-top: 1.5rem;
                flex-wrap: wrap;
                font-size: 0.8rem;
                color: var(--text-muted);
                padding: 1rem;
                background: rgba(255,255,255,0.02);
                border-radius: var(--radius-sm);
            }
            .legend-item { display: flex; align-items: center; gap: 0.5rem; }
            .legend-box { width: 14px; height: 14px; border-radius: 3px; }

            .room-info { display: flex; flex-direction: column; }
            .room-num { font-weight: 700; color: var(--text-primary); font-size: 0.9rem; }
            .room-type { font-size: 0.7rem; color: var(--text-muted); }
        </style>

        <div class="page-header animate-in">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem;">
                <div>
                    <h1>Room Calendar</h1>
                    <p id="cal-period-label">View for <strong>${monthLabel}</strong></p>
                </div>
                <div style="display:flex;gap:0.75rem;">
                    <button class="btn btn--ghost" id="cal-today">Today</button>
                    <div style="display:flex;background:var(--bg-raised);border-radius:var(--radius-sm);padding:0.25rem;">
                      <button class="btn btn--sm" id="cal-prev" style="padding:0.4rem 1rem;">← Previous</button>
                      <div style="width:1px;background:var(--border);margin:0.25rem 0.1rem;"></div>
                      <button class="btn btn--sm" id="cal-next" style="padding:0.4rem 1rem;">Next →</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="page-content">
            <div class="calendar-container animate-in">
                <table class="calendar-table" id="calendar-table">
                    <!-- Injected by JS -->
                </table>
            </div>

            <div class="calendar-legend animate-in animate-in-delay-1">
                <div class="legend-item"><div class="legend-box status-available" style="border:1px solid var(--border)"></div> Available</div>
                <div class="legend-item"><div class="legend-box status-confirmed"></div> Confirmed (Pre-book)</div>
                <div class="legend-item"><div class="legend-box status-occupied"></div> Occupied</div>
                <div class="legend-item"><div class="legend-box status-due_checkout"></div> Due Checkout</div>
                <div class="legend-item"><div class="legend-box status-maintenance"></div> Maintenance</div>
            </div>
        </div>
        `;

        const table = document.getElementById('calendar-table');
        const cRooms = await window.RoomCache.getRooms();
        const rooms = cRooms.map(r => ({ id: r.id, number: r.room_number, type: r.room_type }));
        const bookings = MockData.bookings;

        // Render Headers
        let headerHtml = `<thead><tr><th class="room-col">Room</th>`;
        dates.forEach(date => {
            const d = new Date(date);
            const isToday = date === MockData.TODAY;
            headerHtml += `
                <th>
                    <span class="day-header">${d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    <span class="date-header ${isToday ? 'is-today' : ''}">${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                </th>`;
        });
        headerHtml += `</tr></thead>`;

        // Render Rows
        let bodyHtml = `<tbody>`;
        rooms.forEach(room => {
            bodyHtml += `<tr><td class="room-col">
                <div class="room-info">
                    <span class="room-num">${room.number}</span>
                    <span class="room-type">${room.type}</span>
                </div>
            </td>`;

            dates.forEach(date => {
                const booking = bookings.find(b => 
                    b.roomId === room.id && 
                    b.status !== 'cancelled' &&
                    date >= b.checkIn && 
                    date <= b.checkOut
                );

                const isMaint = MockData.isMaintenance(room.id);
                let content = '';
                let cellClass = 'status-available';

                if (isMaint) {
                    cellClass = 'status-maintenance';
                    content = `<div class="cell-booking status-maintenance" title="Maintenance">🛠 Maint</div>`;
                } else if (booking) {
                    const status = booking.status;
                    let finalClass = 'status-confirmed';
                    if (booking.status === 'checked_in') {
                        finalClass = (date === MockData.TODAY && booking.checkOut === MockData.TODAY) ? 'status-due_checkout' : 'status-occupied';
                    }
                    
                    let labelSuffix = '';
                    if (date === booking.checkIn) labelSuffix = ' (IN)';
                    else if (date === booking.checkOut) labelSuffix = ' (OUT)';
                    
                    cellClass = finalClass;
                    if (date === booking.checkOut) cellClass = 'status-due_checkout'; // visual cue for checkout day

                    content = `<div class="cell-booking ${cellClass}" onclick="GMGo('#booking-detail?booking=${booking.id}')" title="${booking.guestName}: ${booking.checkIn} to ${booking.checkOut}">
                        <span style="font-size:0.75rem;font-weight:700;">${booking.guestName.split(' ')[0]}${labelSuffix}</span>
                    </div>`;
                } else {
                    content = `<div class="status-available" style="width:100%; height:100%; cursor:pointer;" 
                                    onclick="GMGo('#bookings-new?roomId=${room.id}&checkIn=${date}')" 
                                    title="Click to book Room ${room.number} on ${date}"></div>`;
                }

                bodyHtml += `<td class="${cellClass}" style="padding:0;">${content}</td>`;
            });
            bodyHtml += `</tr>`;
        });
        bodyHtml += `</tbody>`;

        table.innerHTML = headerHtml + bodyHtml;

        // Button Listeners
        document.getElementById('cal-prev').addEventListener('click', () => {
            currentStartDate.setMonth(currentStartDate.getMonth() - 1);
            renderCalendar();
        });
        document.getElementById('cal-next').addEventListener('click', () => {
            currentStartDate.setMonth(currentStartDate.getMonth() + 1);
            renderCalendar();
        });
        document.getElementById('cal-today').addEventListener('click', () => {
            currentStartDate = new Date();
            currentStartDate.setDate(1);
            currentStartDate.setHours(0, 0, 0, 0);
            renderCalendar();
        });
    }

    await renderCalendar();

    const onDataChange = () => renderCalendar();
    window.addEventListener('gm:data-change', onDataChange);

    window.__gmPageCleanup = () => {
        window.removeEventListener('gm:data-change', onDataChange);
    };

})();
