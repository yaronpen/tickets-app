import { useState, useEffect } from 'react';

export default function TicketModal({ ticket, users, onSave, onClose }) {
  const isEdit = Boolean(ticket);
  const [form, setForm] = useState({
    title:            ticket?.title            || '',
    description:      ticket?.description      || '',
    status:           ticket?.status           || 'open',
    priority:         ticket?.priority         || 'medium',
    assigned_user_id: ticket?.assigned_user_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('כותרת חובה'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(
        {
          title:            form.title.trim(),
          description:      form.description.trim() || null,
          status:           form.status,
          priority:         form.priority,
          assigned_user_id: form.assigned_user_id || null,
        },
        ticket?.id ?? null,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="סגור">✕</button>
        <h2 className="modal-title">
          {isEdit ? `עריכת פנייה #${ticket.id}` : 'יצירת פנייה חדשה'}
        </h2>

        {error && <p style={{ color: 'var(--danger)', fontSize: '.9rem' }}>{error}</p>}

        <div className="form-group">
          <label>כותרת <span className="required">*</span></label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="תיאור קצר של הבעיה"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>תיאור</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="פרטים נוספים..."
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>סטטוס</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="open">פתוח</option>
              <option value="in_progress">בטיפול</option>
              <option value="closed">סגור</option>
            </select>
          </div>
          <div className="form-group">
            <label>עדיפות</label>
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">גבוהה</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>משויך למשתמש</label>
          <select name="assigned_user_id" value={form.assigned_user_id} onChange={handleChange}>
            <option value="">ללא שיוך</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
