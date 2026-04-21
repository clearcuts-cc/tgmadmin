/* menu.js — Food Menu page — localStorage-backed */
(function () {
  const main = document.getElementById('main-content');

  main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1>Food Menu</h1>
          <p>Manage menu items by category • Toggle availability anytime</p>
          ${(window.GMSettings && window.GMSettings.get('enableGST')) ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">* All prices are exclusive of GST</p>` : ''}
        </div>
        ${window.GMIsAdmin ? `<button class="btn btn--primary" id="add-item-btn">＋ Add Menu Item</button>` : ''}
      </div>
    </div>
    <div class="page-content">
      <div id="menu-content" class="animate-in"></div>
    </div>
  `;

  // --- MODAL PORTAL: Move modal to body to fix fixed-position scroll issue ---
  let modal = document.getElementById('item-modal');
  if (!modal) {
    const modalHTML = `
      <div class="modal-overlay" id="item-modal">
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title" id="modal-title">Add Menu Item</h2>
            <button class="modal__close" id="modal-close">✕</button>
          </div>
          <div class="modal__body">
            <form id="item-form" novalidate>
              <div class="form-grid form-grid--2">
                <div class="form-group" style="grid-column:1/-1;">
                  <label class="form-label" for="item-name">Name <span class="req">*</span></label>
                  <input class="form-input" type="text" id="item-name" placeholder="e.g. Masala Dosa" required>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                  <label class="form-label" for="item-desc">Description</label>
                  <textarea class="form-textarea" id="item-desc" rows="2" placeholder="Short description…"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label" for="item-category">Category <span class="req">*</span></label>
                  <select class="form-select" id="item-category">
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snacks">Snacks</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="item-price">Price (₹) <span class="req">*</span></label>
                  <input class="form-input" type="number" id="item-price" min="1" placeholder="e.g. 120" required>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                  <label class="toggle-wrap" for="item-available">
                    <span class="toggle">
                      <input type="checkbox" id="item-available" checked>
                      <span class="toggle-slider"></span>
                    </span>
                    Available
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" id="modal-cancel">Cancel</button>
            <button class="btn btn--primary" id="modal-save">Save Item</button>
          </div>
        </div>
      </div>`;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    modal = tempDiv.firstElementChild;
    document.body.appendChild(modal);
  }

  const modalTitle = document.getElementById('modal-title');
  const modalSave = document.getElementById('modal-save');
  const modalForm = document.getElementById('item-form');


  let editingId = null;

  // modal, modalTitle, modalSave are already defined above via the portal logic

  const cats = ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages'];
  const catLabels = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snacks: '🍿 Snacks', beverages: '☕ Beverages' };

  function getMenuItems() { return MockData.menu; }

  function saveMenuItems(items) { return MockData.saveMenu(items); }

  const DEFAULT_MENU_FROM_PDF = [
    { id: crypto.randomUUID(), name: 'Idly', price: 35, category: 'breakfast', description: '2 pcs · chutney & sambar', available: true },
    { id: crypto.randomUUID(), name: 'Kal Dosai', price: 50, category: 'breakfast', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Egg Dosai', price: 70, category: 'breakfast', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Pongal', price: 90, category: 'breakfast', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Poori', price: 70, category: 'breakfast', description: '2 pieces', available: true },
    { id: crypto.randomUUID(), name: 'Veg Meals', price: 160, category: 'lunch', description: 'Sambal · Puli Kolumbu · Poriyal · Rasam · Curd', available: true },
    { id: crypto.randomUUID(), name: 'Chicken Meals', price: 210, category: 'lunch', description: 'Chicken (1 pc) · Rasam · Curd', available: true },
    { id: crypto.randomUUID(), name: 'Chicken Biryani', price: 1500, category: 'lunch', description: 'Min. order ½ kg · per kg', available: true },
    { id: crypto.randomUUID(), name: 'Fish Meals', price: 320, category: 'lunch', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Chappati', price: 50, category: 'dinner', description: '2 pieces', available: true },
    { id: crypto.randomUUID(), name: 'Phulka', price: 50, category: 'dinner', description: '2 pieces', available: true },
    { id: crypto.randomUUID(), name: 'Parotta / Wheat Parotta', price: 25, category: 'dinner', description: 'Min. 10 pcs · per piece', available: true },
    { id: crypto.randomUUID(), name: 'Veg Fried Rice / Noodles', price: 160, category: 'dinner', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Non-Veg Fried Rice / Noodles', price: 200, category: 'dinner', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Egg Fried Rice / Noodles', price: 180, category: 'dinner', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Boiled Egg', price: 20, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Omelette', price: 30, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Egg Masala', price: 75, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Egg Poriyal', price: 75, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Gobi 65', price: 150, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Paneer 65', price: 170, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Gobi Chilly', price: 160, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Gobi Manchurian', price: 170, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Gobi Masala', price: 180, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Paneer Butter Masala', price: 190, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Dal Fry', price: 140, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Green Peas Masala', price: 190, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Veg Kuruma — Classic Style', price: 300, category: 'snacks', description: 'Butter Beans · Carrot · Serves 2 people', available: true },
    { id: crypto.randomUUID(), name: 'Chicken Chukka', price: 150, category: 'snacks', description: '1 kg — ₹ 1100', available: true },
    { id: crypto.randomUUID(), name: 'Chicken 65', price: 120, category: 'snacks', description: '1 kg — ₹ 1000', available: true },
    { id: crypto.randomUUID(), name: 'Chilly Chicken', price: 190, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Chicken Manchurian', price: 190, category: 'snacks', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Chicken Chettinad', price: 180, category: 'snacks', description: '1 kg — ₹ 1100', available: true },
    { id: crypto.randomUUID(), name: 'Pepper Chicken', price: 180, category: 'snacks', description: '1 kg — ₹ 1300', available: true },
    { id: crypto.randomUUID(), name: 'Palli Palayam Chicken', price: 180, category: 'snacks', description: '1 kg — ₹ 1400', available: true },
    { id: crypto.randomUUID(), name: 'Chicken Chinthamani', price: 180, category: 'snacks', description: '1 kg — ₹ 1300', available: true },
    { id: crypto.randomUUID(), name: 'Tea / Black Tea', price: 20, category: 'beverages', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Coffee', price: 30, category: 'beverages', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Boost', price: 40, category: 'beverages', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Horlicks', price: 40, category: 'beverages', description: '', available: true },
    { id: crypto.randomUUID(), name: 'Milk', price: 30, category: 'beverages', description: 'Fresh & hot', available: true }
  ];

  let isSeeding = false;

  function renderMenu() {
    const content = document.getElementById('menu-content');
    const menuItems = getMenuItems();

    if (menuItems.length < 50 && !window.__gmSeeded && window.GMIsAdmin) {
      window.__gmSeeded = true;
      content.innerHTML = `<div class="empty-state"><span>🔄</span>Initializing menu from PDF...</div>`;
      
      const existingNames = new Set(menuItems.map(i => i.name.toLowerCase().trim()));
      const uniqueNewItems = DEFAULT_MENU_FROM_PDF.filter(i => !existingNames.has(i.name.toLowerCase().trim()));
      
      const combinedItems = [...menuItems, ...uniqueNewItems];
      saveMenuItems(combinedItems).then(() => {
        renderMenu(); // Re-render to show items
      });
      return;
    }

    let html = '';
    cats.forEach(cat => {
      const items = menuItems.filter(i => i.category === cat);
      if (!items.length) return;
      html += `<div class="menu-category-header">${catLabels[cat]}</div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
        ${items.map(item => `
          <div class="menu-item" id="menu-item-${item.id}">
            <div class="menu-item__info">
              <div class="menu-item__name">${item.name}${!item.available ? ` <span class="badge badge--gray" style="margin-left:0.4rem;">Unavailable</span>` : ''}</div>
              <div class="menu-item__desc">${(item.description && item.description !== 'undefined') ? item.description : ''}</div>
            </div>
            <div class="menu-item__price">₹${item.price}</div>
            ${(window.GMIsAdmin || window.GMIsManager || window.GMIsEmployee) ? `
            <label class="toggle" title="Toggle availability">
              <input type="checkbox" ${item.available ? 'checked' : ''} onchange="GMMenuToggle('${item.id}', this.checked)">
              <span class="toggle-slider"></span>
            </label>` : `<span class="badge ${item.available ? 'badge--green' : 'badge--gray'}" style="font-size:0.7rem;">${item.available ? 'Available' : 'Unavailable'}</span>`}
            <div class="menu-item__actions">
              ${window.GMIsAdmin ? `<button class="btn btn--sm btn--ghost btn--icon" title="Edit" onclick="GMMenuEdit('${item.id}')">✏</button>` : ''}
              ${window.GMIsAdmin ? `<button class="btn btn--sm btn--danger btn--icon" title="Delete" onclick="GMMenuDelete('${item.id}')">🗑</button>` : ''}
            </div>
          </div>`).join('')}
        </div>`;
    });
    content.innerHTML = html || `<div class="empty-state"><span>🍽</span>No menu items yet. Add your first item!</div>`;
  }

  window.GMMenuToggle = (id, val) => {
    const items = getMenuItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) { items[idx].available = val; saveMenuItems(items); renderMenu(); }
  };

  window.GMMenuDelete = (id) => {
    GM.confirm('Delete Menu Item', 'Remove this item from the menu?', () => {
      saveMenuItems(getMenuItems().filter(i => i.id !== id));
      renderMenu();
      GM.toast('Menu item removed.', 'info');
    }, 'Delete', true);
  };

  window.GMMenuEdit = (id) => {
    const item = getMenuItems().find(i => i.id === id);
    if (!item) return;
    editingId = id;
    modalTitle.textContent = 'Edit Menu Item';
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-desc').value = item.description;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-available').checked = item.available;
    modal.classList.add('open');
  };

  const addItemBtn = document.getElementById('add-item-btn');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
      editingId = null;
      modalTitle.textContent = 'Add Menu Item';
      document.getElementById('item-form').reset();
      document.getElementById('item-available').checked = true;
      modal.classList.add('open');
    });
  }

  function closeModal() { modal.classList.remove('open'); }
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  modalSave.addEventListener('click', () => {
    const name = document.getElementById('item-name').value.trim();
    const price = parseFloat(document.getElementById('item-price').value);
    if (!name || !price) { GM.toast('Name and price are required.', 'error'); return; }

    GM.btnLoading(modalSave, true);
    (async () => {
      const items = getMenuItems();
      if (editingId) {
        const idx = items.findIndex(i => i.id === editingId);
        items[idx] = {
          ...items[idx], name, price,
          description: document.getElementById('item-desc').value.trim(),
          category: document.getElementById('item-category').value,
          available: document.getElementById('item-available').checked
        };
        GM.toast('Menu item updated.', 'success');
      } else {
        items.push({
          id: crypto.randomUUID(), name, price,
          description: document.getElementById('item-desc').value.trim(),
          category: document.getElementById('item-category').value,
          available: document.getElementById('item-available').checked,
          added_by: (JSON.parse(localStorage.getItem('gm_session') || '{}')).name || null,
        });
        GM.toast('Menu item added!', 'success');
      }
      await MockData.saveMenu(items);
      GM.btnLoading(modalSave, false);
      closeModal();
      renderMenu();
    })();
  });

  renderMenu();

  // Real-time listener
  const onDataChange = (e) => {
    if (e.detail.table === 'menu') renderMenu();
  };
  window.addEventListener('gm:data-change', onDataChange);

  window.__gmPageCleanup = () => {
    window.removeEventListener('gm:data-change', onDataChange);
    delete window.GMMenuToggle;
    delete window.GMMenuDelete;
    delete window.GMMenuEdit;
  };
})();
