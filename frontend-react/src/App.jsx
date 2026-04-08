import { useState, useEffect, useRef } from 'react';
import { apiFetch } from './api';
import Header from './components/Header';
import FiltersBar from './components/FiltersBar';
import StatsStrip from './components/StatsStrip';
import TicketGrid from './components/TicketGrid';
import Pagination from './components/Pagination';
import TicketModal from './components/TicketModal';
import StatusModal from './components/StatusModal';
import Toast from './components/Toast';

const DEFAULT_FILTERS = {
  status: '', priority: '', assigned_user_id: '', sort_by: 'created_at', sort_dir: 'desc',
};

export default function App() {
  const [tickets, setTickets]         = useState([]);
  const [users, setUsers]             = useState([]);
  const [meta, setMeta]               = useState({ total: 0, current_page: 1, last_page: 1 });
  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [loading, setLoading]         = useState(false);
  const [stats, setStats]             = useState({ total: 0, open: 0, in_progress: 0, closed: 0, high: 0  });
  const [ticketModal, setTicketModal] = useState({ open: false, ticket: null });
  const [statusModal, setStatusModal] = useState({ open: false, ticket: null });
  const [toast, setToast]             = useState({ visible: false, message: '', type: 'success' });
  const toastTimer                    = useRef(null);

  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      3500,
    );
  }

  async function loadUsers() {
    try {
      setUsers(await apiFetch('/users'));
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  }

  async function loadTickets(page = 1, activeFilters = filters) {
    setLoading(true);
    const params = new URLSearchParams({ page, ...activeFilters });
    [...params.entries()].forEach(([k, v]) => { if (!v) params.delete(k); });
    try {
      const res = await apiFetch('/tickets?' + params.toString());
      setTickets(res.data);
      setMeta(res.meta);
      if (res.meta.stats) setStats(res.meta.stats);
    } catch (e) {
      showToast('שגיאה בטעינת פניות: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    loadTickets(1);
  }, []);

  function applyFilters(newFilters) {
    setFilters(newFilters);
    loadTickets(1, newFilters);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    loadTickets(1, DEFAULT_FILTERS);
  }

  function openCreateModal() {
    setTicketModal({ open: true, ticket: null });
  }

  async function openEditModal(id) {
    try {
      const ticket = await apiFetch('/tickets/' + id);
      setTicketModal({ open: true, ticket });
    } catch (e) {
      showToast('שגיאה בטעינת הפנייה: ' + e.message, 'error');
    }
  }

  async function saveTicket(payload, editingId) {
    if (editingId) {
      await apiFetch('/tickets/' + editingId, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('הפנייה עודכנה ✓');
    } else {
      await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(payload) });
      showToast('הפנייה נוצרה ✓');
    }
    setTicketModal({ open: false, ticket: null });
    await loadTickets(meta.current_page);
  }

  function openStatusModal(id) {
    const ticket = tickets.find(t => t.id === id);
    if (ticket) setStatusModal({ open: true, ticket });
  }

  async function confirmStatusChange(ticketId, newStatus) {
    const STATUS_LABEL = { open: 'פתוח', in_progress: 'בטיפול', closed: 'סגור' };
    await apiFetch('/tickets/' + ticketId + '/status', {
      method: 'PATCH',
      body:   JSON.stringify({ status: newStatus }),
    });
    showToast('סטטוס עודכן ל: ' + STATUS_LABEL[newStatus] + ' ✓');
    setStatusModal({ open: false, ticket: null });
    await loadTickets(meta.current_page);
  }

  async function deleteTicket(id) {
    const ticket = tickets.find(t => t.id === id);
    if (!confirm(`למחוק את הפנייה "${ticket?.title}"?`)) return;
    try {
      await apiFetch('/tickets/' + id, { method: 'DELETE' });
      showToast('הפנייה נמחקה');
      await loadTickets(meta.current_page);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  return (
    <>
      <Header onNewTicket={openCreateModal} />
      <FiltersBar
        users={users}
        filters={filters}
        onApply={applyFilters}
        onReset={resetFilters}
      />
      <StatsStrip stats={stats} />
      <main className="main-content">
        <TicketGrid
          tickets={tickets}
          loading={loading}
          onEdit={openEditModal}
          onStatusChange={openStatusModal}
          onDelete={deleteTicket}
        />
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          onPageChange={page => loadTickets(page)}
        />
      </main>
      {ticketModal.open && (
        <TicketModal
          ticket={ticketModal.ticket}
          users={users}
          onSave={saveTicket}
          onClose={() => setTicketModal({ open: false, ticket: null })}
        />
      )}
      {statusModal.open && (
        <StatusModal
          ticket={statusModal.ticket}
          onConfirm={confirmStatusChange}
          onClose={() => setStatusModal({ open: false, ticket: null })}
        />
      )}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </>
  );
}
