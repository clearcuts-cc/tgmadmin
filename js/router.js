/**
 * router.js — Hash-based SPA router for The Grand Mist Admin
 * Dynamically loads page modules and injects them into #main-content
 */

(function () {

    /* ── SESSION ───────────────────────────────────────────── */
    const sessionRaw = localStorage.getItem('gm_session');
    if (!sessionRaw) { window.location.replace('login.html'); return; }
    const session = JSON.parse(sessionRaw);

    /* Expose role globally so all page modules + nav can read it */
    window.GMRole = (session.role || 'admin').toLowerCase();

    /* Permission helpers — employees can only add, not edit/delete */
    window.GMCan = {
        edit: () => window.GMRole !== 'employee',
        delete: () => window.GMRole !== 'employee',
    };

    /* ── POPULATE HEADER ───────────────────────────────────── */
    const nameEl = document.getElementById('header-name');
    const roleEl = document.getElementById('header-role');
    const avatarEl = document.getElementById('header-avatar');
    if (nameEl) nameEl.textContent = session.name || 'Admin';
    if (roleEl) roleEl.textContent = session.role || 'Manager';
    if (avatarEl) avatarEl.textContent = (session.name || 'A').charAt(0).toUpperCase();

    /* ── LOGOUT ─────────────────────────────────────────────── */
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (window.GM) {
            GM.confirm('Log Out', 'Are you sure you want to log out of the admin panel?', async () => {
                await window.supabaseClient.auth.signOut();
                localStorage.removeItem('gm_session');
                window.location.replace('login.html');
            }, 'Log Out', false);
        } else {
            window.supabaseClient.auth.signOut().then(() => {
                localStorage.removeItem('gm_session');
                window.location.replace('login.html');
            });
        }
    });

    /* ── SIDEBAR BEHAVIOURS ─────────────────────────────────── */
    const appEl = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle');

    // Restore collapsed state (desktop)
    if (localStorage.getItem('gm_sidebar_collapsed') === 'true') {
        appEl?.classList.add('sidebar--collapsed');
    }

    /* Update arrow text AND left position for current state.
     * Desktop: button is position:fixed; left driven by inline style so it
     *          tracks the sidebar width (CSS var can't reach it now it's outside #app).
     * Mobile:  left:0 when closed (peek tab), left:sidebarWidth when open. */
    function updateArrow() {
        if (!toggleBtn) return;
        const isMobile = window.innerWidth < 1024;
        if (isMobile) {
            const isOpen = sidebar?.classList.contains('sidebar--open');
            toggleBtn.textContent = isOpen ? '‹' : '›';
            // Use actual rendered width so 260px tablet and 240px mobile both work
            const sbW = (isOpen && sidebar) ? sidebar.offsetWidth : 0;
            toggleBtn.style.left = sbW + 'px';
        } else {
            const isCollapsed = appEl?.classList.contains('sidebar--collapsed');
            toggleBtn.textContent = isCollapsed ? '›' : '‹';
            // Button is outside #app so CSS custom-property selector won't reach it;
            // set left inline to the correct sidebar width
            const style = getComputedStyle(document.documentElement);
            const w = isCollapsed
                ? style.getPropertyValue('--sidebar-collapsed-w').trim()
                : style.getPropertyValue('--sidebar-w').trim();
            toggleBtn.style.left = w;
        }
    }

    /* Unified toggle — desktop collapse OR mobile drawer */
    toggleBtn?.addEventListener('click', () => {
        if (window.innerWidth < 1024) {
            const isOpen = sidebar?.classList.contains('sidebar--open');
            if (isOpen) {
                sidebar?.classList.remove('sidebar--open');
                overlay?.classList.remove('sidebar-overlay--show');
            } else {
                sidebar?.classList.add('sidebar--open');
                overlay?.classList.add('sidebar-overlay--show');
            }
        } else {
            appEl?.classList.toggle('sidebar--collapsed');
            localStorage.setItem('gm_sidebar_collapsed',
                appEl?.classList.contains('sidebar--collapsed') ? 'true' : 'false');
        }
        updateArrow();
    });

    /* Close on overlay tap (mobile) */
    overlay?.addEventListener('click', () => {
        sidebar?.classList.remove('sidebar--open');
        overlay?.classList.remove('sidebar-overlay--show');
        updateArrow();
    });

    /* Close drawer when a nav link is tapped (mobile) */
    document.getElementById('sidebar-nav')?.addEventListener('click', e => {
        const link = e.target.closest('.sidebar__link');
        if (link && window.innerWidth < 1024) {
            sidebar?.classList.remove('sidebar--open');
            overlay?.classList.remove('sidebar-overlay--show');
            updateArrow();
        }
    });

    /* Recalculate on resize (breakpoint crossing) */
    window.addEventListener('resize', updateArrow);

    /* Initial state */
    updateArrow();

    /* ── PAGE MODULE MAP ────────────────────────────────────── */
    const PAGE_MAP = {
        'dashboard': 'js/pages/dashboard.js',
        'rooms': 'js/pages/rooms.js',
        'bookings': 'js/pages/bookings.js',
        'bookings-new': 'js/pages/bookings-new.js',
        'booking-detail': 'js/pages/booking-detail.js',
        'checkin': 'js/pages/checkin.js',
        'checkout': 'js/pages/checkout.js',
        'guests': 'js/pages/guests.js',
        'menu': 'js/pages/menu.js',
        'orders': 'js/pages/orders.js',
        'events': 'js/pages/events.js',
        'reports': 'js/pages/reports.js',
        'history': 'js/pages/history.js',
        'export': 'js/pages/export.js',
        'settings': 'js/pages/settings.js',
        'employees': 'js/pages/employees.js',
    };

    /* Admin-only pages: redirect employees to dashboard */
    const ADMIN_ONLY_PAGES = new Set(['settings', 'employees']);

    /* ── CURRENT SCRIPT TRACKER ─────────────────────────────── */
    let currentPageScript = null;

    /* ── ROUTER ─────────────────────────────────────────────── */
    function parseHash() {
        const raw = window.location.hash.slice(1) || 'dashboard';
        const [page, qs] = raw.split('?');
        const params = {};
        if (qs) {
            qs.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
            });
        }
        return { page, params };
    }

    function navigate() {
        const { page, params } = parseHash();

        /* Redirect employees away from admin-only pages */
        if (window.GMRole === 'employee' && ADMIN_ONLY_PAGES.has(page)) {
            window.location.hash = '#dashboard';
            return;
        }

        // Highlight active nav link
        if (window.GMNav) GMNav.highlightNav(page);

        const scriptSrc = PAGE_MAP[page] || PAGE_MAP['dashboard'];
        const main = document.getElementById('main-content');

        // Fade out
        main.style.opacity = '0';
        main.style.transform = 'translateY(8px)';
        main.style.transition = 'opacity 150ms ease, transform 150ms ease';

        // Remove old page script if any
        if (currentPageScript) {
            currentPageScript.remove();
            currentPageScript = null;
        }

        // Reset any window-level page state
        if (window.__gmPageCleanup) {
            try { window.__gmPageCleanup(); } catch (e) { }
            window.__gmPageCleanup = null;
        }

        // Load new page script
        const script = document.createElement('script');
        script.src = scriptSrc + '?t=' + Date.now(); // cache-bust for fresh render
        script.setAttribute('data-page', page);
        script.dataset.params = JSON.stringify(params);

        script.onload = () => {
            // Fade in
            requestAnimationFrame(() => {
                main.style.opacity = '1';
                main.style.transform = 'translateY(0)';
            });
        };
        script.onerror = () => {
            main.innerHTML = `
        <div class="page-header"><h1>Page Not Found</h1><p>Module failed to load: ${scriptSrc}</p></div>
        <div class="page-content">
          <div class="empty-state"><span>🔍</span>This page module was not found.</div>
        </div>`;
            main.style.opacity = '1';
            main.style.transform = 'translateY(0)';
        };

        document.body.appendChild(script);
        currentPageScript = script;
    }

    /* ── PARAM HELPER ───────────────────────────────────────── */
    window.GMRouteParam = function (key) {
        const { params } = parseHash();
        return params[key] || null;
    };

    /* ── HASH NAVIGATE HELPER (used by page modules for links) ─ */
    window.GMGo = function (hash) {
        window.location.hash = hash;
    };

    /* ── LISTEN FOR HASH CHANGES ─────────────────────────────── */
    window.addEventListener('hashchange', navigate);

    /* ── INITIAL LOAD ────────────────────────────────────────── */
    // Default to #dashboard if no hash
    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#dashboard';
    } else {
        navigate();
    }

})();
