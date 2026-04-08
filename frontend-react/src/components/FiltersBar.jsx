import { useState } from 'react';

const DEFAULT = {
  status: '', priority: '', assigned_user_id: '', sort_by: 'created_at', sort_dir: 'desc',
};

export default function FiltersBar({ users, filters, onApply, onReset }) {
  const [local, setLocal] = useState(filters);

  function handleChange(e) {
    setLocal(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleReset() {
    setLocal(DEFAULT);
    onReset();
  }

  return (
    <section className="filters-bar">
      <div className="filters-inner">
        <div className="filter-group">
          <label>סטטוס</label>
          <select name="status" value={local.status} onChange={handleChange}>
            <option value="">הכל</option>
            <option value="open">פתוח</option>
            <option value="in_progress">בטיפול</option>
            <option value="closed">סגור</option>
          </select>
        </div>
        <div className="filter-group">
          <label>עדיפות</label>
          <select name="priority" value={local.priority} onChange={handleChange}>
            <option value="">הכל</option>
            <option value="high">גבוהה</option>
            <option value="medium">בינונית</option>
            <option value="low">נמוכה</option>
          </select>
        </div>
        <div className="filter-group">
          <label>משתמש</label>
          <select name="assigned_user_id" value={local.assigned_user_id} onChange={handleChange}>
            <option value="">הכל</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>מיון לפי</label>
          <select name="sort_by" value={local.sort_by} onChange={handleChange}>
            <option value="created_at">תאריך יצירה</option>
            <option value="priority">עדיפות</option>
            <option value="updated_at">עדכון אחרון</option>
          </select>
        </div>
        <div className="filter-group">
          <label>כיוון</label>
          <select name="sort_dir" value={local.sort_dir} onChange={handleChange}>
            <option value="desc">יורד</option>
            <option value="asc">עולה</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => onApply(local)}>🔍 סנן</button>
        <button className="btn btn-ghost" onClick={handleReset}>↺ אפס</button>
      </div>
    </section>
  );
}
