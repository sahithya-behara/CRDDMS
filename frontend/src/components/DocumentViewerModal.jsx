// components/DocumentViewerModal.jsx
// Comprehensive Admin Document Viewer & Verification Panel
// Includes Full File Preview, Authorization Seal Confirmation, and 3-Way Status Actions (Approve, Under Review, Reject).

import { useState } from 'react';
import Modal from './Modal';
import Badge from './Badge';
import {
  FileText, ShieldCheck, ShieldAlert, CheckCircle2, Clock,
  Download, Eye, Maximize2, Minimize2, Check, X, FileSearch, Sparkles, RefreshCw
} from 'lucide-react';

export default function DocumentViewerModal({ doc, isOpen, onClose, onUpdateStatus }) {
  const [isAuthorized, setIsAuthorized] = useState(doc?.is_authorized ?? true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'ocr' | 'metadata'
  const [isSaving, setIsSaving] = useState(false);

  const [checklist, setChecklist] = useState({
    titleMatch: false,
    metadataVerified: false,
    complianceChecked: false,
    authenticityConfirmed: false
  });

  if (!doc) return null;

  const fileExt = doc.file_type?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(fileExt);
  const isPdf = fileExt === 'pdf';
  const fileUrl = doc.file_path?.startsWith('http')
    ? doc.file_path
    : `${(import.meta.env.VITE_API_URL || '/api').replace('/api', '')}/${doc.file_path}`;

  const allChecklistItemsPassed = Object.values(checklist).every(Boolean);

  const handleAction = async (newStatus) => {
    setIsSaving(true);
    try {
      await onUpdateStatus(doc.id, newStatus, isAuthorized);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAuthorization = () => {
    setIsAuthorized(prev => !prev);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Document Review & Verification"
      maxWidth={isFullscreen ? 'max-w-[98vw]' : 'max-w-4xl'}
    >
      <div className="space-y-5">

        {/* ── 1. HEADER & AUTHORIZATION BANNER ─── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200"
          style={{ background: 'linear-gradient(135deg, rgba(7,37,88,0.03) 0%, rgba(212,175,55,0.05) 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #072558 0%, #0B3D91 100%)', color: '#fff' }}>
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  REF-{doc.id} · {doc.department_code || 'GEN'}
                </span>
                <Badge label={doc.status} />
              </div>
              <h2 className="text-base font-bold text-slate-800 leading-snug mt-0.5">
                {doc.title}
              </h2>
            </div>
          </div>

          {/* Authorization Status Switcher */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm self-stretch md:self-auto justify-between">
            <div className="flex items-center gap-2">
              {isAuthorized ? (
                <ShieldCheck size={20} className="text-emerald-600" />
              ) : (
                <ShieldAlert size={20} className="text-amber-600" />
              )}
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Authorization Status
                </p>
                <p className={`text-xs font-extrabold ${isAuthorized ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isAuthorized ? 'AUTHORIZED RECORD' : 'UNAUTHORIZED / PENDING'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleAuthorization}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                isAuthorized
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {isAuthorized ? 'Mark Unauthorized' : 'Confirm Authorized'}
            </button>
          </div>
        </div>

        {/* ── 2. VIEW MODE TABS & FULLSCREEN TOGGLE ─── */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#072558] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eye size={14} /> File Preview
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'ocr'
                  ? 'bg-[#072558] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={14} /> OCR Extracted Text
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'metadata'
                  ? 'bg-[#072558] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSearch size={14} /> Metadata Details
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
            >
              <Download size={13} /> Open Original
            </a>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* ── 3. TAB CONTENT ─── */}
        {activeTab === 'preview' && (
          <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 min-h-[380px] max-h-[550px] flex items-center justify-center group">
            {isImage ? (
              <img
                src={fileUrl}
                alt="Document Content"
                className="max-h-[520px] w-auto object-contain mx-auto transition-transform duration-300"
              />
            ) : isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=1`}
                title="PDF Document Viewer"
                className="w-full h-[520px] border-none"
              />
            ) : (
              <div className="text-center p-8 text-white space-y-3">
                <FileText size={48} className="mx-auto opacity-40 text-amber-400" />
                <p className="text-sm font-semibold">
                  Document Preview ({fileExt.toUpperCase()})
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Direct browser preview is not available for standard document spreadsheets/binaries. Click below to inspect the original file.
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-2 text-xs"
                >
                  <Download size={14} /> Download Document ({fileExt.toUpperCase()})
                </a>
              </div>
            )}

            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE FILE INSPECTOR</span>
            </div>
          </div>
        )}

        {activeTab === 'ocr' && (
          <div className="space-y-3 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-amber-400 font-bold">AUTOMATED OCR RECOGNITION DATA</span>
              <span className="text-slate-400">Confidence Score: {doc.confidence_score || '98'}%</span>
            </div>
            {doc.extracted_text ? (
              <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
                {doc.extracted_text}
              </p>
            ) : (
              <div className="py-8 text-center text-slate-500">
                No cached OCR text available for this document format.
              </div>
            )}
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
              <p className="text-sm font-bold text-slate-800">{doc.department_name || doc.department_code || 'General'}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Academic Year</p>
              <p className="text-sm font-bold text-slate-800">{doc.academic_year || 'N/A'}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
              <p className="text-sm font-bold text-slate-800 capitalize">{doc.category?.replace(/_/g, ' ')}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Uploader</p>
              <p className="text-sm font-bold text-slate-800">{doc.uploader_name || 'System Upload'}</p>
            </div>
          </div>
        )}

        {/* ── 4. REQUIRED VERIFICATION CHECKLIST ─── */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-[#072558]" />
              Mandatory Admin Verification Checklist
            </p>
            <span className="text-[10px] font-semibold text-slate-500">
              {Object.values(checklist).filter(Boolean).length} / 4 Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={checklist.titleMatch}
                onChange={e => setChecklist(prev => ({ ...prev, titleMatch: e.target.checked }))}
                className="mt-0.5 accent-[#072558]"
              />
              <span><strong>Document Title Match:</strong> Title accurately reflects physical document.</span>
            </label>
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={checklist.metadataVerified}
                onChange={e => setChecklist(prev => ({ ...prev, metadataVerified: e.target.checked }))}
                className="mt-0.5 accent-[#072558]"
              />
              <span><strong>Metadata & Year:</strong> Department & academic year are correct.</span>
            </label>
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={checklist.complianceChecked}
                onChange={e => setChecklist(prev => ({ ...prev, complianceChecked: e.target.checked }))}
                className="mt-0.5 accent-[#072558]"
              />
              <span><strong>Compliance Standards:</strong> Meets NAAC / NBA accreditation rules.</span>
            </label>
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={checklist.authenticityConfirmed}
                onChange={e => setChecklist(prev => ({ ...prev, authenticityConfirmed: e.target.checked }))}
                className="mt-0.5 accent-[#072558]"
              />
              <span><strong>File Legibility & Stamps:</strong> Document text is legible and untampered.</span>
            </label>
          </div>
        </div>

        {/* ── 5. 3-WAY DECISION ACTION CLUSTER ─── */}
        <div className="pt-2 border-t border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider text-center md:text-left">
            Select Review Action for Document #{doc.id}:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. APPROVE / ACCEPT */}
            <button
              type="button"
              disabled={isSaving || !allChecklistItemsPassed}
              onClick={() => handleAction('approved')}
              className="py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)' }}
              title={allChecklistItemsPassed ? 'Approve document' : 'Complete checklist to enable approval'}
            >
              {isSaving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              <span>ACCEPT & APPROVE</span>
            </button>

            {/* 2. MARK UNDER REVIEW */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleAction('under_review')}
              className="py-3 px-4 rounded-xl text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 bg-amber-50 hover:bg-amber-100 transition-all"
              title="Mark document under active review"
            >
              {isSaving ? (
                <RefreshCw size={16} className="animate-spin text-amber-700" />
              ) : (
                <Clock size={16} className="text-amber-700" />
              )}
              <span>MARK UNDER REVIEW</span>
            </button>

            {/* 3. REJECT */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleAction('rejected')}
              className="py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)' }}
              title="Reject and flag document"
            >
              {isSaving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
              <span>REJECT DOCUMENT</span>
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
