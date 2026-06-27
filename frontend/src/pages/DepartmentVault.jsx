// pages/DepartmentVault.jsx — Department-wise document browser

import { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import { FolderOpen, FileText, ChevronRight, Download } from 'lucide-react';

function fmtBytes(b) {
  if (!b) return '0 B';
  const mb = b / (1024 * 1024);
  return mb > 1000 ? `${(mb/1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

export default function DepartmentVault() {
  const [departments, setDepts]    = useState([]);
  const [selected,    setSelected] = useState(null);
  const [documents,   setDocs]     = useState([]);
  const [page,        setPage]     = useState(1);
  const [totalPages,  setTotalPages] = useState(1);
  const [loading,     setLoading]  = useState(false);

  useEffect(() => {
    api.get('/departments').then(r => setDepts(r.data.departments));
  }, []);

  const loadDocs = async (deptId, p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents', { params: { department_id: deptId, page: p, limit: 10 } });
      setDocs(data.documents || []);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  const selectDept = (dept) => {
    setSelected(dept);
    loadDocs(dept.id, 1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Department Vault</h1>
        <p className="page-sub">Browse documents organized by department</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Department list */}
        <div className="card p-3">
          <p className="section-title px-2">Departments</p>
          <div className="space-y-1">
            {departments.map(d => (
              <button
                key={d.id}
                onClick={() => selectDept(d)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  selected?.id === d.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-bgpage text-slate'
                }`}
              >
                <FolderOpen size={16} className="flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-xs">{d.department_code}</p>
                  <p className={`text-xs truncate ${selected?.id === d.id ? 'text-white/70' : 'text-slate/50'}`}>
                    {d.document_count} docs · {fmtBytes(d.total_size_bytes)}
                  </p>
                </div>
                <ChevronRight size={14} className="flex-shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Documents pane */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-title mb-0">{selected.department_name}</p>
                  <p className="text-xs text-slate/50">{selected.document_count} documents</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-bgpage transition-colors border border-slate-50">
                        <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate truncate">{doc.title}</p>
                          <p className="text-xs text-slate/50">
                            {doc.file_type?.toUpperCase()} · {fmtBytes(doc.file_size)} · {doc.academic_year}
                          </p>
                        </div>
                        <Badge label={doc.status} />
                        <a
                          href={doc.file_path?.startsWith('http') ? doc.file_path : `${import.meta.env.VITE_API_URL?.replace('/api','')}/${doc.file_path}`}
                          target="_blank" rel="noreferrer"
                          className="btn-icon" title="Download"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    ))}
                    {documents.length === 0 && (
                      <p className="text-center text-slate/40 py-12 text-sm">No documents in this department.</p>
                    )}
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPageChange={p => loadDocs(selected.id, p)} />
                </>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen size={48} className="text-slate/20 mb-3" />
              <p className="text-slate/50 text-sm">Select a department to browse documents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
