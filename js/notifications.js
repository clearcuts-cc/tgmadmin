/* js/notifications.js — Real-time Notification System */
(function () {
  const STORAGE_KEY = 'gm_notifications';
  const MAX_NOTIFS = 20;

  window.GMNotifications = {
    notifications: [],

    init() {
      this.load();
      this.initAudio();
      // Migration: Fix existing broken #checkin links to #checkout
      this.notifications.forEach(n => {
        if (n.title.includes('Check-out') && n.link === '#checkin') n.link = '#checkout';
      });
      this.bindUI();
      this.setupRealtimeListeners();
      this.startOverdueCheck();
      this.render();
      console.log('Icon-based Smart Alerts system initialised');
    },

    load() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        this.notifications = stored ? JSON.parse(stored) : [];
      } catch (e) {
        this.notifications = [];
      }
    },

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications.slice(0, MAX_NOTIFS)));
    },

    /* ── AUDIO NOTIFICATION ──────────────────────────────────── */
    initAudio() {
      // Create an AudioContext for high-quality programmatic chimes
      this.audioCtx = null;
      document.addEventListener('mousedown', () => {
          if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }, { once: true });
    },

    playNotificationSound() {
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // High A
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.15); // Slide to A4
      
      gain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, this.audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    },

    add(title, text, type = 'info', link = null, meta = {}) {
      const notif = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        title,
        text,
        type, // 'info', 'success', 'warning', 'danger'
        time: new Date().toISOString(),
        unread: true,
        link,
        meta
      };

      this.notifications.unshift(notif);
      if (this.notifications.length > MAX_NOTIFS) this.notifications.pop();
      
      this.save();
      this.render();
      this.showToast(notif);
      this.playNotificationSound();
    },

    render() {
      const list = document.getElementById('notif-list');
      const badge = document.getElementById('notif-badge');
      if (!list) return;

      const unreadCount = this.notifications.filter(n => n.unread).length;
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }

      if (this.notifications.length === 0) {
        list.innerHTML = `
          <div class="notifications__empty">
            <span class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span>
            <p>No new alerts</p>
          </div>`;
        return;
      }

      const TYPES = {
        info: { icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>`, class: 'info' },
        success: { icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, class: 'success' },
        warning: { icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`, class: 'warning' },
        danger: { icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`, class: 'danger' }
      };

      list.innerHTML = this.notifications.map(n => {
        const t = TYPES[n.type] || TYPES.info;
        return `
          <div class="notification-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
            <div class="notification-icon" style="background:${this.getBg(n.type)}">${t.icon}</div>
            <div class="notification-content">
              <div class="notification-title">${n.title}</div>
              <div class="notification-text">${n.text}</div>
              <div class="notification-time">${this.timeAgo(n.time)}</div>
            </div>
          </div>`;
      }).join('');

      // Add click listeners to mark as read and redirect
      list.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const id = item.dataset.id;
          const n = this.notifications.find(notif => notif.id === id);
          if (!n) return;
          
          // Mark as read without a full rerender to avoid flickering/interruption
          n.unread = false;
          item.classList.remove('unread');
          this.save();
          this.updateBadge(); // Only update the badge count

          if (n.link) {
            window.location.hash = n.link;
            document.getElementById('notif-dropdown')?.classList.remove('open');
          }
        });
      });
    },

    updateBadge() {
      const badge = document.getElementById('notif-badge');
      if (!badge) return;
      const unreadCount = this.notifications.filter(n => n.unread).length;
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    },

    getBg(type) {
      switch(type) {
        case 'success': return 'var(--green-bg)';
        case 'warning': return 'var(--orange-bg)';
        case 'danger': return 'var(--red-bg)';
        default: return 'var(--blue-bg)';
      }
    },

    markAsRead(id) {
      const n = this.notifications.find(notif => notif.id === id);
      if (n && n.unread) {
        n.unread = false;
        this.save();
        this.render();
      }
    },

    clearAll() {
      this.notifications = [];
      this.save();
      this.render();
    },

    bindUI() {
      const btn = document.getElementById('notif-btn');
      const dropdown = document.getElementById('notif-dropdown');
      const closeBtn = document.getElementById('notif-close');
      const clearBtn = document.getElementById('notif-clear-all');

      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('open');
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => dropdown.classList.remove('open'));
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearAll());
      }

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    },

    showToast(notif) {
      // Use the existing GM.toast or similar
      if (window.GM && window.GM.toast) {
        window.GM.toast(`${notif.title}: ${notif.text}`, notif.type === 'danger' ? 'error' : notif.type);
      }
    },

    timeAgo(dateIso) {
      const seconds = Math.floor((new Date() - new Date(dateIso)) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return new Date(dateIso).toLocaleDateString();
    },

    /* ── Realtime Logics ─────────────────────────────────────── */
    setupRealtimeListeners() {
      window.addEventListener('gm:data-change', (e) => {
        const { type, table, record, old_record } = e.detail || {};
        const role = localStorage.getItem('gm_user_role') || 'employee';

        // 1. New Booking
        if (table === 'bookings' && type === 'INSERT') {
          if (role === 'admin' || role === 'manager') {
            this.add('New Booking Arrived', `Guest ${record.guestName} booked Room ${record.roomNumber}`, 'success', '#bookings');
          } else {
            this.add('New Booking', `Room ${record.roomNumber} is now confirmed for ${record.guestName}`, 'info', '#bookings');
          }
        }

        // 2. Cancellation
        if (table === 'bookings' && type === 'UPDATE' && record.status === 'cancelled' && old_record.status !== 'cancelled') {
          this.add('Booking Cancelled', `Room ${record.roomNumber} check-in for ${record.guestName} was cancelled.`, 'warning', '#bookings');
        }

        // 3. New Food Order
        if (table === 'orders' && type === 'INSERT') {
          this.add('New Food Order', `Room ${record.room || 'N/A'} placed an order (₹${record.total})`, 'info', `#orders?booking=${record.bookingId}`);
        }

        // 4. Admin Check-in (if handled by admin, notify others)
        if (table === 'bookings' && type === 'UPDATE' && record.status === 'checked_in' && old_record.status !== 'checked_in') {
          this.add('Guest Checked In', `${record.guestName} is now in Room ${record.roomNumber}`, 'success', '#bookings');
        }
      });
    },

    /* ── Proactive Overdue Check ─────────────────────────────── */
    startOverdueCheck() {
      // Check every 2 minutes
      setInterval(() => this.performOverdueCheck(), 120000);
      // Also run once on start after a delay
      setTimeout(() => this.performOverdueCheck(), 5000);
    },

    async performOverdueCheck() {
      if (typeof MockData === 'undefined' || !MockData.bookings) return;
      
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"

      // Find checked_in bookings that were supposed to check out today or earlier
      const overdue = MockData.bookings.filter(b => {
        if (b.status !== 'checked_in' && b.status !== 'due_checkout') return false;
        
        // If check-out date is in the past
        if (b.checkOut < todayStr) return true;
        
        // If check-out date is today and check-out time has passed (give 30 mins grace)
        if (b.checkOut === todayStr && b.checkOutTime) {
            const [h, m] = b.checkOutTime.split(':').map(Number);
            const scheduled = new Date();
            scheduled.setHours(h, m, 0, 0);
            const graceTime = new Date(scheduled.getTime() + 30 * 60000); // 30 mins grace
            return now > graceTime;
        }
        return false;
      });

      overdue.forEach(b => {
        const key = `overdue_alert_${b.id}_${todayStr}`;
        if (!sessionStorage.getItem(key)) {
          this.add('Overdue Check-out', `Room ${b.roomNumber} (${b.guestName}) has exceeded checkout time!`, 'danger', `#checkout?booking=${b.id}`);
          sessionStorage.setItem(key, 'true'); // Only alert once per session/day for this booking
        }
      });
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.GMNotifications.init());
  } else {
    window.GMNotifications.init();
  }
})();
