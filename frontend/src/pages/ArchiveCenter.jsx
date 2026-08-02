// pages/ArchiveCenter.jsx

import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Archive, Plus, Calendar } from 'lucide-react';

export default function ArchiveCenter() {
  const [archives,  setArchives]  = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ document_id:'', archive_reason:'' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ar, docs] = await Promise.all([
        api.get('/archive'),
        api.get('/documents?status=approved&limit=100'),
      ]);
      setArchives(ar.data.archives || []);
      setDocuments(docs.data.documents || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      setLoading(true);
      try {
        const [ar, docs] = await Promise.all([
          api.get('/archive'),
          api.get('/documents?status=approved&limit=100'),
        ]);
        if (active) {
          setArchives(ar.data.archives || []);
          setDocuments(docs.data.documents || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const handleArchive = async (e) => {
    e.preventDefault();
    await api.post('/archive', form);
    setShowModal(false);
    loadData();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Archive Center</h1>
          <p className="page-sub">Long-term preservation of historical records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Archive Document
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archives.map(a => (
            <div key={a.id} className="card card-hover">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Archive size={18} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate truncate">{a.title}</p>
                  <p className="text-xs text-slate/50 mt-0.5">{a.department_name}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate/50">
                    <Calendar size={11} />
                    {new Date(a.archive_date).toLocaleDateString('en-IN')}
                  </div>
                  {a.archive_reason && (
                    <p className="text-xs text-slate/60 mt-1 italic">"{a.archive_reason}"</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {archives.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate/40">
              <Archive size={40} className="mx-auto mb-3 opacity-30" />
              <p>No archived documents yet.</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Archive Document">
        <form onSubmit={handleArchive} className="space-y-4">
          <div>
            <label className="label">Select Document *</label>
            <select className="input-field" value={form.document_id}
              onChange={e => setForm(f => ({...f, document_id: e.target.value}))} required>
              <option value="">Choose a document</option>
              {documents.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Archive Reason</label>
            <textarea className="input-field" rows={3}
              value={form.archive_reason}
              onChange={e => setForm(f => ({...f, archive_reason: e.target.value}))}
              placeholder="Why is this document being archived?" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Archive</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
