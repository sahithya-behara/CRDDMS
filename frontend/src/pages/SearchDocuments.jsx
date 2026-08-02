// pages/SearchDocuments.jsx — Full-text + filter search

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import { Search, FileText, Eye, ScanText, X } from 'lucide-react';

const CATEGORIES = ['student_records','faculty_records','examination_records','administrative_records','accreditation_documents'];
const STATUSES   = ['pending','under_review','approved','rejected','archived'];

export default function SearchDocuments() {
  const [query,  setQuery]  = useState('');
  const [filters, setFilters] = useState({ department_id:'', category:'', status:'', academic_year:'' });
  const [results, setResults] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { api.get('/departments').then(r => setDepts(r.data.departments)); }, []);

  const doSearch = async (p = 1) => {
    setLoading(true);
    try {
      const params = { q: query, page: p, limit: 12, ...filters };
      const { data } = await api.get('/search', { params });
      setResults(data.results || []);
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
        const params = { q: query, page: 1, limit: 12, ...filters };
        const { data } = await api.get('/search', { params });
        if (active) {
          setResults(data.results || []);
          setTotal(data.total || 0);
          setPages(data.totalPages || 1);
          setPage(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [query, filters]);

  const clearFilters = () => {
    setFilters({ department_id:'', category:'', status:'', academic_year:'' });
    setQuery('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Search Documents</h1>
        <p className="page-sub">Search across all documents, metadata, and OCR extracted text</p>
      </div>

      {/* Search & Filters */}
      <div className="card space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate/40" />
          <input
            type="text" className="input-field pl-10 pr-4 py-3 text-base"
            placeholder="Search by title, keywords, OCR text…"
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(1)}
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Department</label>
            <select className="input-field" value={filters.department_id}
              onChange={e => setFilters(f => ({...f, department_id: e.target.value}))}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.department_code}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={filters.category}
              onChange={e => setFilters(f => ({...f, category: e.target.value}))}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={filters.status}
              onChange={e => setFilters(f => ({...f, status: e.target.value}))}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input type="text" className="input-field" placeholder="e.g. 2024-25"
              value={filters.academic_year}
              onChange={e => setFilters(f => ({...f, academic_year: e.target.value}))} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => doSearch(1)} className="btn-primary flex items-center gap-2">
            <Search size={16} /> Search
          </button>
          <button onClick={clearFilters} className="btn-secondary flex items-center gap-2">
            <X size={16} /> Clear
          </button>
        </div>
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-slate/60 mb-3">
          {loading ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} found`}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bgpage">
                  <tr>
                    <th className="table-header">Title</th>
                    <th className="table-header">Dept</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Year</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">OCR</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(doc => (
                    <tr key={doc.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-secondary flex-shrink-0" />
                          <span className="font-medium text-sm truncate max-w-48">{doc.title}</span>
                        </div>
                      </td>
                      <td className="table-cell text-xs font-mono">{doc.department_code}</td>
                      <td className="table-cell text-xs capitalize">{doc.category?.replace(/_/g,' ')}</td>
                      <td className="table-cell text-xs">{doc.academic_year || '—'}</td>
                      <td className="table-cell"><Badge label={doc.status} /></td>
                      <td className="table-cell">
                        {doc.confidence_score ? (
                          <span className="text-xs text-success font-semibold">{doc.confidence_score}%</span>
                        ) : <span className="text-xs text-slate/40">—</span>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button className="btn-icon" title="View" onClick={() => navigate(`/ocr/${doc.id}`)}>
                            <Eye size={15} />
                          </button>
                          <button className="btn-icon" title="OCR" onClick={() => navigate(`/ocr/${doc.id}`)}>
                            <ScanText size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr><td colSpan={7} className="table-cell text-center text-slate/40 py-12">
                      No documents found. Try different search terms or filters.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination page={page} totalPages={pages} onPageChange={doSearch} />
      </div>
    </div>
  );
}
