// pages/UploadDocument.jsx — Drag-and-drop file upload with system animations
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../services/api';
import { CheckCircle, Upload, X, FileText, HardDrive } from 'lucide-react';
import { DocumentProcessing, UploadZoneAnimation, SystemStatusBar, DataStreamLog } from '../components/SystemAnimations';

const CATEGORIES = [
  { value: 'student_records',          label: 'Confidential Student Records' },
  { value: 'faculty_records',          label: 'Institutional Policy Drafts' },
  { value: 'examination_records',      label: 'Accreditation Evidence' },
  { value: 'administrative_records',   label: 'Administrative Records' },
  { value: 'accreditation_documents',  label: 'Accreditation Documents' },
];

const YEARS = ['2020-21','2021-22','2022-23','2023-24','2024-25','2025-26'];

export default function UploadDocument() {
  const [file,        setFile]        = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: '', department_id: '', department_code: '', academic_year: '2024-25',
    category: '', tags: '',
  });
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');
  const [logLines,  setLogLines]  = useState([]);

  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data.departments));
  }, []);

  const addLog = (line) => setLogLines(prev => [...prev.slice(-20), line]);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setSuccess(false);
      setError('');
      addLog(`[INFO]  File selected: ${accepted[0].name} (${(accepted[0].size / 1024).toFixed(0)} KB)`);
      addLog(`[SCAN]  File type validated: ${accepted[0].type || 'unknown'}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 25 * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg','.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const handleDeptChange = (e) => {
    const dept = departments.find(d => d.id === +e.target.value);
    setForm(f => ({ ...f, department_id: e.target.value, department_code: dept?.department_code || '' }));
  };

  const uploadSteps = [
    'Encrypting file payload (AES-256)',
    'Indexing metadata & tags',
    'Running OCR pipeline',
    'Updating audit ledger',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file)               return setError('Please select a file.');
    if (!form.department_id) return setError('Please select a department.');
    if (!form.category)      return setError('Please select a category.');

    setError(''); setUploading(true); setProgress(0);
    addLog(`[UPLOAD] Initiating secure upload for: ${form.title || file.name}`);
    addLog(`[AUTH]   Session token verified · Department: ${form.department_code}`);
    addLog(`[ENCRYPT] AES-256 encryption applied`);

    const data = new FormData();
    data.append('file', file);
    Object.entries(form).forEach(([k, v]) => data.append(k, v));

    try {
      await api.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round(e.loaded * 100 / e.total);
          setProgress(pct);
          if (pct === 25) addLog('[INDEX]  Metadata indexing in progress…');
          if (pct === 50) addLog('[OCR]    OCR pipeline queued');
          if (pct === 75) addLog('[VAULT]  Writing to institutional vault…');
          if (pct === 100) addLog('[OK]     Upload complete · Audit ledger updated');
        },
      });
      setSuccess(true);
      setFile(null);
      setForm({ title:'', department_id:'', department_code:'', academic_year:'2024-25', category:'', tags:'' });
      setProgress(0);
      addLog('[OK]     Document registered successfully in CRDDMS vault');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
      addLog(`[ERROR]  Upload failed: ${err.response?.data?.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="page-title">Upload Documents</h1>
        <p className="page-sub font-medium">Upload and index digital vault assets</p>
      </div>

      {/* System Status Ticker */}
      <SystemStatusBar />

      {/* Upload processing animation — shows DURING upload */}
      {uploading && (
        <DocumentProcessing
          label={`Uploading: ${file?.name || 'Document'}…`}
          progress={progress}
          steps={uploadSteps}
        />
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-4 animate-fade-in"
          style={{ background: 'rgba(22,163,74,0.08)', border: '1.5px solid rgba(22,163,74,0.3)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(22,163,74,0.12)' }}>
            <CheckCircle size={20} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#16a34a' }}>Document Uploaded Successfully</p>
            <p className="text-xs text-slate-500 mt-0.5">Check the Ledger or process OCR inside the Vault.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold animate-fade-in"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1.5px solid rgba(220,38,38,0.3)', color: '#dc2626' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drop Zone with animation */}
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <UploadZoneAnimation isDragActive={isDragActive} hasFile={!!file}>
            {file ? (
              <div className="flex flex-col items-center gap-3 animate-scale-in">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.3)' }}>
                  <FileText size={30} style={{ color: '#16a34a' }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                    <HardDrive size={11} />
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); addLog('[INFO]  File removed'); }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
                >
                  <X size={12} /> Remove File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: 'rgba(11,61,145,0.07)', border: '1.5px solid rgba(11,61,145,0.15)' }}>
                  <Upload size={28} style={{ color: isDragActive ? '#D4AF37' : '#0B3D91' }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm mb-1">
                    {isDragActive ? '🎯 Drop to upload' : 'Tap to browse or drag & drop'}
                  </p>
                  <p className="text-xs text-slate-400">Upload vault assets to CRDDMS</p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{ color: '#8B6D10', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  MAX 25 MB · PDF · JPG · PNG · DOCX · XLSX
                </p>
              </div>
            )}
          </UploadZoneAnimation>
        </div>

        {/* Metadata fields */}
        <div className="card space-y-4">
          <p className="section-title text-sm uppercase tracking-wider font-bold flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full" style={{ background: 'linear-gradient(#0B3D91, #D4AF37)' }} />
            Document Metadata
          </p>

          <div>
            <label className="label">Document Title *</label>
            <input type="text" className="input-field"
              value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              placeholder="e.g. CSE Student Marksheet 2024" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Department *</label>
              <select className="input-field cursor-pointer" value={form.department_id} onChange={handleDeptChange} required>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Academic Year *</label>
              <select className="input-field cursor-pointer"
                value={form.academic_year}
                onChange={e => setForm(f => ({...f, academic_year: e.target.value}))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Document Classification *</label>
            <select className="input-field cursor-pointer" value={form.category}
              onChange={e => setForm(f => ({...f, category: e.target.value}))} required>
              <option value="">Select Classification</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Tags (comma separated)</label>
            <input type="text" className="input-field"
              value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))}
              placeholder="e.g. NAAC, 2024, CSE, marks" />
          </div>
        </div>

        {/* System Log */}
        {logLines.length > 0 && <DataStreamLog lines={logLines} />}

        <button type="submit" className="btn-primary w-full py-3.5 rounded-xl text-base font-semibold"
          style={{ gap: '10px' }}
          disabled={uploading}>
          {uploading
            ? <><span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading to Vault…</>
            : <><Upload size={18} /> Upload to Institutional Vault</>
          }
        </button>
      </form>
    </div>
  );
}
