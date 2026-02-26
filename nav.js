// nav.js — Shared navigation injector
// Call injectNav() in <body> to render sidebar + header + bottom nav

function injectNav(activePage) {
  const navLinks = [
    { href: "dashboard.html", icon: "⊞", label: "Dashboard", section: null },
    { href: "rooms.html", icon: "🏠", label: "Room Board", section: "Operations" },
    { href: "bookings.html", icon: "📋", label: "Bookings", section: null },
    { href: "bookings-new.html", icon: "＋", label: "New Booking", section: null },
    { href: "checkin.html", icon: "✔", label: "Check-in", section: null },
    { href: "checkout.html", icon: "↩", label: "Check-out", section: null },
    { href: "guests.html", icon: "👤", label: "Guests", section: "Guests & Menu" },
    { href: "menu.html", icon: "🍽", label: "Menu", section: null },
    { href: "orders.html", icon: "🧾", label: "Food Orders", section: null },
    { href: "events.html", icon: "🎉", label: "Events", section: "Events" },
    { href: "reports.html", icon: "📊", label: "Reports", section: "Analytics" },
    { href: "history.html", icon: "🕐", label: "Stay History", section: null },
    { href: "export.html", icon: "⬇", label: "Export / Import", section: "Data" },
  ];

  const curPage = activePage || window.location.pathname.split("/").pop() || "dashboard.html";

  // ── SIDEBAR HTML ──────────────────────────────────────────
  let sidebarItems = "";
  let lastSection = "__none__";
  navLinks.forEach(link => {
    if (link.section && link.section !== lastSection) {
      sidebarItems += `<div class="sidebar__section-label">${link.section}</div>`;
      lastSection = link.section;
    }
    const active = link.href === curPage ? "active" : "";
    sidebarItems += `
      <a href="${link.href}" class="sidebar__link ${active}" title="${link.label}">
        <span class="nav-icon">${link.icon}</span>
        <span class="nav-label">${link.label}</span>
      </a>`;
  });

  const sidebarHTML = `
    <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
      <nav class="sidebar__nav">
        ${sidebarItems}
      </nav>
      <div class="sidebar__footer">
        <div class="sidebar__mist-logo">
          ⛰ THE GRAND MIST · KODAIKANAL
        </div>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>`;

  // ── HEADER HTML ───────────────────────────────────────────
  const headerHTML = `
    <header class="header" id="app-header" role="banner">
      <button class="hamburger" id="hamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
      <a href="dashboard.html" class="header__logo">
        <div class="header__logo-mark">GM</div>
        <div class="header__logo-text">
          The Grand Mist
          <span class="header__logo-sub">Kodaikanal · Admin</span>
        </div>
      </a>
      <button class="header__sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
        ◀
      </button>
      <div class="header__spacer"></div>
      <div class="header__admin">
        <div class="header__admin-info">
          <div class="header__admin-name">Rajkumar S.</div>
          <div class="header__admin-role">Resort Manager</div>
        </div>
        <div class="header__avatar">RS</div>
        <button class="header__logout" onclick="window.location.href='login.html'" id="logout-btn">
          Logout
        </button>
      </div>
    </header>`;

  // ── BOTTOM NAV (mobile) ───────────────────────────────────
  const bnavLinks = [
    { href: "dashboard.html", icon: "⊞", label: "Home" },
    { href: "rooms.html", icon: "🏠", label: "Rooms" },
    { href: "bookings.html", icon: "📋", label: "Bookings" },
    { href: "guests.html", icon: "👤", label: "Guests" },
    { href: "reports.html", icon: "📊", label: "More" },
  ];
  let bnavItems = bnavLinks.map(l => {
    const active = l.href === curPage ? "active" : "";
    return `<a href="${l.href}" class="bnav__link ${active}" title="${l.label}">
      <span class="bnav__icon">${l.icon}</span>${l.label}
    </a>`;
  }).join("");

  const bnavHTML = `<nav class="bnav" role="navigation" aria-label="Bottom navigation">${bnavItems}</nav>`;

  // ── INJECT ────────────────────────────────────────────────
  document.body.insertAdjacentHTML("afterbegin", headerHTML);
  document.body.insertAdjacentHTML("beforeend", bnavHTML);

  // Insert sidebar as first child of .app-shell (grid row 2)
  const shell = document.querySelector(".app-shell");
  if (shell) {
    shell.insertAdjacentHTML("afterbegin", sidebarHTML);
  }

  // Init sidebar via utils
  if (typeof GM !== "undefined") GM.initSidebar();
}
