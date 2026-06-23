// App.jsx — Route definitions
// All 13 pages mapped to their URLs. Easy to add new pages here.

import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout    from './layouts/MainLayout';

// Pages
import Home             from './pages/Home';
import Register         from './pages/Register';
import Login            from './pages/Login';
import Dashboard        from './pages/Dashboard';
import DepartmentVault  from './pages/DepartmentVault';
import UploadDocument   from './pages/UploadDocument';
import SearchDocuments  from './pages/SearchDocuments';
import OCRResults       from './pages/OCRResults';
import ComplianceCenter from './pages/ComplianceCenter';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import ArchiveCenter    from './pages/ArchiveCenter';
import AuditLogs        from './pages/AuditLogs';
import UserManagement   from './pages/UserManagement';
import ReportsAnalytics from './pages/ReportsAnalytics';
import ProfileSettings  from './pages/ProfileSettings';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected — wrapped in sidebar + topbar layout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/vault"       element={<DepartmentVault />} />
        <Route path="/upload"      element={<UploadDocument />} />
        <Route path="/search"      element={<SearchDocuments />} />
        <Route path="/ocr/:id"     element={<OCRResults />} />
        <Route path="/compliance"  element={<ComplianceCenter />} />
        <Route path="/workflow"    element={<ApprovalWorkflow />} />
        <Route path="/archive"     element={<ArchiveCenter />} />
        <Route path="/audit"       element={<AuditLogs />} />
        <Route path="/users"       element={
          <ProtectedRoute roles={['super_admin','admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/reports"     element={<ReportsAnalytics />} />
        <Route path="/profile"     element={<ProfileSettings />} />
      </Route>
    </Routes>
  );
}
