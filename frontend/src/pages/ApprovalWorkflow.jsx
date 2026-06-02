// pages/ApprovalWorkflow.jsx — Document review and status management

import { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { CheckSquare, Check, X, MessageSquare, FileText, Download } from 'lucide-react';

function fmtBytes(b) {
  if (!b) return '0 B';
  const mb = b / (1024 * 1024);
  return mb > 1000 ? `${(mb/1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

export default function ApprovalWorkflow() {
  const [docs,    setDocs]    = useState([]);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [filter,  setFilter]  = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comment,  setComment]  = useState('');
  const [checkedItems, setCheckedItems] = useState({
    title: false,
    metadata: false,
    compliance: false,
    integrity: false
  });

  useEffect(() => { loadDocs(1); }, [filter]);

  const loadDocs = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents', { params: { status: filter, page: p, limit: 12 } });
      setDocs(data.documents || []);
      setPages(data.totalPages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  const handleApproveClick = async (doc) => {
    try {
      // Fetch full document with OCR extracted text details
      const { data } = await api.get(`/documents/${doc.id}`);
      setSelected(data.document);
      setCheckedItems({
        title: false,
        metadata: false,
        compliance: false,
        integrity: false
      });
    } catch (err) {
      setSelected(doc);
      setCheckedItems({
        title: false,
        metadata: false,
        compliance: false,
        integrity: false
      });
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/documents/${id}`, { status });
    setSelected(null);
    loadDocs(page);
  };

  const STATUSES = ['pending','under_review','approved','rejected','archived'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Approval Workflow</h1>
        <p className="page-sub">Review and approve document submissions</p>
      </div>

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
                    <div className="flex items-center gap-1">
                      {doc.status !== 'approved' && (
                        <button onClick={() => handleApproveClick(doc)}
                          className="btn-icon text-success" title="Approve">
                          <Check size={15} />
                        </button>
                      )}
                      {doc.status !== 'rejected' && (
                        <button onClick={() => updateStatus(doc.id, 'rejected')}
                          className="btn-icon text-danger" title="Reject">
                          <X size={15} />
                        </button>
                      )}
                      {doc.status === 'pending' && (
                        <button onClick={() => updateStatus(doc.id, 'under_review')}
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

      {/* Cross-Verification & Approval Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Document Cross-Verification & Approval"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="bg-bgpage p-4 rounded-xl space-y-2 border border-slate-100">
              <h4 className="font-semibold text-xs text-slate uppercase tracking-wider">Document Specifications</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><span className="text-slate/50">Title:</span> <strong className="text-slate">{selected.title}</strong></div>
                <div><span className="text-slate/50">File Name:</span> <strong className="text-slate truncate block max-w-xs">{selected.file_name}</strong></div>
                <div><span className="text-slate/50">Department:</span> <strong className="text-slate">{selected.department_name || selected.department_code || 'General'}</strong></div>
                <div><span className="text-slate/50">Category:</span> <strong className="text-slate capitalize">{selected.category?.replace(/_/g, ' ')}</strong></div>
                <div><span className="text-slate/50">Academic Year:</span> <strong className="text-slate">{selected.academic_year || '—'}</strong></div>
                <div><span className="text-slate/50">Uploader:</span> <strong className="text-slate">{selected.uploader_name || '—'}</strong></div>
                <div><span className="text-slate/50">File Format:</span> <strong className="text-slate uppercase">{selected.file_type}</strong></div>
                <div><span className="text-slate/50">File Size:</span> <strong className="text-slate">{fmtBytes(selected.file_size)}</strong></div>
              </div>
              {selected.tags && selected.tags.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/50 flex flex-wrap gap-1 items-center">
                  <span className="text-xs text-slate/50 mr-1">Tags:</span>
                  {selected.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-accent/25 text-primary text-[10px] font-semibold rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* OCR Preview if available */}
            {selected.extracted_text ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">OCR Extracted Text Cross-Check</label>
                  <span className="text-[10px] bg-success/20 text-success font-semibold px-2 py-0.5 rounded-full">
                    Confidence: {selected.confidence_score}%
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    readOnly
                    className="input-field text-xs h-24 font-mono bg-slate-50/50 resize-none"
                    value={selected.extracted_text}
                  />
                  <div className="absolute bottom-2 right-2 text-[10px] text-slate/40">
                    Auto-extracted via Tesseract.js
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center">
                <p className="text-xs text-slate/50">No OCR extraction text found or document type doesn't support OCR.</p>
              </div>
            )}

            {/* Download Button for Manual inspection */}
            <div className="flex justify-center">
              <a
                href={`${import.meta.env.VITE_API_URL?.replace('/api','')}/${selected.file_path}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary py-2 w-full flex items-center justify-center gap-2 hover:bg-slate-50"
              >
                <Download size={14} /> Inspect Original Uploaded Document
              </a>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="font-semibold text-xs text-slate uppercase tracking-wider">Required Verification Checklist</p>
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate/85 select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.title}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, title: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>
                    <strong>File Name & Title Alignment:</strong> I have verified that the document title matches the physical and digital institutional record.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate/85 select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.metadata}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, metadata: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>
                    <strong>Metadata & Year Verification:</strong> I have verified that the academic year (e.g. {selected.academic_year}) and classification category are correct.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate/85 select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.compliance}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, compliance: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>
                    <strong>Accreditation Compliance:</strong> I have verified that this document meets NAAC, NBA, and UGC compliance requirements.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate/85 select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.integrity}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, integrity: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>
                    <strong>Legibility & Authenticity:</strong> I have verified that the document is clearly legible, untampered, and contains authentic administrative records.
                  </span>
                </label>
              </div>
            </div>

            {/* Verification Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setSelected(null); }}
                className="btn-secondary flex-1 py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!(checkedItems.title && checkedItems.metadata && checkedItems.compliance && checkedItems.integrity)}
                onClick={() => updateStatus(selected.id, 'approved')}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Approve Document
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
