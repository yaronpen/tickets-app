/**
 * Tickets SPA – Vanilla JS
 * Communicates with the Laravel API via /api/*
 * (nginx proxies /api → http://backend:8000/api)
 */

const API = 'http://localhost:8000/api';

// ── State ──────────────────────────────────────────────────────────────────────
const state = {
  tickets:     [],
  users:       [],
  meta:        { total: 0, current_page: 1, last_page: 1 },
  filters:     { status: '', priority: '', assigned_user_id: '', sort_by: 'created_at', sort_dir: 'desc' },
  editingId:   null,   // null = create mode, number = edit mode
  statusTarget: null,  // ticket being status-changed
};

// ── Helpers ────────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message || Object.values(json.errors || {}).flat().join(' ') || 'שגיאה בשרת';
    throw new Error(msg);
  }
  return json;
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 3500);
}

const PRIORITY_LABEL = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const STATUS_LABEL   = { open: 'פתוח', in_progress: 'בטיפול', closed: 'סגור' };

function priorityIcon(p) {
  return { high: '🔴', medium: '🟡', low: '🟢' }[p] || '';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Data loading ───────────────────────────────────────────────────────────────
async function loadUsers() {
  try {
    state.users = await apiFetch('/users');
    populateUserDropdowns();
  } catch (e) {
    console.error('Failed to load users:', e);
  }
}

async function loadTickets(page = 1) {
  const grid = document.getElementById('ticketGrid');
  grid.innerHTML = '<div class="loading-state">⏳ טוען...</div>';

  const params = new URLSearchParams({ page, ...state.filters });
  // Remove empty params
  [...params.entries()].forEach(([k, v]) => { if (!v) params.delete(k); });

  try {
    const res = await apiFetch('/tickets?' + params.toString());
    
    state.tickets = res.data;
    state.meta = res.meta;
    renderTickets();
    renderPagination();
    updateStats(res.meta.stats);
  } catch (e) {
    grid.innerHTML = `<div class="error-state">❌ שגיאה בטעינת פניות: ${e.message}</div>`;
  }
}

// ── Render: ticket cards ───────────────────────────────────────────────────────
function renderTickets() {
  const grid = document.getElementById('ticketGrid');
  if (!state.tickets.length) {
    grid.innerHTML = '<div class="empty-state">📭 לא נמצאו פניות</div>';
    return;
  }

  grid.innerHTML = state.tickets.map(t => `
    <article class="ticket-card priority-${t.priority} status-${t.status}" data-id="${t.id}">
      <div class="card-header">
        <span class="badge-priority ${t.priority}">${priorityIcon(t.priority)} ${PRIORITY_LABEL[t.priority]}</span>
        <span class="badge-status  ${t.status}">${STATUS_LABEL[t.status]}</span>
      </div>

      <h3 class="card-title">${escapeHtml(t.title)}</h3>

      ${t.description
        ? `<p class="card-desc">${escapeHtml(t.description.substring(0, 120))}${t.description.length > 120 ? '…' : ''}</p>`
        : '<p class="card-desc no-desc">אין תיאור</p>'
      }

      <div class="card-meta">
        
        <span class="meta-user">
          ${Object.keys(t.assigned_user || {}).length > 0
            ? `👤 ${escapeHtml(t.assigned_user.name)}`
            : '<span class="unassigned">⚠️ לא משויך</span>'
          }
        </span>
        <span class="meta-date">📅 ${formatDate(t.created_at)}</span>
      </div>

      ${t.is_stale_high_priority == 1
        ? '<div class="stale-warning">⏰ פנייה זו חרגה מ-48 שעות ותאופס ל"פתוח"</div>'
        : ''
      }

      <div class="card-actions">
        <button class="btn btn-sm btn-secondary" onclick="openEditModal(${t.id})">✏️ עריכה</button>
        <button class="btn btn-sm btn-outline"   onclick="openStatusModal(${t.id})">🔄 סטטוס</button>
        <button class="btn btn-sm btn-danger"    onclick="deleteTicket(${t.id})">🗑️</button>
      </div>
    </article>
  `).join('');
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

// ── Render: pagination ─────────────────────────────────────────────────────────
function renderPagination() {
  const el = document.getElementById('pagination');
  const { current_page, last_page } = state.meta;
  if (last_page <= 1) { el.innerHTML = ''; return; }

  const pages = [];
  pages.push(`<button class="page-btn" ${current_page === 1 ? 'disabled' : ''} onclick="loadTickets(${current_page - 1})">‹</button>`);
  for (let i = 1; i <= last_page; i++) {
    pages.push(`<button class="page-btn ${i === current_page ? 'active' : ''}" onclick="loadTickets(${i})">${i}</button>`);
  }
  pages.push(`<button class="page-btn" ${current_page === last_page ? 'disabled' : ''} onclick="loadTickets(${current_page + 1})">›</button>`);
  el.innerHTML = pages.join('');
}

// ── Stats strip ────────────────────────────────────────────────────────────────
function updateStats(stats) {
  if (!stats) return;
  document.querySelector('#statTotal .stat-num').textContent = stats.total;
  document.getElementById('statOpen').textContent            = stats.open;
  document.getElementById('statProgress').textContent        = stats.in_progress;
  document.getElementById('statClosed').textContent          = stats.closed;
  document.getElementById('statHigh').textContent            = stats.high;
}

// ── User dropdowns ─────────────────────────────────────────────────────────────
function populateUserDropdowns() {
  const options = state.users.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');
  document.getElementById('fAssignedUser').innerHTML = '<option value="">ללא שיוך</option>' + options;
  document.getElementById('filterUser').innerHTML    = '<option value="">הכל</option>' + options;
}

// ── CREATE / EDIT Modal ────────────────────────────────────────────────────────
function openCreateModal() {
  state.editingId = null;
  document.getElementById('modalTitle').textContent = 'יצירת פנייה חדשה';
  document.getElementById('fTitle').value           = '';
  document.getElementById('fDescription').value     = '';
  document.getElementById('fStatus').value          = 'open';
  document.getElementById('fPriority').value        = 'medium';
  document.getElementById('fAssignedUser').value    = '';
  document.getElementById('ticketModal').classList.remove('hidden');
  document.getElementById('fTitle').focus();
}

async function openEditModal(id) {
  try {
    const t = await apiFetch('/tickets/' + id);
    state.editingId = id;
    document.getElementById('modalTitle').textContent    = 'עריכת פנייה #' + id;
    document.getElementById('fTitle').value              = t.title || '';
    document.getElementById('fDescription').value        = t.description || '';
    document.getElementById('fStatus').value             = t.status;
    document.getElementById('fPriority').value           = t.priority;
    document.getElementById('fAssignedUser').value       = t.assigned_user_id || '';
    document.getElementById('ticketModal').classList.remove('hidden');
    document.getElementById('fTitle').focus();
  } catch (e) {
    toast('שגיאה בטעינת הפנייה: ' + e.message, 'error');
  }
}

function closeModal() {
  document.getElementById('ticketModal').classList.add('hidden');
}

async function saveTicket() {
  const title = document.getElementById('fTitle').value.trim();
  if (!title) { toast('כותרת חובה', 'error'); return; }

  const payload = {
    title,
    description:      document.getElementById('fDescription').value.trim() || null,
    status:           document.getElementById('fStatus').value,
    priority:         document.getElementById('fPriority').value,
    assigned_user_id: document.getElementById('fAssignedUser').value || null,
  };

  const btn = document.getElementById('btnSaveTicket');
  btn.disabled = true;
  btn.textContent = 'שומר...';

  try {
    if (state.editingId) {
      await apiFetch('/tickets/' + state.editingId, { method: 'PUT', body: JSON.stringify(payload) });
      toast('הפנייה עודכנה ✓');
    } else {
      await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(payload) });
      toast('הפנייה נוצרה ✓');
    }
    closeModal();
    await loadTickets(state.meta.current_page);
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'שמור';
  }
}

// ── STATUS Modal ───────────────────────────────────────────────────────────────
function openStatusModal(id) {
  const ticket = state.tickets.find(t => t.id == id);
  if (!ticket) return;
  state.statusTarget = ticket;
  document.getElementById('statusModalSubtitle').textContent = ticket.title;
  document.getElementById('sNewStatus').value                = ticket.status;
  document.getElementById('statusModal').classList.remove('hidden');
}

function closeStatusModal() {
  document.getElementById('statusModal').classList.add('hidden');
  state.statusTarget = null;
}

async function confirmStatusChange() {
  if (!state.statusTarget) return;
  const newStatus = document.getElementById('sNewStatus').value;
  const btn       = document.getElementById('btnConfirmStatus');
  btn.disabled    = true;

  try {
    await apiFetch('/tickets/' + state.statusTarget.id + '/status', {
      method: 'PATCH',
      body:   JSON.stringify({ status: newStatus }),
    });
    toast('סטטוס עודכן ל: ' + STATUS_LABEL[newStatus] + ' ✓');
    closeStatusModal();
    await loadTickets(state.meta.current_page);
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────────
async function deleteTicket(id) {
  const ticket = state.tickets.find(t => t.id == id);
  if (!confirm(`למחוק את הפנייה "${ticket?.title}"?`)) return;
  try {
    await apiFetch('/tickets/' + id, { method: 'DELETE' });
    toast('הפנייה נמחקה');
    await loadTickets(state.meta.current_page);
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ── Filters ────────────────────────────────────────────────────────────────────
function applyFilters() {
  state.filters = {
    status:           document.getElementById('filterStatus').value,
    priority:         document.getElementById('filterPriority').value,
    assigned_user_id: document.getElementById('filterUser').value,
    sort_by:          document.getElementById('sortBy').value,
    sort_dir:         document.getElementById('sortDir').value,
  };
  loadTickets(1);
}

function resetFilters() {
  document.getElementById('filterStatus').value   = '';
  document.getElementById('filterPriority').value = '';
  document.getElementById('filterUser').value     = '';
  document.getElementById('sortBy').value         = 'created_at';
  document.getElementById('sortDir').value        = 'desc';
  state.filters = { status: '', priority: '', assigned_user_id: '', sort_by: 'created_at', sort_dir: 'desc' };
  loadTickets(1);
}

// ── Event wiring ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Buttons
  document.getElementById('btnOpenCreateModal').addEventListener('click',  openCreateModal);
  document.getElementById('btnCloseModal').addEventListener('click',       closeModal);
  document.getElementById('btnCancelModal').addEventListener('click',      closeModal);
  document.getElementById('btnSaveTicket').addEventListener('click',       saveTicket);
  document.getElementById('btnApplyFilters').addEventListener('click',     applyFilters);
  document.getElementById('btnResetFilters').addEventListener('click',     resetFilters);
  document.getElementById('btnCloseStatusModal').addEventListener('click', closeStatusModal);
  document.getElementById('btnCancelStatusModal').addEventListener('click',closeStatusModal);
  document.getElementById('btnConfirmStatus').addEventListener('click',    confirmStatusChange);

  // Close modals on backdrop click
  document.getElementById('ticketModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('statusModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeStatusModal();
  });

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeStatusModal(); }
  });

  // Initial data fetch
  loadUsers().then(() => loadTickets(1));
});
