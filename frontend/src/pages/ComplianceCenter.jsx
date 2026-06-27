// pages/ComplianceCenter.jsx — Centralized Institutional Vault & Statutory Compliance Hub
import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { 
  ShieldCheck, Plus, Trash2, FileText, Eye, Download, 
  Search, X, ExternalLink, FileCheck 
} from 'lucide-react';

const AUTHORITIES = ['NAAC', 'NBA', 'AICTE', 'UGC'];

const ACCREDITATION_INFO = {
  NAAC: {
    title: 'National Assessment and Accreditation Council',
    desc: 'Evaluates and accredits higher education institutions in India. Focuses on overall institutional parameters: teaching-learning quality, faculty credentials, research activity, governance, student outcomes, and infrastructure. Grants institutional grades (A++, A+, A, B, etc.).',
    focus: ['Teaching-Learning Quality', 'Faculty Qualifications', 'Research & Extensions', 'Governance & Leadership']
  },
  NBA: {
    title: 'National Board of Accreditation',
    desc: 'Accredits specific professional and technical programs (e.g. B.Tech, MBA, MCA, M.Tech, Pharmacy) based on Outcome Based Education (OBE). Checks program educational objectives, student performance, syllabus alignment, and continuous improvements.',
    focus: ['Program Outcomes (POs)', 'Syllabus & Curriculum', 'Technical Infrastructure', 'Placement & Progression']
  },
  AICTE: {
    title: 'All India Council for Technical Education',
    desc: 'The statutory body regulating technical education. Defines standards for building norms, equipment, safety, student-teacher ratios, and mandatory disclosures. Ensures technical colleges meet infrastructure requirements before operational approvals.',
    focus: ['Land & Building Norms', 'Mandatory Web Disclosures', 'Anti-Ragging Compliance', 'Lab & Library Standards']
  },
  UGC: {
    title: 'University Grants Commission',
    desc: 'Coordinates, determines, and maintains standards of university education in India. Governs the autonomy status of colleges (12-B / 2-f), implementation of national syllabus regulations (like CBCS), and student/faculty grievance committees.',
    focus: ['Autonomy Status (12B/2f)', 'Academic Performance Indicators', 'Choice Based Credit Systems', 'Grievance Redressal Norms']
  }
};

const CRITERIA_DESCRIPTIONS = {
  NAAC: {
    'C-1.1': 'Curricular Design & Planning',
    'C-1.2': 'Academic Flexibility',
    'C-1.3': 'Curriculum Enrichment & Feedback',
    'C-2.1': 'Student Enrollment & Profile',
    'C-2.2': 'Catering to Student Diversity',
    'C-3.1': 'Promotion of Research & Facilities',
    'C-3.2': 'Resource Mobilization for Research',
    'C-4.1': 'Physical Infrastructure & Classrooms',
    'C-4.2': 'Library Resources & Subscriptions',
    'C-5.1': 'Student Support & Scholarships',
    'C-5.2': 'Student Progression & Placement',
    'C-6.1': 'Institutional Vision & Leadership',
    'C-6.2': 'Strategy Development & Implementation',
    'C-7.1': 'Institutional Values & Social Responsibilities',
  },
  NBA: {
    'F-1': 'Vision, Mission, Program PEOs',
    'F-2': 'Program Curriculum & Teaching-Learning',
    'F-3': 'Course Outcomes & Program Outcomes',
    'F-4': 'Student Performance & Placement Rate',
    'F-5': 'Faculty Information & Contribution',
    'P-1': 'Facilities & Technical Support',
    'P-2': 'Continuous Improvement & Actions',
    'P-3': 'Student Support & Guidance Systems',
  },
  AICTE: {
    'R-1': 'Land, Infrastructure & Building Norms',
    'R-2': 'Academic Calendar & Syllabus Conformity',
    'R-3': 'Lab Equipment & Library Compliance',
    'F-1': 'Mandatory Web Portal Disclosures',
    'F-2': 'Anti-Ragging & Grievance Committees',
    'I-1': 'Industry-Institute Cell (IIPC) Action',
  },
  UGC: {
    'Acc-1': '12(B) & 2(f) Autonomy Status',
    'Acc-2': 'Academic Performance Indicators (API)',
    'Acc-3': 'Choice Based Credit System (CBCS)',
    'Reg-1': 'Student Grievance Redressal (SGRC)',
    'Reg-2': 'Gender Sensitization & Internal Complaints',
  }
};

export default function ComplianceCenter() {
  const [activeTab, setActiveTab] = useState('NAAC');
  const [records, setRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [form, setForm] = useState({ document_id: '', authority: 'NAAC', criteria_code: '', remarks: '' });
  const [loading, setLoading] = useState(true);

  // Live Audit Retrieval System Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCriteria, setFilterCriteria] = useState('');
  const [auditModeOnly, setAuditModeOnly] = useState(false);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/compliance');
      setRecords(data.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecords();
    api.get('/documents?status=approved&limit=100').then(r => setDocuments(r.data.documents || []));
    api.get('/departments').then(r => setDepartments(r.data.departments || []));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/compliance', form);
    setShowModal(false);
    loadRecords();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this compliance record?')) return;
    await api.delete(`/compliance/${id}`);
    loadRecords();
  };

  // Filtered evidence records based on UI interactions
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Filter by active tab (Accreditation Body)
      if (r.authority !== activeTab) return false;

      // 2. Filter by search query (Title, Remarks, criteria description)
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const desc = CRITERIA_DESCRIPTIONS[r.authority]?.[r.criteria_code] || '';
        const titleMatch = r.title?.toLowerCase().includes(queryLower);
        const remarksMatch = r.remarks?.toLowerCase().includes(queryLower);
        const codeMatch = r.criteria_code?.toLowerCase().includes(queryLower);
        const descMatch = desc.toLowerCase().includes(queryLower);
        if (!titleMatch && !remarksMatch && !codeMatch && !descMatch) return false;
      }

      // 3. Filter by department
      if (filterDept && Number(r.department_id) !== Number(filterDept)) return false;

      // 4. Filter by academic year
      if (filterYear && r.academic_year !== filterYear) return false;

      // 5. Filter by criteria code
      if (filterCriteria && r.criteria_code !== filterCriteria) return false;

      return true;
    });
  }, [records, activeTab, searchQuery, filterDept, filterYear, filterCriteria]);

  // General statistics calculations
  const globalStats = useMemo(() => {
    let totalCriteriaCount = 0;
    let totalMappedUnique = 0;
    const mappedPerAuth = {};

    AUTHORITIES.forEach(auth => {
      const criteriaList = Object.keys(CRITERIA_DESCRIPTIONS[auth]);
      totalCriteriaCount += criteriaList.length;

      const authRecords = records.filter(r => r.authority === auth);
      const uniqueMapped = new Set(authRecords.map(r => r.criteria_code));
      totalMappedUnique += uniqueMapped.size;
      
      mappedPerAuth[auth] = {
        total: criteriaList.length,
        mapped: uniqueMapped.size,
        percent: criteriaList.length ? Math.round((uniqueMapped.size / criteriaList.length) * 100) : 0
      };
    });

    const globalPercent = totalCriteriaCount ? Math.round((totalMappedUnique / totalCriteriaCount) * 100) : 0;
    return {
      globalPercent,
      mappedPerAuth,
      totalMappedUnique,
      totalCriteriaCount
    };
  }, [records]);

  // Tab criteria info
  const criteriaList = Object.keys(CRITERIA_DESCRIPTIONS[activeTab] || {});
  const activeTabRecords = records.filter(r => r.authority === activeTab);
  const mappedCriteria = new Set(activeTabRecords.map(r => r.criteria_code));

  const getFullFilePath = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${filePath}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Statutory Compliance Hub</h1>
          <p className="page-sub">Centralized digital locker & audit evidence repository for university accreditation requirements</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setAuditModeOnly(!auditModeOnly)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              auditModeOnly 
                ? 'bg-[#D4AF37] text-slate-900 border-[#D4AF37] shadow-lg' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {auditModeOnly ? '🔒 Exit Inspection Mode' : '🔍 Inspection Ready Mode'}
          </button>
          <button 
            onClick={() => { 
              setForm({ document_id: '', authority: activeTab, criteria_code: '', remarks: '' }); 
              setShowModal(true); 
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Map Document
          </button>
        </div>
      </div>

      {/* COMPLIANCE OVERVIEW & READINESS GAUGES */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Global readiness card */}
        <div className="card bg-gradient-to-br from-[#0B3D91] to-[#1E5AA8] text-white flex flex-col justify-between p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">Institutional Vault</span>
              <ShieldCheck size={24} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-sm font-semibold opacity-80">Overall Audit Readiness</h3>
            <p className="text-3xl font-black mt-2">{globalStats.globalPercent}%</p>
          </div>
          <div className="mt-6">
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#D4AF37] h-full transition-all duration-500" 
                style={{ width: `${globalStats.globalPercent}%` }} 
              />
            </div>
            <div className="flex justify-between items-center text-[10px] opacity-75 mt-2 font-mono">
              <span>{globalStats.totalMappedUnique} / {globalStats.totalCriteriaCount} Criteria Mapped</span>
              <span>All Authorities</span>
            </div>
          </div>
        </div>

        {/* Individual meters */}
        {AUTHORITIES.map(auth => {
          const authStat = globalStats.mappedPerAuth[auth] || { percent: 0, mapped: 0, total: 0 };
          const isActive = activeTab === auth;
          return (
            <button 
              key={auth}
              onClick={() => setActiveTab(auth)}
              className={`card text-left p-5 transition-all duration-300 relative border cursor-pointer hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${
                isActive 
                  ? 'border-[#0B3D91] bg-white ring-1 ring-[#0B3D91]/20' 
                  : 'border-slate-100 bg-white/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                  isActive ? 'bg-[#0B3D91]/10 text-[#0B3D91]' : 'bg-slate-100 text-slate-500'
                }`}>
                  {auth}
                </span>
                <span className="text-lg font-bold text-slate-800">{authStat.percent}%</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-[11px] font-medium text-slate-500 font-mono">
                  {authStat.mapped} of {authStat.total} Standards Mapped
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      isActive 
                        ? 'bg-[#0B3D91]' 
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${authStat.percent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE REGULATORY COMPLIANCE BODY CARD */}
      <div className="card border border-[#0B3D91]/10 p-6 bg-white rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent pointer-events-none rounded-bl-full" />
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="w-12 h-12 rounded-2xl bg-[#0B3D91] text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
            {activeTab}
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                {ACCREDITATION_INFO[activeTab].title}
              </h2>
              <span className="bg-[#D4AF37]/15 text-[#8B6D10] text-[10px] font-bold px-2 py-0.5 rounded uppercase self-start">
                Quality Certificate alignment
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              {ACCREDITATION_INFO[activeTab].desc}
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 self-center mr-1">Compliance Focus:</span>
              {ACCREDITATION_INFO[activeTab].focus.map((f, i) => (
                <span key={i} className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-1 rounded-lg">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE AUDIT RETRIEVAL & FILTER PANEL */}
      <div className="card bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Statutory Audit Retrieval System</h3>
          <span className="text-xs text-slate-500 font-mono ml-auto">Inspection Ready Status: ONLINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="label text-[10px] font-bold tracking-wider">Keyword Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search mapped docs..." 
                className="input-field pl-9 py-2 text-xs"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label text-[10px] font-bold tracking-wider">Department</label>
            <select 
              className="input-field py-2 text-xs"
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.department_code} - {d.department_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-[10px] font-bold tracking-wider">Academic Year</label>
            <input 
              type="text" 
              placeholder="e.g. 2024-25" 
              className="input-field py-2 text-xs"
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-[10px] font-bold tracking-wider">Specific Criterion</label>
            <select 
              className="input-field py-2 text-xs"
              value={filterCriteria}
              onChange={e => setFilterCriteria(e.target.value)}
            >
              <option value="">All {activeTab} Standards</option>
              {criteriaList.map(c => (
                <option key={c} value={c}>{c} - {CRITERIA_DESCRIPTIONS[activeTab][c]}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || filterDept || filterYear || filterCriteria) && (
          <div className="flex justify-end pt-1">
            <button 
              onClick={() => { setSearchQuery(''); setFilterDept(''); setFilterYear(''); setFilterCriteria(''); }}
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
            >
              <X size={12} /> Clear Filter Parameters
            </button>
          </div>
        )}
      </div>

      {/* ACCREDITATION STANDARDS STATUS & AUDIT LOCKER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Standards breakdown */}
        <div className="card space-y-4">
          <div>
            <h3 className="section-title">{activeTab} Accreditation Standards</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Click a code below to filter the evidence library</p>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {criteriaList.map(c => {
              const mapped = mappedCriteria.has(c);
              const desc = CRITERIA_DESCRIPTIONS[activeTab][c] || '';
              const isCurrentFilter = filterCriteria === c;
              
              return (
                <button 
                  key={c}
                  onClick={() => setFilterCriteria(isCurrentFilter ? '' : c)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-1 ${
                    isCurrentFilter
                      ? 'border-[#0B3D91] bg-[#0B3D91]/5 font-semibold text-slate-900'
                      : mapped
                        ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50 text-slate-800'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold font-mono text-[#0B3D91]">{c}</span>
                    {mapped ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <FileCheck size={10} /> Mapped
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Not Mapped</span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-80 leading-snug">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Evidence Locker table */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="section-title">Centralized Evidence Vault ({filteredRecords.length})</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Approved files linked to regulatory standards</p>
            </div>
            {filterCriteria && (
              <span className="bg-[#0B3D91]/10 text-[#0B3D91] text-[10px] font-bold px-2 py-0.5 rounded">
                Filtered: Standard {filterCriteria}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-header text-left">Document & Year</th>
                    <th className="table-header text-left">Accreditation Criterion</th>
                    <th className="table-header text-left">Department</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-start gap-2 max-w-64">
                          <FileText size={16} className="text-[#0B3D91] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-xs truncate" title={r.title}>{r.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                              <span>{r.academic_year || 'Misc'}</span>
                              <span>•</span>
                              <span>{r.file_type?.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">
                              {r.criteria_code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{r.authority}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 truncate max-w-40 mt-0.5">
                            {CRITERIA_DESCRIPTIONS[r.authority]?.[r.criteria_code]}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-[11px] font-medium text-slate-600 block truncate max-w-28" title={r.department_name}>
                          {r.department_name || '—'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setPreviewDoc(r)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Preview File"
                          >
                            <Eye size={13} />
                          </button>
                          <a 
                            href={getFullFilePath(r.file_path)}
                            download
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0B3D91]/5 hover:bg-[#0B3D91]/10 text-[#0B3D91] border border-[#0B3D91]/10 transition-colors"
                            title="Open Link / Download"
                          >
                            <ExternalLink size={13} />
                          </a>
                          <button 
                            onClick={() => handleDelete(r.id)} 
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="table-cell text-center text-slate-400 py-16">
                        <ShieldCheck size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-xs text-slate-500">No matching evidence items</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click "Map Document" to add evidence to this checklist.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED ACCREDITATION COMPLIANCE REVIEW MODAL */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title="Compliance Document Inspection">
        {previewDoc && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-3 text-xs justify-between">
              <div>
                <p className="font-bold text-slate-800">{previewDoc.title}</p>
                <p className="text-slate-400 mt-0.5 font-mono">Mapped to {previewDoc.authority} Criterion {previewDoc.criteria_code}</p>
              </div>
              <div className="text-right">
                <p className="text-[#0B3D91] font-bold">{previewDoc.department_name || 'General'}</p>
                <p className="text-slate-400 mt-0.5 font-mono">{previewDoc.academic_year || 'All Years'}</p>
              </div>
            </div>

            {previewDoc.remarks && (
              <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-xs text-[#8B6D10]">
                <strong className="block mb-0.5">Audit Remarks / Evidence Context:</strong>
                {previewDoc.remarks}
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 h-96 relative flex items-center justify-center">
              {previewDoc.file_type === 'pdf' ? (
                <iframe 
                  src={`${getFullFilePath(previewDoc.file_path)}#toolbar=0`} 
                  className="w-full h-full"
                  title="PDF Document Preview"
                />
              ) : ['jpg', 'jpeg', 'png'].includes(previewDoc.file_type?.toLowerCase()) ? (
                <img 
                  src={getFullFilePath(previewDoc.file_path)} 
                  alt={previewDoc.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <FileText size={48} className="mx-auto text-slate-400 mb-3" />
                  <p className="font-bold text-sm">Preview Unavailable for this file format</p>
                  <p className="text-xs text-slate-400 mt-1">Download this file using the link below to view it.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <a 
                href={getFullFilePath(previewDoc.file_path)} 
                download
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary flex items-center gap-2 text-xs"
              >
                <Download size={14} /> Download File
              </a>
              <button onClick={() => setPreviewDoc(null)} className="btn-secondary text-xs">Close Preview</button>
            </div>
          </div>
        )}
      </Modal>

      {/* MAP DOCUMENT MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Link Document to Regulatory compliance">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label text-xs font-bold text-slate-700">Select Approved Vault Document *</label>
            <select 
              className="input-field" 
              value={form.document_id}
              onChange={e => setForm(f => ({ ...f, document_id: e.target.value }))} 
              required
            >
              <option value="">Select Document...</option>
              {documents.map(d => (
                <option key={d.id} value={d.id}>
                  [{d.academic_year || 'Misc'}] {d.title} ({d.file_name})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Only approved, high-fidelity documents from the digital locker are visible here.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label text-xs font-bold text-slate-700">Accreditation Body *</label>
              <select 
                className="input-field" 
                value={form.authority}
                onChange={e => setForm(f => ({ ...f, authority: e.target.value, criteria_code: '' }))} 
                required
              >
                {AUTHORITIES.map(a => (
                  <option key={a} value={a}>{a} - {ACCREDITATION_INFO[a].title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs font-bold text-slate-700">Criterion Code *</label>
              <select 
                className="input-field" 
                value={form.criteria_code}
                onChange={e => setForm(f => ({ ...f, criteria_code: e.target.value }))}
                required
              >
                <option value="">Select Criteria...</option>
                {Object.keys(CRITERIA_DESCRIPTIONS[form.authority] || {}).map(c => (
                  <option key={c} value={c}>
                    {c} - {CRITERIA_DESCRIPTIONS[form.authority][c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label text-xs font-bold text-slate-700">Auditor Notes / Remarks</label>
            <textarea 
              className="input-field" 
              rows={3} 
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="E.g. Verified syllabus coverage records, B.Tech CSE Course Outcomes mapping, etc..." 
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
            <button type="submit" className="btn-primary text-xs flex items-center gap-1">
              <FileCheck size={14} /> Map to Standards
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
