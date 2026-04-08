import { useState, useEffect } from 'react';

export default function StatusModal({ ticket, onConfirm, onClose }) {
  const [status, setStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleConfirm() {
    setSaving(true);
    setError('');
    try {
      await onConfirm(ticket.id, status);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <button className="modal-close" onClick={onClose} aria-label="סגור">✕</button>
        <h2 className="modal-title">שינוי סטטוס</h2>
        <p className="modal-subtitle">{ticket.title}</p>

        {error && <p style={{ color: 'var(--danger)', fontSize: '.9rem' }}>{error}</p>}

        <div className="form-group">
          <label>סטטוס חדש</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="open">פתוח</option>
            <option value="in_progress">בטיפול</option>
            <option value="closed">סגור</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ביטול</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? 'שומר...' : 'אשר'}
          </button>
        </div>
      </div>
    </div>
  );
}
