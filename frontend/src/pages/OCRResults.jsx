// pages/OCRResults.jsx — OCR viewer with scan animation
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ScanText, RefreshCw, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { OcrScanAnimation, DataStreamLog, SystemStatusBar } from '../components/SystemAnimations';

export default function OCRResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc,        setDoc]        = useState(null);
  const [ocr,        setOcr]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState('');
  const [logLines,   setLogLines]   = useState([]);
  const [showScan,   setShowScan]   = useState(false);

  const addLog = (line) => setLogLines(prev => [...prev.slice(-20), line]);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    addLog(`[INFO]  Loading document #${id} from vault`);
    try {
      const [docRes, ocrRes] = await Promise.allSettled([
        api.get(`/documents/${id}`),
        api.get(`/ocr/${id}`),
      ]);
      if (docRes.status === 'fulfilled') {
        setDoc(docRes.value.data.document);
        addLog(`[OK]    Document metadata loaded: ${docRes.value.data.document?.title}`);
      }
      if (ocrRes.status === 'fulfilled') {
        setOcr(ocrRes.value.data.ocr);
        addLog('[OK]    OCR result retrieved from cache');
      } else {
        addLog('[INFO]  No OCR result found · Run OCR to process');
      }
    } finally {
      setLoading(false);
    }
  };

  const processOCR = async () => {
    setProcessing(true);
    setShowScan(true);
    setError('');
    addLog('[OCR]   Initiating OCR Engine v2.1…');
    addLog('[SCAN]  Document scan in progress…');
    addLog('[ML]    Neural text extraction active');
    try {
      const { data } = await api.post(`/ocr/process/${id}`);
      setOcr(data.ocr);
      addLog(`[OK]    OCR complete · Confidence: ${data.ocr?.confidence_score}%`);
      addLog('[INDEX] Text indexed for search');
    } catch (err) {
      setError(err.response?.data?.message || 'OCR processing failed.');
      addLog(`[ERROR] OCR failed: ${err.response?.data?.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setTimeout(() => setShowScan(false), 600);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-slate-200 rounded-full" />
        <div className="w-14 h-14 border-4 border-t-[#0B3D91] border-r-[#D4AF37] rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-sm text-slate-400 font-medium animate-pulse">Loading document from vault…</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">OCR Results</h1>
          <p className="page-sub">{doc?.title || `Document #${id}`}</p>
        </div>
      </div>

      {/* System Status Ticker */}
      <SystemStatusBar />

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 animate-fade-in"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Document info card */}
      {doc && (
        <div className="card animate-card-enter">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'File Type',   value: doc.file_type?.toUpperCase() },
              { label: 'Department',  value: doc.department_code || '—' },
              { label: 'Category',    value: doc.category?.replace(/_/g,' ') },
              { label: 'Status',      value: doc.status },
            ].map(item => (
              <div key={item.label}>
                <p className="label">{item.label}</p>
                <p className="font-semibold capitalize text-[#0B3D91]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Scan Animation */}
      {showScan && <OcrScanAnimation isScanning={processing} />}

      {/* OCR Result card */}
      <div className="card animate-card-enter">
        <div className="flex items-center justify-between mb-5">
          <p className="section-title flex items-center gap-2 mb-0">
            <ScanText size={16} style={{ color: '#D4AF37' }} />
            Extracted Text
          </p>
          <button onClick={processOCR} disabled={processing}
            className="btn-secondary flex items-center gap-2 text-sm">
            {processing
              ? <><span className="w-4 h-4 border-2 border-[#0B3D91] border-t-transparent rounded-full animate-spin" /> Scanning…</>
              : <><RefreshCw size={15} /> Run OCR</>
            }
          </button>
        </div>

        {ocr ? (
          <>
            {/* Confidence gauge */}
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl animate-fade-in"
              style={{ background: '#F8FAFF', border: '1px solid rgba(11,61,145,0.08)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: ocr.confidence_score > 70 ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)' }}>
                {ocr.confidence_score > 70
                  ? <CheckCircle size={22} style={{ color: '#16a34a' }} />
                  : <AlertCircle size={22} style={{ color: '#d97706' }} />
                }
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <p className="text-sm font-bold text-slate-800">
                    Confidence Score: <span style={{ color: ocr.confidence_score > 70 ? '#16a34a' : '#d97706' }}>
                      {ocr.confidence_score}%
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(ocr.processed_at || ocr.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill"
                    style={{
                      width: `${ocr.confidence_score}%`,
                      background: ocr.confidence_score > 70
                        ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                        : 'linear-gradient(90deg, #d97706, #fbbf24)',
                    }} />
                </div>
              </div>
            </div>

            {/* Extracted text */}
            <div className="rounded-xl p-4 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap"
              style={{ background: '#0B1220', color: '#7dd3fc', border: '1px solid rgba(11,61,145,0.3)', fontSize: '0.78rem' }}>
              <div style={{ color: 'rgba(212,175,55,0.6)', fontSize: '0.65rem', marginBottom: '12px', letterSpacing: '0.1em' }}>
                ▶ EXTRACTED TEXT · {ocr.confidence_score}% CONFIDENCE
              </div>
              {ocr.extracted_text || '(No text extracted)'}
            </div>
          </>
        ) : (
          <div className="text-center py-14">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(11,61,145,0.05)', border: '1.5px dashed rgba(11,61,145,0.2)' }}>
              <ScanText size={28} style={{ color: '#0B3D91', opacity: 0.4 }} />
            </div>
            <p className="text-sm font-semibold text-slate-500">No OCR result yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Run OCR" to extract text from this document</p>
          </div>
        )}
      </div>

      {/* System Log */}
      {logLines.length > 0 && <DataStreamLog lines={logLines} />}
    </div>
  );
}
