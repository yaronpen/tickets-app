const PRIORITY_LABEL = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
const STATUS_LABEL   = { open: 'פתוח', in_progress: 'בטיפול', closed: 'סגור' };
const PRIORITY_ICON  = { high: '🔴', medium: '🟡', low: '🟢' };

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketCard({ ticket: t, onEdit, onStatusChange, onDelete }) {
  const desc = t.description
    ? (t.description.length > 120 ? t.description.substring(0, 120) + '…' : t.description)
    : null;

  return (
    <article className={`ticket-card priority-${t.priority} status-${t.status}`}>
      <div className="card-header">
        <span className={`badge-priority ${t.priority}`}>
          {PRIORITY_ICON[t.priority]} {PRIORITY_LABEL[t.priority]}
        </span>
        <span className={`badge-status ${t.status}`}>{STATUS_LABEL[t.status]}</span>
      </div>

      <h3 className="card-title">{t.title}</h3>

      {desc
        ? <p className="card-desc">{desc}</p>
        : <p className="card-desc no-desc">אין תיאור</p>
      }

      <div className="card-meta">
        <span className="meta-user">
          {t.assigned_user_name
            ? `👤 ${t.assigned_user_name}`
            : <span className="unassigned">⚠️ לא משויך</span>
          }
        </span>
        <span className="meta-date">📅 {formatDate(t.created_at)}</span>
      </div>
      {t?.is_stale_high_priority === 1 || t?.is_stale_high_priority === true || t?.is_stale_high_priority === "1" ? (
        <div className="stale-warning">⏰ פנייה זו חרגה מ-48 שעות ותאופס ל&quot;פתוח&quot;</div>
      ) : null}

      <div className="card-actions">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(t.id)}>✏️ עריכה</button>
        <button className="btn btn-sm btn-outline"   onClick={() => onStatusChange(t.id)}>🔄 סטטוס</button>
        <button className="btn btn-sm btn-danger"    onClick={() => onDelete(t.id)}>🗑️</button>
      </div>
    </article>
  );
}
