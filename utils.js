// ============================================================
//  THE GRAND MIST — SHARED UTILITIES  (utils.js)
// ============================================================

/* ── TOAST ──────────────────────────────────────────────────
   Usage: GM.toast("Room checked in!", "success")
          GM.toast("Error saving.", "error")
   Types: success | error | info | warning
─────────────────────────────────────────────────────────── */
const GM = (() => {

    /* ── TOAST ─────────────────────────────────────────────── */
    function toast(message, type = "success", duration = 3500) {
        let container = document.getElementById("gm-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "gm-toast-container";
            document.body.appendChild(container);
        }
        const t = document.createElement("div");
        t.className = `gm-toast gm-toast--${type}`;
        const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
        t.innerHTML = `<span class="gm-toast__icon">${icons[type] || "ℹ"}</span><span class="gm-toast__msg">${message}</span>`;
        container.appendChild(t);
        requestAnimationFrame(() => t.classList.add("gm-toast--show"));
        setTimeout(() => {
            t.classList.remove("gm-toast--show");
            t.addEventListener("transitionend", () => t.remove(), { once: true });
        }, duration);
    }

    /* ── CONFIRM DIALOG ────────────────────────────────────── */
    function confirm(title, message, onConfirm, confirmLabel = "Confirm", danger = true) {
        const overlay = document.createElement("div");
        overlay.className = "gm-dialog-overlay";
        overlay.innerHTML = `
      <div class="gm-dialog">
        <h3 class="gm-dialog__title">${title}</h3>
        <p class="gm-dialog__msg">${message}</p>
        <div class="gm-dialog__actions">
          <button class="btn btn--ghost" id="gm-dialog-cancel">Cancel</button>
          <button class="btn ${danger ? "btn--danger" : "btn--primary"}" id="gm-dialog-confirm">${confirmLabel}</button>
        </div>
      </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("gm-dialog-overlay--show"));
        function close() {
            overlay.classList.remove("gm-dialog-overlay--show");
            overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
        }
        overlay.querySelector("#gm-dialog-cancel").addEventListener("click", close);
        overlay.querySelector("#gm-dialog-confirm").addEventListener("click", () => { close(); onConfirm(); });
        overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    }

    /* ── BUTTON SPINNER ────────────────────────────────────── */
    function btnLoading(btn, loading = true, originalText = null) {
        if (loading) {
            btn._originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<span class="btn-spinner"></span> Processing…`;
        } else {
            btn.disabled = false;
            btn.innerHTML = btn._originalHTML || originalText || btn.innerHTML;
        }
    }

    /* ── HIGHLIGHT ACTIVE NAV ──────────────────────────────── */
    function highlightNav() {
        const page = window.location.pathname.split("/").pop() || "dashboard.html";
        document.querySelectorAll(".sidebar__link, .bnav__link").forEach(a => {
            const href = a.getAttribute("href") || "";
            const linkPage = href.split("/").pop();
            if (linkPage === page) {
                a.classList.add("active");
                // expand parent if collapsed
                const group = a.closest(".sidebar__group");
                if (group) group.classList.add("open");
            } else {
                a.classList.remove("active");
            }
        });
    }

    /* ── SIDEBAR TOGGLE ────────────────────────────────────── */
    function initSidebar() {
        const sidebar = document.getElementById("sidebar");
        const toggle = document.getElementById("sidebar-toggle");
        const overlay = document.getElementById("sidebar-overlay");
        if (!sidebar) return;

        // Restore state
        const collapsed = localStorage.getItem("gm_sidebar_collapsed") === "true";
        if (collapsed) sidebar.classList.add("sidebar--collapsed");

        toggle?.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar--collapsed");
            localStorage.setItem("gm_sidebar_collapsed", sidebar.classList.contains("sidebar--collapsed"));
        });

        // Mobile: open/close via hamburger
        const hamburger = document.getElementById("hamburger");
        hamburger?.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar--open");
            overlay?.classList.toggle("sidebar-overlay--show");
        });
        overlay?.addEventListener("click", () => {
            sidebar.classList.remove("sidebar--open");
            overlay.classList.remove("sidebar-overlay--show");
        });
    }

    /* ── LIVE SEARCH FILTER ────────────────────────────────── */
    function liveFilter(inputId, rowSelector, cellSelector) {
        const input = document.getElementById(inputId);
        if (!input) return;
        input.addEventListener("input", () => {
            const q = input.value.toLowerCase();
            document.querySelectorAll(rowSelector).forEach(row => {
                const text = Array.from(row.querySelectorAll(cellSelector))
                    .map(c => c.textContent.toLowerCase()).join(" ");
                row.style.display = text.includes(q) ? "" : "none";
            });
        });
    }

    /* ── FORMAT ────────────────────────────────────────────── */
    const fmt = {
        currency: (n) => "₹" + Number(n).toLocaleString("en-IN"),
        date: (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        datetime: (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
    };

    /* ── STATUS BADGE ──────────────────────────────────────── */
    function statusBadge(status) {
        const map = {
            available: { label: "Available", cls: "badge--green" },
            confirmed: { label: "Confirmed", cls: "badge--blue" },
            occupied: { label: "Occupied", cls: "badge--red" },
            checked_in: { label: "Checked In", cls: "badge--red" },
            due_checkout: { label: "Due Checkout", cls: "badge--orange" },
            checked_out: { label: "Checked Out", cls: "badge--gray" },
            maintenance: { label: "Maintenance", cls: "badge--purple" },
            cancelled: { label: "Cancelled", cls: "badge--gray" },
            served: { label: "Served", cls: "badge--green" },
            pending: { label: "Pending", cls: "badge--orange" },
        };
        const s = map[status] || { label: status, cls: "badge--gray" };
        return `<span class="badge ${s.cls}">${s.label}</span>`;
    }

    /* ── CAPACITY BAR ──────────────────────────────────────── */
    function capacityBar(used, total) {
        const pct = Math.min(100, Math.round((used / total) * 100));
        const cls = pct >= 90 ? "cap-bar--full" : pct >= 60 ? "cap-bar--mid" : "cap-bar--low";
        return `
      <div class="cap-bar ${cls}" role="progressbar" aria-valuenow="${used}" aria-valuemax="${total}">
        <div class="cap-bar__fill" style="width:${pct}%"></div>
      </div>
      <small class="cap-label">${used} / ${total} registered (${pct}%)</small>`;
    }

    /* ── NIGHTS BETWEEN DATES ──────────────────────────────── */
    function nights(checkIn, checkOut) {
        const a = new Date(checkIn), b = new Date(checkOut);
        return Math.round((b - a) / 86400000);
    }

    /* ── QUERY PARAM ───────────────────────────────────────── */
    function param(key) {
        return new URLSearchParams(window.location.search).get(key);
    }

    /* ── PAGE INIT ─────────────────────────────────────────── */
    function init() {
        initSidebar();
        highlightNav();
        // Fade-in body
        document.body.classList.add("page-loaded");
    }

    /* ── ALERT DIALOG ─────────────────────────────────────── */
    function alert(title, message, btnLabel = "OK") {
        const overlay = document.createElement("div");
        overlay.className = "gm-dialog-overlay";
        overlay.innerHTML = `
      <div class="gm-dialog">
        <h3 class="gm-dialog__title">${title}</h3>
        <div class="gm-dialog__msg" style="max-height:60vh;overflow-y:auto;">${message}</div>
        <div class="gm-dialog__actions" style="justify-content:center;">
          <button class="btn btn--primary" id="gm-alert-close">${btnLabel}</button>
        </div>
      </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("gm-dialog-overlay--show"));
        const close = () => {
            overlay.classList.remove("gm-dialog-overlay--show");
            overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
        };
        overlay.querySelector("#gm-alert-close").addEventListener("click", close);
        overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    }

    return { toast, confirm, alert, btnLoading, highlightNav, initSidebar, liveFilter, fmt, statusBadge, capacityBar, nights, param, init };
})();

// Auto-init on DOM ready (only in legacy multi-page mode; SPA router handles its own init)
document.addEventListener("DOMContentLoaded", () => {
    // In SPA mode (router.js loaded), sidebar init is handled by router.js
    if (!window.GMNav) GM.init();
});

