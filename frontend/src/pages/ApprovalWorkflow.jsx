import { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { Check, X, MessageSquare, FileText, Eye } from 'lucide-react';
import { ApprovalStamp, SystemStatusBar } from '../components/SystemAnimations';

export default function ApprovalWorkflow() {
  const [docs,    setDocs]    = useState([]);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [filter,  setFilter]  = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [stampStatus, setStampStatus] = useState(null); // 'approved' | 'rejected' | null

  const loadDocs = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents', { params: { status: filter, page: p, limit: 12 } });
      setDocs(data.documents || []);
      setPages(data.totalPages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/documents', { params: { status: filter, page: 1, limit: 12 } });
        if (active) {
          setDocs(data.documents || []);
          setPages(data.totalPages || 1);
          setPage(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [filter]);

  const handleReviewClick = async (doc) => {
    try {
      // Fetch full document with OCR extracted text details
      const { data } = await api.get(`/documents/${doc.id}`);
      setSelected(data.document);
    } catch {
      setSelected(doc);
    }
  };

  const updateStatus = async (id, status, is_authorized) => {
    await api.put(`/documents/${id}`, { status, is_authorized });
    setSelected(null);
    // Show stamp animation for approve/reject
    if (status === 'approved' || status === 'rejected') {
      setStampStatus(status);
    }
    loadDocs(page);
  };

  const STATUSES = ['pending','under_review','approved','rejected','archived'];

  return (
    <div className="space-y-5">
      {/* Approval stamp animation */}
      {stampStatus && (
        <ApprovalStamp
          status={stampStatus}
          onDone={() => setStampStatus(null)}
        />
      )}

      <div>
        <h1 className="page-title">Approval Workflow</h1>
        <p className="page-sub">Review and approve document submissions</p>
      </div>

      {/* System Status Ticker */}
      <SystemStatusBar />

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filter === s ? 'gradient-primary text-white' : 'bg-white border border-slate-200 text-slate hover:bg-bgpage'
            }`}
          >
            {s.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Documents */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bgpage">
              <tr>
                <th className="table-header">Document</th>
                <th className="table-header">Department</th>
                <th className="table-header">Category</th>
                <th className="table-header">Uploaded By</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-slate/40 py-12">
                  No {filter.replace('_',' ')} documents.
                </td></tr>
              ) : docs.map(doc => (
                <tr key={doc.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-secondary flex-shrink-0" />
                      <span className="font-medium text-sm truncate max-w-40">{doc.title}</span>
                    </div>
                  </td>
                  <td className="table-cell text-xs font-mono">{doc.department_code || '—'}</td>
                  <td className="table-cell text-xs capitalize">{doc.category?.replace(/_/g,' ')}</td>
                  <td className="table-cell text-xs">{doc.uploader_name || '—'}</td>
                  <td className="table-cell text-xs text-slate/50">
                    {new Date(doc.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="table-cell"><Badge label={doc.status} /></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReviewClick(doc)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#072558] text-white hover:bg-[#0b3d91] transition-all flex items-center gap-1 shadow-sm"
                        title="View File & Verify"
                      >
                        <Eye size={13} />
                        <span>Review & Verify</span>
                      </button>

                      {doc.status !== 'approved' && (
                        <button onClick={() => updateStatus(doc.id, 'approved', doc.is_authorized ?? true)}
                          className="btn-icon text-success" title="Approve">
                          <Check size={15} />
                        </button>
                      )}
                      {doc.status !== 'rejected' && (
                        <button onClick={() => updateStatus(doc.id, 'rejected', doc.is_authorized ?? true)}
                          className="btn-icon text-danger" title="Reject">
                          <X size={15} />
                        </button>
                      )}
                      {doc.status === 'pending' && (
                        <button onClick={() => updateStatus(doc.id, 'under_review', doc.is_authorized ?? true)}
                          className="btn-icon text-secondary" title="Mark Under Review">
                          <MessageSquare size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={pages} onPageChange={loadDocs} />

      {/* Document Review & Verification Modal */}
      {selected && (
        <DocumentViewerModal
          doc={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}
