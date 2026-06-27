// pages/ApprovalWorkflow.jsx — Document review and status management

import { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Check, X, MessageSquare, FileText } from 'lucide-react';
import { ApprovalStamp, SystemStatusBar } from '../components/SystemAnimations';

export default function ApprovalWorkflow() {
  const [docs,    setDocs]    = useState([]);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [filter,  setFilter]  = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [stampStatus, setStampStatus] = useState(null); // 'approved' | 'rejected' | null
  const [checkedItems, setCheckedItems] = useState({
    title: false,
    metadata: false,
    compliance: false,
    integrity: false
  });

  const loadDocs = async (p = 1) => {
    await Promise.resolve();
    setLoading(true);
    try {
      const { data } = await api.get('/documents', { params: { status: filter, page: p, limit: 12 } });
      setDocs(data.documents || []);
      setPages(data.totalPages || 1);
      setPage(p);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadDocs(1); }, [filter]);

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
    } catch {
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
          <div className="space-y-5">
            {/* Status & Title */}
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#fed65b]/20 text-[#735c00] font-semibold text-xs rounded-full flex items-center gap-1.5 border border-[#fed65b]">
                  <span className="w-2 h-2 rounded-full bg-[#ed6c02]"></span>
                  {selected.status?.replace(/_/g, ' ')?.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-[#735c00] uppercase tracking-widest opacity-80">ID: REC-{selected.id}-X</span>
              </div>
              <h2 className="text-lg font-bold text-[#570000] tracking-tight">{selected.title}</h2>
            </div>

            {/* Document Preview Card */}
            <section className="bg-white border border-[#e2bfb9] rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-[4/3] relative bg-[#d9dadb] flex items-center justify-center group overflow-hidden">
                {['png', 'jpg', 'jpeg'].includes(selected.file_type?.toLowerCase()) ? (
                  <img
                    className="w-full h-full object-cover transition-transform duration-700"
                    src={selected.file_path?.startsWith('http') ? selected.file_path : `${import.meta.env.VITE_API_URL?.replace('/api','')}/${selected.file_path}`}
                    alt="Document Preview"
                  />
                ) : (
                  <iframe
                    className="w-full h-full border-none"
                    src={selected.file_path?.startsWith('http') ? selected.file_path : `${import.meta.env.VITE_API_URL?.replace('/api','')}/${selected.file_path}#toolbar=0`}
                    title="PDF Preview"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#570000]/30 to-transparent pointer-events-none"></div>
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-2 rounded-lg shadow-md border border-[#e2bfb9]">
                  <span className="material-symbols-outlined text-[#570000]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="bg-[#800000] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>Preview Mode</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Primary Action Cluster */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={!(checkedItems.title && checkedItems.metadata && checkedItems.compliance && checkedItems.integrity)}
                onClick={() => updateStatus(selected.id, 'approved')}
                className="col-span-2 py-4 bg-[#570000] text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">verified</span>
                Confirm & Approve Document
              </button>
              <button
                type="button"
                onClick={() => updateStatus(selected.id, 'rejected')}
                className="py-3 border border-[#8e706c] text-[#241a00] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#f8f9fa] transition-all"
              >
                <span className="material-symbols-outlined text-[#d32f2f]">flag</span>
                Flag Issue
              </button>
              <a
                href={selected.file_path?.startsWith('http') ? selected.file_path : `${import.meta.env.VITE_API_URL?.replace('/api','')}/${selected.file_path}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 border border-[#8e706c] text-[#241a00] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#f8f9fa] transition-all text-center flex-row flex justify-center items-center"
              >
                <span className="material-symbols-outlined text-[#570000]">download</span>
                Download
              </a>
            </div>

            {/* OCR Text check if available */}
            {selected.extracted_text && (
              <div className="space-y-1.5">
                <label className="label mb-0 text-[#735c00] font-bold text-xs uppercase">OCR Extracted Text Data</label>
                <textarea
                  readOnly
                  className="input-field text-xs h-24 font-mono bg-[#fffcf6] border border-[#e2bfb9] rounded-lg p-2.5 resize-none"
                  value={selected.extracted_text}
                />
              </div>
            )}

            {/* Metadata Bento Grid */}
            <section className="space-y-3">
              <h3 className="font-semibold text-[#570000] flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-sm">info</span>
                Metadata Details
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-white border border-[#e2bfb9] rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold text-[#735c00] uppercase mb-0.5">Faculty / Department</p>
                    <p className="text-sm font-bold text-[#570000]">{selected.department_name || selected.department_code || 'General Office'}</p>
                  </div>
                  <div className="p-2 bg-[#f8f9fa] rounded-lg border border-[#e2bfb9]/30">
                    <span className="material-symbols-outlined text-[#735c00]">account_balance</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white border border-[#e2bfb9] rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-[#735c00] uppercase mb-0.5">Uploader</p>
                    <p className="text-xs font-bold text-[#570000] truncate">{selected.uploader_name || 'System Upload'}</p>
                  </div>
                  <div className="p-4 bg-white border border-[#e2bfb9] rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-[#735c00] uppercase mb-0.5">Academic Year</p>
                    <p className="text-xs font-bold text-[#570000]">{selected.academic_year || '2023-2024'}</p>
                  </div>
                </div>
                {selected.confidence_score !== undefined && (
                  <div className="p-4 bg-white border border-[#e2bfb9] rounded-xl flex items-center justify-between shadow-sm">
                    <div className="w-full">
                      <p className="text-[10px] font-bold text-[#735c00] uppercase mb-1">OCR Confidence Score</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#2e7d32]">{selected.confidence_score}%</span>
                        <div className="flex-1 h-2 bg-[#f3f4f5] rounded-full overflow-hidden border border-[#e2bfb9]/30">
                          <div
                            className="h-full bg-[#2e7d32]"
                            style={{ width: `${selected.confidence_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Audit Trail Timeline */}
            <section className="space-y-3">
              <h3 className="font-semibold text-[#570000] flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-sm">history</span>
                Audit Trail
              </h3>
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e2bfb9]">
                {/* Timeline Item 1 */}
                <div className="relative">
                  <div className="absolute -left-6 w-6 h-6 rounded-full bg-[#f8f9fa] border-4 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#570000]"></span>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="text-[#570000] font-bold">Document Uploaded</p>
                    <p className="text-[#735c00] font-medium">Uploader: {selected.uploader_name || 'Dean of Admissions'}</p>
                    <p className="text-[#8e706c] font-mono">{new Date(selected.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                {/* Timeline Item 2 */}
                <div className="relative">
                  <div className="absolute -left-6 w-6 h-6 rounded-full bg-[#f8f9fa] border-4 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#735c00]"></span>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="text-[#570000] font-bold">OCR Data Extracted</p>
                    <p className="text-[#735c00] font-medium">Tesseract.js OCR Automated Engine</p>
                    <p className="text-[#8e706c] font-mono">Confidence rating: {selected.confidence_score || '98'}%</p>
                  </div>
                </div>
                {/* Timeline Item 3 */}
                <div className="relative">
                  <div className="absolute -left-6 w-6 h-6 rounded-full bg-[#f8f9fa] border-4 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ed6c02]"></span>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="text-[#570000] font-bold">Manual Review Required</p>
                    <p className="text-[#735c00] font-medium">Status: {selected.status?.replace(/_/g, ' ')}</p>
                    <p className="text-[#8e706c] font-mono">Reviewer evaluation pending checklist validation</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Checklist */}
            <div className="space-y-3 pt-2 border-t border-[#e2bfb9]">
              <p className="font-semibold text-xs text-[#570000] uppercase tracking-wider">Required Verification Checklist</p>
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#241a00] select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.title}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, title: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-[#e2bfb9] bg-[#fffcf6] text-[#570000] focus:ring-[#570000]"
                  />
                  <span>
                    <strong>File Name & Title Alignment:</strong> I have verified that the document title matches the physical and digital institutional record.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#241a00] select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.metadata}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, metadata: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-[#e2bfb9] bg-[#fffcf6] text-[#570000] focus:ring-[#570000]"
                  />
                  <span>
                    <strong>Metadata & Year Verification:</strong> I have verified that the academic year (e.g. {selected.academic_year}) and classification category are correct.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#241a00] select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.compliance}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, compliance: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-[#e2bfb9] bg-[#fffcf6] text-[#570000] focus:ring-[#570000]"
                  />
                  <span>
                    <strong>Accreditation Compliance:</strong> I have verified that this document meets NAAC, NBA, and UGC compliance requirements.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#241a00] select-none">
                  <input
                    type="checkbox"
                    checked={checkedItems.integrity}
                    onChange={(e) => setCheckedItems(prev => ({ ...prev, integrity: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-[#e2bfb9] bg-[#fffcf6] text-[#570000] focus:ring-[#570000]"
                  />
                  <span>
                    <strong>Legibility & Authenticity:</strong> I have verified that the document is clearly legible, untampered, and contains authentic administrative records.
                  </span>
                </label>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="pt-2 border-t border-[#e2bfb9] flex justify-end">
              <button
                type="button"
                onClick={() => { setSelected(null); }}
                className="btn-secondary px-5 py-2"
              >
                Close Panel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
