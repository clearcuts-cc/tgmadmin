/* menu.js — Food Menu page — localStorage-backed */
(function () {
  const main = document.getElementById('main-content');

  main.innerHTML = `
    <div class="page-header animate-in">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1>Food Menu</h1>
          <p>Manage menu items by category • Toggle availability anytime</p>
          <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">* All prices are exclusive of GST</p>
        </div>
        <button class="btn btn--primary" id="add-item-btn">＋ Add Menu Item</button>
      </div>
    </div>
    <div class="page-content">
      <div id="menu-content" class="animate-in"></div>
    </div>

    <!-- Add/Edit Modal -->
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
    </div>
  `;

  let editingId = null;

  const modal = document.getElementById('item-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalSave = document.getElementById('modal-save');

  const cats = ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages'];
  const catLabels = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snacks: '🍿 Snacks', beverages: '☕ Beverages' };

  function getMenuItems() { return MockData.menu; }

  function saveMenuItems(items) { MockData.saveMenu(items); }

  function renderMenu() {
    const content = document.getElementById('menu-content');
    const menuItems = getMenuItems();
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
              <div class="menu-item__desc">${item.description}</div>
            </div>
            <div class="menu-item__price">₹${item.price}</div>
            <label class="toggle" title="Toggle availability">
              <input type="checkbox" ${item.available ? 'checked' : ''} onchange="GMMenuToggle('${item.id}', this.checked)">
              <span class="toggle-slider"></span>
            </label>
            <div class="menu-item__actions">
              <button class="btn btn--sm btn--ghost btn--icon" title="Edit" onclick="GMMenuEdit('${item.id}')">✏</button>
              <button class="btn btn--sm btn--danger btn--icon" title="Delete" onclick="GMMenuDelete('${item.id}')">🗑</button>
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

  document.getElementById('add-item-btn').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Add Menu Item';
    document.getElementById('item-form').reset();
    document.getElementById('item-available').checked = true;
    modal.classList.add('open');
  });

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
          available: document.getElementById('item-available').checked
        });
      }
      await MockData.saveMenu(items);
      GM.btnLoading(modalSave, false);
      closeModal();
      renderMenu();
    })();
  });

  renderMenu();
})();
