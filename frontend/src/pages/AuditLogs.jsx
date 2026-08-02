// pages/AuditLogs.jsx — Immutable audit trail viewer

import { useEffect, useState } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { ScrollText, LogIn, LogOut, Upload, Eye, Trash2, CheckSquare, Search as SearchIcon } from 'lucide-react';

const ACTION_ICONS = {
  login:    { icon: LogIn,        color: 'text-success' },
  logout:   { icon: LogOut,       color: 'text-slate/60' },
  upload:   { icon: Upload,       color: 'text-secondary' },
  view:     { icon: Eye,          color: 'text-blue-500' },
  delete:   { icon: Trash2,       color: 'text-danger' },
  approve:  { icon: CheckSquare,  color: 'text-success' },
  search:   { icon: SearchIcon,   color: 'text-warning' },
  update:   { icon: ScrollText,   color: 'text-primary' },
};

export default function AuditLogs() {
  const [logs,    setLogs]    = useState([]);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);
  const [filter,  setFilter]  = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/audit', { params: { action: filter || undefined, page: p, limit: 20 } });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPages(data.totalPages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/audit', { params: { action: filter || undefined, page: 1, limit: 20 } });
        if (active) {
          setLogs(data.logs || []);
          setTotal(data.total || 0);
          setPages(data.totalPages || 1);
          setPage(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [filter]);

  const ACTIONS = ['login','logout','upload','view','update','delete','approve','search'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-sub">Immutable record of all system activities ({total} total events)</p>
      </div>

      {/* Action filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!filter ? 'gradient-primary text-white' : 'bg-white border border-slate-200 text-slate'}`}>
          All
        </button>
        {ACTIONS.map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              filter === a ? 'gradient-primary text-white' : 'bg-white border border-slate-200 text-slate hover:bg-bgpage'
            }`}>
            {a}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bgpage">
              <tr>
                <th className="table-header">Action</th>
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Document</th>
                <th className="table-header">IP Address</th>
                <th className="table-header">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : logs.map(log => {
                const info = ACTION_ICONS[log.action] || { icon: ScrollText, color: 'text-slate' };
                const Icon = info.icon;
                return (
                  <tr key={log.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={info.color} />
                        <span className="font-semibold text-xs capitalize">{log.action}</span>
                      </div>
                    </td>
                    <td className="table-cell text-sm">{log.user_name || '—'}</td>
                    <td className="table-cell text-xs capitalize">{log.role?.replace('_',' ') || '—'}</td>
                    <td className="table-cell text-xs text-slate/60 truncate max-w-32">
                      {log.document_title || '—'}
                    </td>
                    <td className="table-cell text-xs font-mono text-slate/50">{log.ip_address || '—'}</td>
                    <td className="table-cell text-xs text-slate/50">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center text-slate/40 py-10">No audit logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={pages} onPageChange={loadLogs} />
    </div>
  );
}
